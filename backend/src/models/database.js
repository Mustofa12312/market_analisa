const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/trading_bot.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      key TEXT NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key)
    );

    -- Trades table
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      quantity REAL NOT NULL,
      pnl REAL DEFAULT 0,
      pnl_percent REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      mode TEXT DEFAULT 'paper',
      entry_reason TEXT,
      exit_reason TEXT,
      indicators TEXT,
      ai_score REAL,
      stop_loss REAL,
      take_profit REAL,
      trailing_stop REAL,
      fee REAL DEFAULT 0,
      entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      exit_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Signals table
    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      signal TEXT NOT NULL,
      confidence REAL,
      ai_score REAL,
      rsi REAL,
      macd_line REAL,
      macd_signal REAL,
      macd_histogram REAL,
      ema_fast REAL,
      ema_slow REAL,
      bb_upper REAL,
      bb_middle REAL,
      bb_lower REAL,
      price REAL,
      volume REAL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bot logs table
    CREATE TABLE IF NOT EXISTS bot_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bot state table
    CREATE TABLE IF NOT EXISTS bot_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default admin user if not exists (password: admin123)
    INSERT OR IGNORE INTO users (username, password_hash) 
    VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

    -- Insert default bot state
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('status', 'stopped');
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('mode', 'paper');
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('active_pairs', 'BTCUSDT,ETHUSDT,SOLUSDT');
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('daily_loss', '0');
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('daily_pnl', '0');
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('paper_balance', '10000');
    INSERT OR IGNORE INTO bot_state (key, value) VALUES ('start_balance', '10000');
  `);
}

function getBotState(key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM bot_state WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setBotState(key, value) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO bot_state (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(key, String(value));
}

function getSetting(userId, key) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?').get(userId, key);
  return row ? row.value : null;
}

function setSetting(userId, key, value) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO settings (user_id, key, value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(userId, key, String(value));
}

function addLog(level, message, data = null) {
  const db = getDb();
  db.prepare('INSERT INTO bot_logs (level, message, data) VALUES (?, ?, ?)').run(
    level, message, data ? JSON.stringify(data) : null
  );
}

module.exports = { getDb, getBotState, setBotState, getSetting, setSetting, addLog };
