/**
 * Signal Engine — RSI, MACD, EMA, Bollinger Bands + AI Scoring
 * Uses technicalindicators library
 */

let TI;
try {
  TI = require('technicalindicators');
} catch(e) {
  TI = null;
}

const { addLog } = require('../models/database');

// Calculate RSI
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  try {
    if (TI) {
      const values = TI.RSI.calculate({ values: closes, period });
      return values.length > 0 ? values[values.length - 1] : null;
    }
    return calcRSIManual(closes, period);
  } catch(e) {
    return calcRSIManual(closes, period);
  }
}

function calcRSIManual(closes, period = 14) {
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Calculate EMA
function calcEMA(closes, period) {
  if (closes.length < period) return null;
  try {
    if (TI) {
      const values = TI.EMA.calculate({ values: closes, period });
      return values.length > 0 ? values[values.length - 1] : null;
    }
    return calcEMAManual(closes, period);
  } catch(e) {
    return calcEMAManual(closes, period);
  }
}

function calcEMAManual(closes, period) {
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

// Calculate MACD
function calcMACD(closes) {
  if (closes.length < 26) return null;
  try {
    if (TI) {
      const result = TI.MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      if (!result || result.length === 0) return null;
      const last = result[result.length - 1];
      return {
        macd: last.MACD || 0,
        signal: last.signal || 0,
        histogram: last.histogram || 0
      };
    }
    return calcMACDManual(closes);
  } catch(e) {
    return calcMACDManual(closes);
  }
}

function calcMACDManual(closes) {
  const ema12 = calcEMAManual(closes, 12);
  const ema26 = calcEMAManual(closes, 26);
  if (!ema12 || !ema26) return null;
  const macdLine = ema12 - ema26;
  // Simple signal approximation
  const signal = macdLine * 0.9;
  return {
    macd: macdLine,
    signal: signal,
    histogram: macdLine - signal
  };
}

// Calculate Bollinger Bands
function calcBB(closes, period = 20, stdDev = 2) {
  if (closes.length < period) return null;
  try {
    if (TI) {
      const result = TI.BollingerBands.calculate({
        period, values: closes, stdDev
      });
      if (!result || result.length === 0) return null;
      const last = result[result.length - 1];
      return { upper: last.upper, middle: last.middle, lower: last.lower };
    }
    return calcBBManual(closes, period, stdDev);
  } catch(e) {
    return calcBBManual(closes, period, stdDev);
  }
}

function calcBBManual(closes, period = 20, stdDev = 2) {
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: mean + std * stdDev,
    middle: mean,
    lower: mean - std * stdDev
  };
}

// AI Scoring: Rule-based confidence score (0-100)
function calcAIScore({ rsi, macd, ema, bb, price, volume, volumeAvg }) {
  let score = 50;
  let reasons = [];

  // RSI signals
  if (rsi !== null) {
    if (rsi < 30) { score += 15; reasons.push('RSI oversold (<30)'); }
    else if (rsi < 40) { score += 8; reasons.push('RSI near oversold'); }
    else if (rsi > 70) { score -= 15; reasons.push('RSI overbought (>70)'); }
    else if (rsi > 60) { score -= 5; reasons.push('RSI elevated'); }
    else if (rsi > 45 && rsi < 60) { score += 5; reasons.push('RSI neutral-bullish'); }
  }

  // MACD signals
  if (macd) {
    if (macd.histogram > 0 && macd.macd > macd.signal) {
      score += 12;
      reasons.push('MACD bullish crossover');
    } else if (macd.histogram < 0 && macd.macd < macd.signal) {
      score -= 12;
      reasons.push('MACD bearish crossover');
    }
    if (macd.histogram > 0) { score += 5; reasons.push('MACD histogram positive'); }
    else { score -= 5; }
  }

  // EMA trend
  if (ema && ema.fast && ema.slow) {
    if (ema.fast > ema.slow) {
      score += 10;
      reasons.push('EMA uptrend (fast > slow)');
    } else {
      score -= 10;
      reasons.push('EMA downtrend (fast < slow)');
    }
    // Price above EMA
    if (price && price > ema.fast) { score += 5; reasons.push('Price above EMA fast'); }
    else if (price && price < ema.fast) { score -= 5; }
  }

  // Bollinger Bands
  if (bb && price) {
    const bbRange = bb.upper - bb.lower;
    const bbPos = (price - bb.lower) / bbRange;

    if (bbPos < 0.2) {
      score += 10;
      reasons.push('Price near BB lower (potential bounce)');
    } else if (bbPos > 0.8) {
      score -= 8;
      reasons.push('Price near BB upper (resistance)');
    }
    if (bbRange < price * 0.02) {
      score += 5;
      reasons.push('BB squeeze (potential breakout)');
    }
  }

  // Volume confirmation
  if (volume && volumeAvg) {
    const volRatio = volume / volumeAvg;
    if (volRatio > 1.5) { score += 8; reasons.push('High volume spike (1.5x avg)'); }
    else if (volRatio > 1.2) { score += 4; reasons.push('Above avg volume'); }
    else if (volRatio < 0.7) { score -= 5; reasons.push('Low volume'); }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine signal
  let signal = 'HOLD';
  if (score >= 65) signal = 'BUY';
  else if (score <= 35) signal = 'SELL';

  // Risk level
  let riskLevel = 'MEDIUM';
  if (score >= 75) riskLevel = 'LOW';
  else if (score <= 30) riskLevel = 'HIGH';
  else if (score >= 60 || score <= 40) riskLevel = 'MEDIUM-LOW';

  return {
    score,
    signal,
    confidence: score,
    riskLevel,
    reasons: reasons.slice(0, 5)
  };
}

// Main: analyze candles and generate signal
function analyzeCandles(symbol, candles) {
  if (!candles || candles.length < 30) {
    return { symbol, signal: 'HOLD', score: 50, error: 'Insufficient data' };
  }

  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const price = closes[closes.length - 1];
  const volume = volumes[volumes.length - 1];
  const volumeAvg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

  const rsi = calcRSI(closes);
  const macd = calcMACD(closes);
  const emaFast = calcEMA(closes, 9);
  const emaSlow = calcEMA(closes, 21);
  const bb = calcBB(closes);

  const ema = emaFast && emaSlow ? { fast: emaFast, slow: emaSlow } : null;

  const aiResult = calcAIScore({ rsi, macd, ema, bb, price, volume, volumeAvg });

  const result = {
    symbol,
    price,
    signal: aiResult.signal,
    confidence: aiResult.confidence,
    aiScore: aiResult.score,
    riskLevel: aiResult.riskLevel,
    reasons: aiResult.reasons,
    indicators: {
      rsi: rsi ? parseFloat(rsi.toFixed(2)) : null,
      macd: macd ? {
        line: parseFloat((macd.macd || 0).toFixed(4)),
        signal: parseFloat((macd.signal || 0).toFixed(4)),
        histogram: parseFloat((macd.histogram || 0).toFixed(4))
      } : null,
      ema: ema ? {
        fast: parseFloat(emaFast.toFixed(2)),
        slow: parseFloat(emaSlow.toFixed(2))
      } : null,
      bb: bb ? {
        upper: parseFloat(bb.upper.toFixed(2)),
        middle: parseFloat(bb.middle.toFixed(2)),
        lower: parseFloat(bb.lower.toFixed(2))
      } : null
    },
    volume,
    volumeAvg: parseFloat(volumeAvg.toFixed(2)),
    timestamp: Date.now()
  };

  addLog('info', `Signal: ${symbol} ${aiResult.signal} (score: ${aiResult.score})`, {
    price,
    rsi: result.indicators.rsi
  });

  return result;
}

// Rank multiple coins by score
function rankCoins(analyses) {
  return analyses
    .filter(a => !a.error)
    .sort((a, b) => b.aiScore - a.aiScore)
    .map((a, i) => ({ ...a, rank: i + 1 }));
}

module.exports = { analyzeCandles, rankCoins, calcRSI, calcEMA, calcMACD, calcBB };
