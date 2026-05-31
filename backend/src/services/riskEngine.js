/**
 * Risk Engine — validates trades before execution
 */
const { getBotState, setBotState, addLog } = require('../models/database');

const DEFAULT_RISK = {
  maxRiskPerTrade: parseFloat(process.env.DEFAULT_MAX_RISK_PER_TRADE || 2),
  maxDailyLoss: parseFloat(process.env.DEFAULT_MAX_DAILY_LOSS || 6),
  takeProfit: parseFloat(process.env.DEFAULT_TAKE_PROFIT || 3),
  stopLoss: parseFloat(process.env.DEFAULT_STOP_LOSS || 1.5),
  minAIScore: 60,
  cooldownAfterLoss: 5 * 60 * 1000, // 5 min
  maxOpenPositions: 3,
};

let riskConfig = { ...DEFAULT_RISK };
let lastLossTime = null;
let openPositions = 0;

function setRiskConfig(config) {
  riskConfig = { ...riskConfig, ...config };
}

function getRiskConfig() {
  return { ...riskConfig };
}

function setOpenPositions(count) {
  openPositions = count;
}

// Validate if a trade can be executed
function validateTrade(signal, balance) {
  const issues = [];

  // 1. Bot must be running
  const botStatus = getBotState('status');
  if (botStatus !== 'running') {
    return { approved: false, reason: 'Bot is not running' };
  }

  // 2. Signal must be BUY
  if (signal.signal !== 'BUY') {
    return { approved: false, reason: `Signal is ${signal.signal}, not BUY` };
  }

  // 3. AI Score must exceed minimum
  if (signal.aiScore < riskConfig.minAIScore) {
    return { approved: false, reason: `AI score ${signal.aiScore} below minimum ${riskConfig.minAIScore}` };
  }

  // 4. Check daily loss limit
  const dailyLoss = parseFloat(getBotState('daily_loss') || '0');
  const maxDailyLossAmount = balance * (riskConfig.maxDailyLoss / 100);
  if (dailyLoss >= maxDailyLossAmount) {
    setBotState('status', 'stopped');
    addLog('warn', 'Bot stopped: daily loss limit reached', { dailyLoss, maxDailyLossAmount });
    return { approved: false, reason: `Daily loss limit reached ($${dailyLoss.toFixed(2)})` };
  }

  // 5. Cooldown after loss
  if (lastLossTime && (Date.now() - lastLossTime) < riskConfig.cooldownAfterLoss) {
    const remaining = Math.ceil((riskConfig.cooldownAfterLoss - (Date.now() - lastLossTime)) / 1000);
    return { approved: false, reason: `Cooldown after loss: ${remaining}s remaining` };
  }

  // 6. Max open positions
  if (openPositions >= riskConfig.maxOpenPositions) {
    return { approved: false, reason: `Max open positions (${riskConfig.maxOpenPositions}) reached` };
  }

  // 7. Risk per trade
  const tradeAmount = balance * (riskConfig.maxRiskPerTrade / 100);
  const stopLossAmount = tradeAmount * (riskConfig.stopLoss / 100);

  if (tradeAmount <= 0) {
    return { approved: false, reason: 'Insufficient balance' };
  }

  // All checks passed
  return {
    approved: true,
    tradeAmount: parseFloat(tradeAmount.toFixed(2)),
    stopLossPrice: parseFloat((signal.price * (1 - riskConfig.stopLoss / 100)).toFixed(2)),
    takeProfitPrice: parseFloat((signal.price * (1 + riskConfig.takeProfit / 100)).toFixed(2)),
    positionSize: parseFloat((tradeAmount / signal.price).toFixed(6)),
    fee: parseFloat((tradeAmount * 0.001).toFixed(4)), // 0.1% Binance fee
    reason: `Risk validated: ${riskConfig.maxRiskPerTrade}% risk, SL: ${riskConfig.stopLoss}%, TP: ${riskConfig.takeProfit}%`
  };
}

// Called when a trade results in a loss
function recordLoss(amount) {
  const dailyLoss = parseFloat(getBotState('daily_loss') || '0');
  setBotState('daily_loss', (dailyLoss + Math.abs(amount)).toFixed(2));
  lastLossTime = Date.now();
  addLog('warn', `Loss recorded: $${amount.toFixed(2)}`);
}

// Called when a trade results in a profit
function recordProfit(amount) {
  const dailyPnl = parseFloat(getBotState('daily_pnl') || '0');
  setBotState('daily_pnl', (dailyPnl + amount).toFixed(2));
}

// Reset daily stats (call at midnight)
function resetDailyStats() {
  setBotState('daily_loss', '0');
  setBotState('daily_pnl', '0');
  addLog('info', 'Daily stats reset');
}

// Check if trailing stop is hit
function checkTrailingStop(trade, currentPrice) {
  if (!trade.trailing_stop) return false;
  const trailingPrice = currentPrice * (1 - trade.trailing_stop / 100);
  const stopPrice = Math.max(trade.stop_loss, trailingPrice);
  return currentPrice <= stopPrice;
}

module.exports = {
  validateTrade,
  recordLoss,
  recordProfit,
  resetDailyStats,
  setRiskConfig,
  getRiskConfig,
  setOpenPositions,
  checkTrailingStop
};
