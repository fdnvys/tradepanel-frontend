const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("./users.db");

console.log("Veritabanı sıfırlanıyor...");

db.serialize(async () => {
  // Tabloları oluştur
  console.log("Tablolar oluşturuluyor...");

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

  // Pairs tablosu
  db.run(`CREATE TABLE IF NOT EXISTS pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1,
    reward REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User_pairs tablosu
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

  // Örnek veriler ekle
  console.log("Örnek veriler ekleniyor...");

  // Admin kullanıcısı
  const adminPassword = await bcrypt.hash("admin123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, is_approved, is_pro, refund_rate, rebate_rate) VALUES (?, ?, ?, ?, ?, ?)`,
    ["admin", adminPassword, 1, 1, 0.5, 0.3]
  );

  // Test kullanıcıları
  const testPassword = await bcrypt.hash("test123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, is_approved, is_pro, refund_rate, rebate_rate) VALUES (?, ?, ?, ?, ?, ?)`,
    ["testuser1", testPassword, 1, 0, 0.4, 0.2]
  );
  db.run(
    `INSERT OR IGNORE INTO users (username, password, is_approved, is_pro, refund_rate, rebate_rate) VALUES (?, ?, ?, ?, ?, ?)`,
    ["testuser2", testPassword, 1, 1, 0.6, 0.4]
  );

  // Pariteler
  const pairs = [
    "BTC/USDT",
    "ETH/USDT",
    "BNB/USDT",
    "ADA/USDT",
    "SOL/USDT",
    "DOT/USDT",
    "DOGE/USDT",
    "AVAX/USDT",
    "MATIC/USDT",
    "LINK/USDT",
  ];

  pairs.forEach((pair) => {
    db.run(`INSERT OR IGNORE INTO pairs (name) VALUES (?)`, [pair]);
  });

  // Kullanıcılar için hesaplar
  db.run(
    `INSERT OR IGNORE INTO accounts (user_id, name, vip) VALUES (2, 'Test Hesap 1', 0)`
  );
  db.run(
    `INSERT OR IGNORE INTO accounts (user_id, name, vip) VALUES (2, 'VIP Hesap 1', 1)`
  );
  db.run(
    `INSERT OR IGNORE INTO accounts (user_id, name, vip) VALUES (3, 'Test Hesap 2', 0)`
  );
  db.run(
    `INSERT OR IGNORE INTO accounts (user_id, name, vip) VALUES (3, 'VIP Hesap 2', 1)`
  );

  console.log("Veritabanı başarıyla sıfırlandı!");
  console.log("Admin kullanıcısı: admin / admin123");
  console.log("Test kullanıcıları: testuser1, testuser2 / test123");

  db.close();
});
