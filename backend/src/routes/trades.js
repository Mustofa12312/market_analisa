/**
 * Trades Routes — trade journal, open/close positions
 */
const express = require('express');
const { authMiddleware } = require('./auth');
const { getDb } = require('../models/database');
const paperEngine = require('../services/paperTradingEngine');
const { getBotState } = require('../models/database');

const router = express.Router();

// GET /api/trades?limit=50&offset=0&status=all
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { limit = 50, offset = 0, status = 'all', symbol } = req.query;

    let query = 'SELECT * FROM trades';
    const params = [];
    const conditions = [];

    if (status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (symbol) {
      conditions.push('symbol = ?');
      params.push(symbol.toUpperCase());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const trades = db.prepare(query).all(...params);

    // Parse indicators JSON
    const parsed = trades.map(t => ({
      ...t,
      indicators: t.indicators ? JSON.parse(t.indicators) : null
    }));

    const total = db.prepare('SELECT COUNT(*) as c FROM trades').get();

    res.json({ trades: parsed, total: total.c });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const stats = paperEngine.getPerformanceStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/open
router.get('/open', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const trades = db.prepare("SELECT * FROM trades WHERE status = 'open' ORDER BY created_at DESC").all();
    const parsed = trades.map(t => ({
      ...t,
      indicators: t.indicators ? JSON.parse(t.indicators) : null
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    trade.indicators = trade.indicators ? JSON.parse(trade.indicators) : null;
    res.json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trades/:id/close — manual close
router.post('/:id/close', authMiddleware, (req, res) => {
  try {
    const { price, reason = 'Manual close' } = req.body;
    const db = getDb();
    const trade = db.prepare("SELECT * FROM trades WHERE id = ? AND status = 'open'").get(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Open trade not found' });

    const closePrice = price || (() => {
      // Use stored price if no price provided
      const { getPrice } = require('../services/marketService');
      const p = getPrice(trade.symbol);
      return p ? p.price : trade.entry_price;
    })();

    const result = paperEngine.executeSell(parseInt(req.params.id), closePrice, reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trades/balance/paper
router.get('/balance/paper', authMiddleware, (req, res) => {
  const balance = parseFloat(getBotState('paper_balance') || '10000');
  const startBalance = parseFloat(getBotState('start_balance') || '10000');
  res.json({
    balance,
    startBalance,
    returnPct: parseFloat(((balance - startBalance) / startBalance * 100).toFixed(2))
  });
});

// POST /api/trades/balance/reset
router.post('/balance/reset', authMiddleware, (req, res) => {
  const { setBotState } = require('../models/database');
  setBotState('paper_balance', '10000');
  setBotState('start_balance', '10000');
  setBotState('daily_loss', '0');
  setBotState('daily_pnl', '0');
  res.json({ message: 'Paper balance reset to $10,000' });
});

module.exports = router;
