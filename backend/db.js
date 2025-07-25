const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./users.db");

db.serialize(() => {
  // Users tablosu
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_approved INTEGER DEFAULT 0,
    is_pro INTEGER DEFAULT 0,
    refund_rate REAL DEFAULT 0,
    rebate_rate REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Accounts tablosu
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    vip INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Pairs tablosu (tüm pariteler)
  db.run(`CREATE TABLE IF NOT EXISTS pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1,
    reward REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User_pairs tablosu (kullanıcı bazlı parite durumları)
  db.run(`CREATE TABLE IF NOT EXISTS user_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pair_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    is_completed INTEGER DEFAULT 0,
    reward_amount REAL DEFAULT 0,
    reward_amount_usd REAL DEFAULT 0,
    price REAL DEFAULT 0,
    completed_at DATETIME,
    total_volume REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    total_refund REAL DEFAULT 0,
    avg_trade REAL DEFAULT 0,
    selled_dolar REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (pair_id) REFERENCES pairs (id),
    FOREIGN KEY (account_id) REFERENCES accounts (id)
  )`);

  // Trade kayıtları tablosu
  db.run(`CREATE TABLE IF NOT EXISTS user_pairs_trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    pair_id INTEGER NOT NULL,
    entry_price REAL,
    exit_price REAL,
    volume REAL,
    entry_balance REAL,
    exit_balance REAL,
    exit_volume REAL,
    fee REAL,
    reward REAL,
    rr REAL,
    is_completed INTEGER DEFAULT 0,
    started_at DATETIME,
    ended_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (account_id) REFERENCES accounts (id),
    FOREIGN KEY (pair_id) REFERENCES pairs (id)
  )`);
});

module.exports = db;
