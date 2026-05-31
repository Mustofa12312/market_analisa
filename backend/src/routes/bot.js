/**
 * Bot Control Routes — start, pause, stop, mode, settings
 */
const express = require('express');
const { authMiddleware } = require('./auth');
const { getBotState, setBotState, getDb, addLog } = require('../models/database');
const { setRiskConfig, getRiskConfig } = require('../services/riskEngine');
const { sendNotification } = require('../services/telegramService');

const router = express.Router();

// GET /api/bot/status
router.get('/status', authMiddleware, (req, res) => {
  try {
    const status = getBotState('status');
    const mode = getBotState('mode');
    const activePairs = getBotState('active_pairs');
    const dailyLoss = parseFloat(getBotState('daily_loss') || '0');
    const dailyPnl = parseFloat(getBotState('daily_pnl') || '0');
    const paperBalance = parseFloat(getBotState('paper_balance') || '10000');

    res.json({
      status,
      mode,
      activePairs: activePairs ? activePairs.split(',') : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
      dailyLoss,
      dailyPnl,
      paperBalance,
      riskConfig: getRiskConfig()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/start
router.post('/start', authMiddleware, (req, res) => {
  try {
    setBotState('status', 'running');
    addLog('info', 'Bot started by user', { userId: req.user.id });

    // Notify via Telegram
    sendNotification('info', { message: '🤖 Bot started — Paper Trading mode active' }).catch(() => {});

    res.json({ status: 'running', message: 'Bot started successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/pause
router.post('/pause', authMiddleware, (req, res) => {
  try {
    setBotState('status', 'paused');
    addLog('info', 'Bot paused by user');
    res.json({ status: 'paused', message: 'Bot paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/stop
router.post('/stop', authMiddleware, (req, res) => {
  try {
    setBotState('status', 'stopped');
    addLog('info', 'Bot stopped by user');
    sendNotification('stop', { reason: 'Bot manually stopped by user' }).catch(() => {});
    res.json({ status: 'stopped', message: 'Bot stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/mode
router.post('/mode', authMiddleware, (req, res) => {
  try {
    const { mode } = req.body;
    if (!['paper', 'live'].includes(mode)) {
      return res.status(400).json({ error: 'Mode must be paper or live' });
    }
    setBotState('mode', mode);
    addLog('info', `Bot mode changed to: ${mode}`);
    res.json({ mode, message: `Mode switched to ${mode}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/pairs
router.post('/pairs', authMiddleware, (req, res) => {
  try {
    const { pairs } = req.body;
    if (!Array.isArray(pairs) || pairs.length === 0) {
      return res.status(400).json({ error: 'Pairs must be a non-empty array' });
    }
    const pairsStr = pairs.map(p => p.toUpperCase()).join(',');
    setBotState('active_pairs', pairsStr);
    addLog('info', `Active pairs updated: ${pairsStr}`);
    res.json({ activePairs: pairs, message: 'Pairs updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/risk
router.post('/risk', authMiddleware, (req, res) => {
  try {
    const {
      maxRiskPerTrade,
      maxDailyLoss,
      takeProfit,
      stopLoss,
      minAIScore,
      maxOpenPositions
    } = req.body;

    const config = {};
    if (maxRiskPerTrade !== undefined) config.maxRiskPerTrade = parseFloat(maxRiskPerTrade);
    if (maxDailyLoss !== undefined) config.maxDailyLoss = parseFloat(maxDailyLoss);
    if (takeProfit !== undefined) config.takeProfit = parseFloat(takeProfit);
    if (stopLoss !== undefined) config.stopLoss = parseFloat(stopLoss);
    if (minAIScore !== undefined) config.minAIScore = parseFloat(minAIScore);
    if (maxOpenPositions !== undefined) config.maxOpenPositions = parseInt(maxOpenPositions);

    setRiskConfig(config);
    addLog('info', 'Risk config updated', config);

    res.json({ riskConfig: getRiskConfig(), message: 'Risk config updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bot/logs?limit=50
router.get('/logs', authMiddleware, (req, res) => {
  try {
    const { limit = 50, level } = req.query;
    const db = getDb();
    let query = 'SELECT * FROM bot_logs';
    const params = [];
    if (level) {
      query += ' WHERE level = ?';
      params.push(level);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const logs = db.prepare(query).all(...params);
    res.json(logs.map(l => ({ ...l, data: l.data ? JSON.parse(l.data) : null })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bot/manual-trade — manual paper trade trigger
router.post('/manual-trade', authMiddleware, async (req, res) => {
  try {
    const { symbol, action } = req.body;
    const marketService = require('../services/marketService');
    const signalEngine = require('../services/signalEngine');
    const riskEngine = require('../services/riskEngine');
    const paperEngine = require('../services/paperTradingEngine');
    const { getBotState } = require('../models/database');

    const candles = await marketService.fetchCandles(symbol.toUpperCase(), '15m', 100);
    const analysis = signalEngine.analyzeCandles(symbol.toUpperCase(), candles);

    if (action === 'BUY') {
      const balance = parseFloat(getBotState('paper_balance') || '10000');
      const validation = riskEngine.validateTrade({ ...analysis, signal: 'BUY' }, balance);

      if (!validation.approved) {
        return res.json({ success: false, reason: validation.reason });
      }

      const result = paperEngine.executeBuy(analysis, validation);
      sendNotification('buy', {
        symbol,
        entryPrice: analysis.price,
        aiScore: analysis.aiScore,
        stopLoss: validation.stopLossPrice,
        takeProfit: validation.takeProfitPrice,
        quantity: validation.positionSize
      }).catch(() => {});

      return res.json(result);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
