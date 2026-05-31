const axios = require('axios');
const WebSocket = require('ws');
const { addLog } = require('../models/database');

const BINANCE_REST = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/stream';

// Store candle data in memory
const candleStore = {};
const priceStore = {};
const wsConnections = {};

// Subscribers (backend internal listeners)
const subscribers = [];

function subscribe(fn) {
  subscribers.push(fn);
}

function emit(event, data) {
  subscribers.forEach(fn => {
    try { fn(event, data); } catch(e) {}
  });
}

// Fetch OHLCV candles from Binance REST
async function fetchCandles(symbol, interval = '15m', limit = 100) {
  try {
    const res = await axios.get(`${BINANCE_REST}/klines`, {
      params: { symbol, interval, limit },
      timeout: 10000
    });
    const candles = res.data.map(c => ({
      time: Math.floor(c[0] / 1000),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    }));
    candleStore[`${symbol}_${interval}`] = candles;
    return candles;
  } catch (err) {
    addLog('error', `Failed to fetch candles for ${symbol}`, { error: err.message });
    return candleStore[`${symbol}_${interval}`] || generateMockCandles(symbol);
  }
}

// Generate mock candles if Binance is unavailable
function generateMockCandles(symbol) {
  const basePrices = { BTCUSDT: 67000, ETHUSDT: 3500, SOLUSDT: 180 };
  const base = basePrices[symbol] || 1000;
  const candles = [];
  let price = base;
  const now = Math.floor(Date.now() / 1000);

  for (let i = 99; i >= 0; i--) {
    const change = (Math.random() - 0.48) * base * 0.02;
    price = Math.max(price + change, base * 0.5);
    const open = price;
    const close = price + (Math.random() - 0.48) * base * 0.01;
    candles.push({
      time: now - i * 900,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat((Math.max(open, close) * (1 + Math.random() * 0.005)).toFixed(2)),
      low: parseFloat((Math.min(open, close) * (1 - Math.random() * 0.005)).toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat((Math.random() * 1000 + 100).toFixed(2))
    });
    price = close;
  }
  return candles;
}

// Connect to Binance WebSocket for live prices
function connectPriceStream(pairs) {
  const streams = pairs.map(p => `${p.toLowerCase()}@ticker`).join('/');
  const wsUrl = `${BINANCE_WS}?streams=${streams}`;

  if (wsConnections['price']) {
    try { wsConnections['price'].terminate(); } catch(e) {}
  }

  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    addLog('info', 'Binance WebSocket connected', { pairs });
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.data && msg.data.s) {
        const ticker = msg.data;
        const priceData = {
          symbol: ticker.s,
          price: parseFloat(ticker.c),
          change: parseFloat(ticker.P),
          changeAbs: parseFloat(ticker.p),
          high: parseFloat(ticker.h),
          low: parseFloat(ticker.l),
          volume: parseFloat(ticker.v),
          quoteVolume: parseFloat(ticker.q),
          timestamp: Date.now()
        };
        priceStore[ticker.s] = priceData;
        emit('price', priceData);
      }
    } catch(e) {}
  });

  ws.on('error', (err) => {
    addLog('warn', 'Binance WS error, using mock data', { error: err.message });
    startMockPriceStream(pairs);
  });

  ws.on('close', () => {
    addLog('info', 'Binance WS closed, reconnecting in 5s...');
    setTimeout(() => connectPriceStream(pairs), 5000);
  });

  wsConnections['price'] = ws;
}

// Mock price stream for when Binance is unreachable
let mockPriceInterval = null;
const mockPrices = { BTCUSDT: 67000, ETHUSDT: 3500, SOLUSDT: 180 };

function startMockPriceStream(pairs) {
  if (mockPriceInterval) clearInterval(mockPriceInterval);

  mockPriceInterval = setInterval(() => {
    pairs.forEach(symbol => {
      const base = mockPrices[symbol] || 1000;
      const change = (Math.random() - 0.498) * base * 0.001;
      mockPrices[symbol] = Math.max(mockPrices[symbol] + change, base * 0.5);
      const price = parseFloat(mockPrices[symbol].toFixed(2));
      const change24h = (Math.random() - 0.4) * 5;

      const priceData = {
        symbol,
        price,
        change: parseFloat(change24h.toFixed(2)),
        changeAbs: parseFloat((price * change24h / 100).toFixed(2)),
        high: parseFloat((price * 1.02).toFixed(2)),
        low: parseFloat((price * 0.98).toFixed(2)),
        volume: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
        quoteVolume: parseFloat((Math.random() * 5000000 + 1000000).toFixed(2)),
        timestamp: Date.now(),
        isMock: true
      };
      priceStore[symbol] = priceData;
      emit('price', priceData);
    });
  }, 1000);
}

function getPrice(symbol) {
  return priceStore[symbol] || null;
}

function getAllPrices() {
  return priceStore;
}

function getCandles(symbol, interval = '15m') {
  return candleStore[`${symbol}_${interval}`] || [];
}

// Fetch 24h ticker stats
async function fetchTicker(symbol) {
  try {
    const res = await axios.get(`${BINANCE_REST}/ticker/24hr`, {
      params: { symbol },
      timeout: 8000
    });
    return res.data;
  } catch(err) {
    return null;
  }
}

module.exports = {
  fetchCandles,
  connectPriceStream,
  startMockPriceStream,
  getPrice,
  getAllPrices,
  getCandles,
  fetchTicker,
  subscribe,
  generateMockCandles
};
