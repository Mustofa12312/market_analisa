/**
 * Telegram Notification Service
 */
const axios = require('axios');
const { addLog } = require('../models/database');

function formatMessage(type, data) {
  const emoji = {
    buy: '🟢', sell: '🔴', signal: '📊', error: '🚨',
    stop: '⛔', limit: '⚠️', info: 'ℹ️'
  };

  const e = emoji[type] || 'ℹ️';
  const ts = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  switch (type) {
    case 'buy':
      return `${e} *PAPER BUY EXECUTED*\n\n` +
        `📌 Pair: \`${data.symbol}\`\n` +
        `💰 Entry: \`$${data.entryPrice}\`\n` +
        `📊 AI Score: \`${data.aiScore}/100\`\n` +
        `🛑 Stop Loss: \`$${data.stopLoss}\`\n` +
        `🎯 Take Profit: \`$${data.takeProfit}\`\n` +
        `💼 Size: \`${data.quantity}\`\n` +
        `🕐 ${ts}`;

    case 'sell':
      const pnlEmoji = data.pnl >= 0 ? '💚' : '❤️';
      return `${e} *PAPER SELL EXECUTED*\n\n` +
        `📌 Pair: \`${data.symbol}\`\n` +
        `💰 Exit: \`$${data.exitPrice}\`\n` +
        `${pnlEmoji} PnL: \`$${data.pnl} (${data.pnlPercent}%)\`\n` +
        `📋 Reason: \`${data.reason}\`\n` +
        `🕐 ${ts}`;

    case 'signal':
      return `${e} *STRONG SIGNAL DETECTED*\n\n` +
        `📌 Pair: \`${data.symbol}\`\n` +
        `📈 Signal: \`${data.signal}\`\n` +
        `🎯 Score: \`${data.score}/100\`\n` +
        `💹 Price: \`$${data.price}\`\n` +
        `📊 RSI: \`${data.rsi}\`\n` +
        `🕐 ${ts}`;

    case 'error':
      return `${e} *BOT ERROR*\n\n\`${data.message}\`\n🕐 ${ts}`;

    case 'stop':
      return `${e} *BOT STOPPED*\n\n${data.reason}\n🕐 ${ts}`;

    case 'limit':
      return `${e} *RISK LIMIT REACHED*\n\n${data.message}\n🕐 ${ts}`;

    default:
      return `${e} ${data.message}\n🕐 ${ts}`;
  }
}

async function sendNotification(type, data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    addLog('info', 'Telegram not configured, skipping notification', { type });
    return { success: false, reason: 'Telegram not configured' };
  }

  const message = formatMessage(type, data);

  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      },
      { timeout: 10000 }
    );

    addLog('info', `Telegram notification sent: ${type}`);
    return { success: true };
  } catch (err) {
    addLog('error', `Telegram notification failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testConnection(token, chatId) {
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${token}/getMe`,
      { timeout: 8000 }
    );
    if (res.data.ok) {
      await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: chatId,
          text: '✅ *Trading Bot Connected!*\n\nNotifikasi Telegram aktif.',
          parse_mode: 'Markdown'
        },
        { timeout: 8000 }
      );
      return { success: true, botName: res.data.result.username };
    }
    return { success: false, reason: 'Invalid token' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendNotification, testConnection };
