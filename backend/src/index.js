require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');

const { getDb, getBotState, addLog } = require('./models/database');
const marketService = require('./services/marketService');
const signalEngine = require('./services/signalEngine');
const riskEngine = require('./services/riskEngine');
const paperEngine = require('./services/paperTradingEngine');
const { sendNotification } = require('./services/telegramService');

const { router: authRouter } = require('./routes/auth');
const marketRouter = require('./routes/market');
const tradesRouter = require('./routes/trades');
const botRouter = require('./routes/bot');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// ---- Middleware ----
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  if (!req.path.includes('/health')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ---- REST Routes ----
app.use('/api/auth', authRouter);
app.use('/api/market', marketRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/bot', botRouter);
app.use('/api/settings', settingsRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    botStatus: getBotState('status'),
    mode: getBotState('mode')
  });
});

// ---- HTTP Server + WebSocket ----
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const wsClients = new Set();

wss.on('connection', (ws, req) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected. Total: ${wsClients.size}`);

  // Send initial state
  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      botStatus: getBotState('status'),
      mode: getBotState('mode'),
      balance: parseFloat(getBotState('paper_balance') || '10000')
    }
  }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch(e) {}
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${wsClients.size}`);
  });

  ws.on('error', () => {
    wsClients.delete(ws);
  });
});

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: Date.now() });
  wsClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(msg); } catch(e) {}
    }
  });
}

// ---- Market Data Subscription ----
marketService.subscribe((event, data) => {
  if (event === 'price') {
    broadcast('price', data);
  }
});

// ---- Bot Trading Loop ----
let tradingInterval = null;
let lastSignals = {};

async function runTradingCycle() {
  const botStatus = getBotState('status');
  if (botStatus !== 'running') return;

  const pairsStr = getBotState('active_pairs') || 'BTCUSDT,ETHUSDT,SOLUSDT';
  const pairs = pairsStr.split(',').filter(Boolean);

  try {
    const analyses = await Promise.all(
      pairs.map(async (sym) => {
        const candles = await marketService.fetchCandles(sym, '15m', 100);
        return signalEngine.analyzeCandles(sym, candles);
      })
    );

    const ranked = signalEngine.rankCoins(analyses);

    // Broadcast signals to frontend
    broadcast('signals', ranked);

    // Store last signals
    ranked.forEach(a => { lastSignals[a.symbol] = a; });

    // Save signals to DB
    const db = getDb();
    ranked.forEach(analysis => {
      if (!analysis.error) {
        db.prepare(`
          INSERT INTO signals (symbol, signal, confidence, ai_score, rsi, macd_line, 
            macd_signal, macd_histogram, ema_fast, ema_slow, bb_upper, bb_middle, bb_lower, 
            price, volume, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          analysis.symbol,
          analysis.signal,
          analysis.confidence,
          analysis.aiScore,
          analysis.indicators?.rsi || null,
          analysis.indicators?.macd?.line || null,
          analysis.indicators?.macd?.signal || null,
          analysis.indicators?.macd?.histogram || null,
          analysis.indicators?.ema?.fast || null,
          analysis.indicators?.ema?.slow || null,
          analysis.indicators?.bb?.upper || null,
          analysis.indicators?.bb?.middle || null,
          analysis.indicators?.bb?.lower || null,
          analysis.price,
          analysis.volume || null,
          analysis.reasons ? analysis.reasons.join('; ') : null
        );
      }
    });

    // Auto-trade on strong signals
    const mode = getBotState('mode');
    if (mode === 'paper') {
      for (const analysis of ranked) {
        if (analysis.signal === 'BUY' && analysis.aiScore >= 65) {
          const balance = parseFloat(getBotState('paper_balance') || '10000');
          const validation = riskEngine.validateTrade(analysis, balance);

          if (validation.approved) {
            const result = paperEngine.executeBuy(analysis, validation);
            if (result.success) {
              broadcast('trade_opened', result);
              sendNotification('buy', {
                symbol: analysis.symbol,
                entryPrice: analysis.price,
                aiScore: analysis.aiScore,
                stopLoss: validation.stopLossPrice,
                takeProfit: validation.takeProfitPrice,
                quantity: validation.positionSize
              }).catch(() => {});
            }
          }
        }

        // Notify on strong signal (score >= 75)
        if (analysis.aiScore >= 75) {
          const lastScore = lastSignals[analysis.symbol]?.aiScore || 0;
          if (analysis.aiScore >= 75 && lastScore < 75) {
            sendNotification('signal', {
              symbol: analysis.symbol,
              signal: analysis.signal,
              score: analysis.aiScore,
              price: analysis.price,
              rsi: analysis.indicators?.rsi
            }).catch(() => {});
          }
        }
      }
    }

    // Monitor open positions for TP/SL
    const prices = marketService.getAllPrices();
    if (Object.keys(prices).length > 0) {
      const closedTrades = paperEngine.monitorPositions(prices);
      if (closedTrades && closedTrades.length > 0) {
        closedTrades.forEach(t => broadcast('trade_closed', t));
      }
    }

    // Broadcast stats
    const stats = paperEngine.getPerformanceStats();
    broadcast('stats', stats);

  } catch (err) {
    addLog('error', 'Trading cycle error', { error: err.message });
  }
}

// ---- Init ----
async function init() {
  // Initialize DB
  getDb();
  console.log('[DB] Database initialized');

  // Start market data (mock if Binance unreachable)
  const pairs = (process.env.DEFAULT_PAIRS || 'BTCUSDT,ETHUSDT,SOLUSDT').split(',');

  // Try Binance first, fallback to mock
  try {
    marketService.connectPriceStream(pairs);
    console.log('[Market] Connecting to Binance WebSocket...');
  } catch(e) {
    console.log('[Market] Using mock price stream');
    marketService.startMockPriceStream(pairs);
  }

  // Fetch initial candles
  setTimeout(async () => {
    for (const sym of pairs) {
      await marketService.fetchCandles(sym, '15m', 100);
      console.log(`[Market] Candles fetched: ${sym}`);
    }
  }, 2000);

  // Trading loop every 30 seconds
  tradingInterval = setInterval(runTradingCycle, 30000);

  // Run first cycle after 5 seconds
  setTimeout(runTradingCycle, 5000);

  // Reset daily stats at midnight
  cron.schedule('0 0 * * *', () => {
    const { resetDailyStats } = require('./services/riskEngine');
    resetDailyStats();
  });

  // Broadcast bot state every 5 seconds
  setInterval(() => {
    broadcast('bot_state', {
      status: getBotState('status'),
      mode: getBotState('mode'),
      balance: parseFloat(getBotState('paper_balance') || '10000'),
      dailyLoss: parseFloat(getBotState('daily_loss') || '0'),
      dailyPnl: parseFloat(getBotState('daily_pnl') || '0')
    });
  }, 5000);

  // Start server
  server.listen(PORT, () => {
    console.log(`\n🚀 Backend running at http://localhost:${PORT}`);
    console.log(`📡 WebSocket at ws://localhost:${PORT}/ws`);
    console.log(`🌐 REST API at http://localhost:${PORT}/api`);
    console.log(`📋 Default login: admin / admin123\n`);
    addLog('info', `Server started on port ${PORT}`);
  });
}

init().catch(err => {
  console.error('[FATAL] Init error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
