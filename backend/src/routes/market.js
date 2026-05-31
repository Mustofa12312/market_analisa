/**
 * Market Routes — prices, candles, ticker
 */
const express = require('express');
const { authMiddleware } = require('./auth');
const marketService = require('../services/marketService');
const signalEngine = require('../services/signalEngine');

const router = express.Router();

// GET /api/market/prices
router.get('/prices', authMiddleware, (req, res) => {
  const prices = marketService.getAllPrices();
  res.json(prices);
});

// GET /api/market/price/:symbol
router.get('/price/:symbol', authMiddleware, (req, res) => {
  const price = marketService.getPrice(req.params.symbol.toUpperCase());
  if (!price) return res.status(404).json({ error: 'Symbol not found' });
  res.json(price);
});

// GET /api/market/candles/:symbol?interval=15m&limit=100
router.get('/candles/:symbol', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '15m', limit = 100 } = req.query;
    const candles = await marketService.fetchCandles(symbol.toUpperCase(), interval, parseInt(limit));
    res.json(candles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/signals
router.get('/signals', authMiddleware, async (req, res) => {
  try {
    const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const analyses = await Promise.all(
      pairs.map(async (sym) => {
        const candles = await marketService.fetchCandles(sym, '15m', 100);
        return signalEngine.analyzeCandles(sym, candles);
      })
    );
    const ranked = signalEngine.rankCoins(analyses);
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/signal/:symbol
router.get('/signal/:symbol', authMiddleware, async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase();
    const candles = await marketService.fetchCandles(sym, '15m', 100);
    const analysis = signalEngine.analyzeCandles(sym, candles);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/ticker/:symbol
router.get('/ticker/:symbol', authMiddleware, async (req, res) => {
  try {
    const ticker = await marketService.fetchTicker(req.params.symbol.toUpperCase());
    if (!ticker) return res.status(404).json({ error: 'Ticker not found' });
    res.json(ticker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
