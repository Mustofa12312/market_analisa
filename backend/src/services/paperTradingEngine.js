/**
 * Paper Trading Engine — Simulates trades with real market prices
 */
const { getDb, getBotState, setBotState, addLog } = require('../models/database');
const { recordLoss, recordProfit, setOpenPositions } = require('./riskEngine');

const FEE_RATE = 0.001; // 0.1% per trade (Binance standard)

// Execute a paper buy order
function executeBuy(signal, riskValidation) {
  const db = getDb();

  const entryPrice = signal.price;
  const quantity = riskValidation.positionSize;
  const fee = entryPrice * quantity * FEE_RATE;
  const totalCost = entryPrice * quantity + fee;

  // Check balance
  const balance = parseFloat(getBotState('paper_balance') || '10000');
  if (balance < totalCost) {
    return { success: false, reason: 'Insufficient paper balance' };
  }

  // Deduct from balance
  setBotState('paper_balance', (balance - totalCost).toFixed(2));

  // Record trade
  const trade = {
    symbol: signal.symbol,
    side: 'BUY',
    entry_price: entryPrice,
    quantity,
    fee,
    status: 'open',
    mode: 'paper',
    entry_reason: signal.reasons ? signal.reasons.join('; ') : 'Signal triggered',
    indicators: JSON.stringify(signal.indicators),
    ai_score: signal.aiScore,
    stop_loss: riskValidation.stopLossPrice,
    take_profit: riskValidation.takeProfitPrice,
    trailing_stop: null
  };

  const stmt = db.prepare(`
    INSERT INTO trades (symbol, side, entry_price, quantity, fee, status, mode, 
      entry_reason, indicators, ai_score, stop_loss, take_profit, trailing_stop)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    trade.symbol, trade.side, trade.entry_price, trade.quantity, trade.fee,
    trade.status, trade.mode, trade.entry_reason, trade.indicators,
    trade.ai_score, trade.stop_loss, trade.take_profit, trade.trailing_stop
  );

  const tradeId = result.lastInsertRowid;

  addLog('info', `Paper BUY executed: ${signal.symbol} @ $${entryPrice}`, {
    tradeId,
    quantity,
    totalCost: totalCost.toFixed(2),
    sl: riskValidation.stopLossPrice,
    tp: riskValidation.takeProfitPrice
  });

  updateOpenPositionsCount();

  return {
    success: true,
    tradeId,
    symbol: signal.symbol,
    side: 'BUY',
    entryPrice,
    quantity,
    fee,
    stopLoss: riskValidation.stopLossPrice,
    takeProfit: riskValidation.takeProfitPrice,
    totalCost: parseFloat(totalCost.toFixed(2))
  };
}

// Close/sell a trade
function executeSell(tradeId, currentPrice, reason = 'Signal') {
  const db = getDb();

  const trade = db.prepare('SELECT * FROM trades WHERE id = ? AND status = ?').get(tradeId, 'open');
  if (!trade) return { success: false, reason: 'Trade not found or already closed' };

  const fee = currentPrice * trade.quantity * FEE_RATE;
  const grossProfit = (currentPrice - trade.entry_price) * trade.quantity;
  const netPnl = grossProfit - fee - trade.fee;
  const pnlPercent = ((currentPrice - trade.entry_price) / trade.entry_price) * 100;

  // Return funds + PnL to paper balance
  const balance = parseFloat(getBotState('paper_balance') || '10000');
  const returnAmount = currentPrice * trade.quantity - fee;
  setBotState('paper_balance', (balance + returnAmount).toFixed(2));

  // Update trade
  db.prepare(`
    UPDATE trades SET 
      exit_price = ?, pnl = ?, pnl_percent = ?, 
      status = 'closed', exit_reason = ?, exit_time = CURRENT_TIMESTAMP,
      fee = fee + ?
    WHERE id = ?
  `).run(currentPrice, netPnl.toFixed(4), pnlPercent.toFixed(4), reason, fee, tradeId);

  // Record PnL
  if (netPnl > 0) recordProfit(netPnl);
  else recordLoss(Math.abs(netPnl));

  addLog('info', `Paper SELL: ${trade.symbol} @ $${currentPrice} | PnL: $${netPnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`, {
    tradeId, reason
  });

  updateOpenPositionsCount();

  return {
    success: true,
    tradeId,
    symbol: trade.symbol,
    exitPrice: currentPrice,
    pnl: parseFloat(netPnl.toFixed(4)),
    pnlPercent: parseFloat(pnlPercent.toFixed(4)),
    reason
  };
}

// Monitor open positions for TP/SL hits
function monitorPositions(prices) {
  const db = getDb();
  const openTrades = db.prepare("SELECT * FROM trades WHERE status = 'open' AND mode = 'paper'").all();

  for (const trade of openTrades) {
    const price = prices[trade.symbol];
    if (!price) continue;

    const currentPrice = price.price || price;

    // Check Take Profit
    if (trade.take_profit && currentPrice >= trade.take_profit) {
      executeSell(trade.id, currentPrice, 'Take Profit hit');
      continue;
    }

    // Check Stop Loss
    if (trade.stop_loss && currentPrice <= trade.stop_loss) {
      executeSell(trade.id, currentPrice, 'Stop Loss hit');
      continue;
    }

    // Update trailing stop based on highest price
    if (trade.trailing_stop) {
      const newStop = currentPrice * (1 - trade.trailing_stop / 100);
      if (newStop > trade.stop_loss) {
        db.prepare('UPDATE trades SET stop_loss = ? WHERE id = ?').run(newStop, trade.id);
      }
      if (currentPrice <= trade.stop_loss) {
        executeSell(trade.id, currentPrice, 'Trailing Stop hit');
      }
    }
  }
}

function updateOpenPositionsCount() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM trades WHERE status = 'open' AND mode = 'paper'").get();
  setOpenPositions(count.c);
  return count.c;
}

// Get performance stats
function getPerformanceStats() {
  const db = getDb();

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_trades,
      SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
      SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END) as losing_trades,
      SUM(pnl) as total_pnl,
      AVG(pnl) as avg_pnl,
      MAX(pnl) as best_trade,
      MIN(pnl) as worst_trade,
      AVG(CASE WHEN pnl > 0 THEN pnl_percent END) as avg_win_percent,
      AVG(CASE WHEN pnl < 0 THEN pnl_percent END) as avg_loss_percent
    FROM trades 
    WHERE status = 'closed' AND mode = 'paper'
  `).get();

  const openCount = db.prepare("SELECT COUNT(*) as c FROM trades WHERE status = 'open'").get();

  const paperBalance = parseFloat(getBotState('paper_balance') || '10000');
  const startBalance = parseFloat(getBotState('start_balance') || '10000');
  const totalReturn = ((paperBalance - startBalance) / startBalance) * 100;

  const winRate = stats.total_trades > 0
    ? (stats.winning_trades / stats.total_trades * 100).toFixed(1)
    : 0;

  const profitFactor = stats.winning_trades > 0 && stats.losing_trades > 0
    ? Math.abs(stats.avg_win_percent / (stats.avg_loss_percent || -1)).toFixed(2)
    : 0;

  return {
    totalTrades: stats.total_trades || 0,
    winningTrades: stats.winning_trades || 0,
    losingTrades: stats.losing_trades || 0,
    winRate: parseFloat(winRate),
    totalPnl: parseFloat((stats.total_pnl || 0).toFixed(2)),
    avgPnl: parseFloat((stats.avg_pnl || 0).toFixed(2)),
    bestTrade: parseFloat((stats.best_trade || 0).toFixed(2)),
    worstTrade: parseFloat((stats.worst_trade || 0).toFixed(2)),
    profitFactor: parseFloat(profitFactor),
    openPositions: openCount.c,
    paperBalance,
    startBalance,
    totalReturn: parseFloat(totalReturn.toFixed(2))
  };
}

module.exports = {
  executeBuy,
  executeSell,
  monitorPositions,
  getPerformanceStats,
  updateOpenPositionsCount
};
