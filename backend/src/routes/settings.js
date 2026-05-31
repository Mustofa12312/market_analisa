/**
 * Settings Routes — API key encryption, Telegram config
 */
const express = require('express');
const { authMiddleware } = require('./auth');
const { getSetting, setSetting, addLog } = require('../models/database');
const { testConnection } = require('../services/telegramService');

const router = express.Router();

// Simple encryption using base64 + key XOR (upgrade to AES in production)
function encrypt(text, key) {
  if (!text) return '';
  const keyBytes = Buffer.from(key || 'default_key').slice(0, 32);
  const buf = Buffer.from(text, 'utf8');
  const result = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ keyBytes[i % keyBytes.length];
  }
  return result.toString('base64');
}

function decrypt(cipherText, key) {
  if (!cipherText) return '';
  try {
    const keyBytes = Buffer.from(key || 'default_key').slice(0, 32);
    const buf = Buffer.from(cipherText, 'base64');
    const result = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
      result[i] = buf[i] ^ keyBytes[i % keyBytes.length];
    }
    return result.toString('utf8');
  } catch(e) {
    return '';
  }
}

const ENC_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_32chars!!!';

// GET /api/settings
router.get('/', authMiddleware, (req, res) => {
  try {
    const uid = req.user.id;
    const apiKeySet = !!getSetting(uid, 'binance_api_key_enc');
    const telegramToken = getSetting(uid, 'telegram_token') || '';
    const telegramChatId = getSetting(uid, 'telegram_chat_id') || '';

    res.json({
      apiKeySet,
      telegramToken: telegramToken ? '***configured***' : '',
      telegramChatId,
      hasApiKey: apiKeySet
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/api-key — save encrypted Binance API key
router.post('/api-key', authMiddleware, (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'API Key and Secret required' });
    }

    const uid = req.user.id;
    setSetting(uid, 'binance_api_key_enc', encrypt(apiKey, ENC_KEY));
    setSetting(uid, 'binance_api_secret_enc', encrypt(apiSecret, ENC_KEY));

    addLog('info', 'Binance API key saved (encrypted)', { userId: uid });
    res.json({ message: 'API key saved securely' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/api-key
router.delete('/api-key', authMiddleware, (req, res) => {
  try {
    const uid = req.user.id;
    setSetting(uid, 'binance_api_key_enc', '');
    setSetting(uid, 'binance_api_secret_enc', '');
    res.json({ message: 'API key removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/telegram
router.post('/telegram', authMiddleware, async (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ error: 'Bot token and chat ID required' });
    }

    const uid = req.user.id;

    // Test connection first
    const test = await testConnection(botToken, chatId);
    if (!test.success) {
      return res.status(400).json({ error: test.error || 'Invalid Telegram configuration' });
    }

    setSetting(uid, 'telegram_token', botToken);
    setSetting(uid, 'telegram_chat_id', chatId);

    // Update env for current session
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_CHAT_ID = chatId;

    addLog('info', 'Telegram configured', { botName: test.botName });
    res.json({ message: 'Telegram connected', botName: test.botName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/settings/telegram
router.delete('/telegram', authMiddleware, (req, res) => {
  const uid = req.user.id;
  setSetting(uid, 'telegram_token', '');
  setSetting(uid, 'telegram_chat_id', '');
  process.env.TELEGRAM_BOT_TOKEN = '';
  process.env.TELEGRAM_CHAT_ID = '';
  res.json({ message: 'Telegram disconnected' });
});

module.exports = router;
