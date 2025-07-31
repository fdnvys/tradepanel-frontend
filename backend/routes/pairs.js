const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// JWT secret key - auth.js ile aynı olmalı
const JWT_SECRET = "supersecretkey";

// Türkiye saatini al (UTC'ye +3 saat ekle)
const getTurkeyTime = () => {
  const now = new Date();
  // UTC milisaniyesine 3 saat ekle
  const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return turkeyTime.toISOString().slice(0, 19).replace("T", " ");
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// GET /api/pairs - Tüm pariteleri getir
router.get("/", authenticateToken, (req, res) => {
  db.all("SELECT * FROM pairs ORDER BY name", (err, pairs) => {
    if (err) {
      console.error("Pariteler yüklenirken hata:", err);
      return res.status(500).json({ error: "Pariteler yüklenemedi" });
    }
    res.json({ pairs: pairs || [] });
  });
});

// user_pairs için toplam hacim, masraf, iade ve ortalama güncelleme fonksiyonu
function updateUserPairStats(userId, accountId, pairId, callback) {
  // Tüm trade'leri çek
  db.all(
    `SELECT entry_balance, exit_balance, volume, exit_volume, fee FROM user_pairs_trades WHERE user_id = ? AND account_id = ? AND pair_id = ?`,
    [userId, accountId, pairId],
    (err, trades) => {
      if (err) return callback && callback(err);
      let totalCost = 0;
      let totalVolume = 0;
      let totalFee = 0;
      trades.forEach((t) => {
        totalCost += (t.entry_balance ?? 0) - (t.exit_balance ?? 0);
        totalVolume += (t.exit_volume ?? 0) - (t.volume ?? 0);
        totalFee += t.fee ?? 0;
      });
      // Kullanıcının refund_rate'ini çek
      db.get(
        `SELECT refund_rate FROM users WHERE id = ?`,
        [userId],
        (err, userRow) => {
          if (err) return callback && callback(err);
          const refundRate =
            userRow && !isNaN(Number(userRow.refund_rate))
              ? Number(userRow.refund_rate)
              : 0;
          const totalRefund = totalFee * (refundRate / 100);
          const avgTrade =
            totalVolume !== 0 ? (totalCost / totalVolume) * 1000 : 0;
          // user_pairs tablosunu user_id ile birlikte güncelle
          db.run(
            `UPDATE user_pairs SET total_volume = ?, total_cost = ?, total_refund = ?, avg_trade = ? WHERE user_id = ? AND account_id = ? AND pair_id = ?`,
            [
              totalVolume,
              totalCost,
              totalRefund,
              avgTrade,
              userId,
              accountId,
              pairId,
            ],
            (err) => {
              if (callback) callback(err);
            }
          );
        }
      );
    }
  );
}

// GET /api/pairs/details/:accountId/:pairId - Bir hesabın bir paritesinin detaylarını getir
router.get("/details/:accountId/:pairId", authenticateToken, (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);
  const pairId = parseInt(req.params.pairId, 10);
  const userId = req.user.id;

  if (!accountId || !pairId) {
    return res.status(400).json({ error: "accountId ve pairId gerekli" });
  }

  // Hesap ve parite sahipliği kontrolü
  db.get(
    `SELECT up.id, up.reward_amount, up.reward_amount_usd, up.price, p.name as token, p.reward FROM user_pairs up
     JOIN accounts a ON up.account_id = a.id
     JOIN pairs p ON up.pair_id = p.id
     WHERE up.account_id = ? AND up.pair_id = ? AND a.user_id = ?`,
    [accountId, pairId, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res
          .status(404)
          .json({ error: "Parite bulunamadı veya yetkiniz yok" });
      }
      // Kullanıcının refund_rate'ini çek
      db.get(
        `SELECT refund_rate FROM users WHERE id = ?`,
        [userId],
        (err, userRow) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          const refundRate =
            userRow && !isNaN(Number(userRow.refund_rate))
              ? Number(userRow.refund_rate)
              : 0;
          // İlgili trade'lerin fee toplamını bul
          db.get(
            `SELECT SUM(fee) as totalFee FROM user_pairs_trades WHERE user_id = ? AND account_id = ? AND pair_id = ?`,
            [userId, accountId, pairId],
            (err, feeRow) => {
              if (err) {
                return res.status(500).json({ error: "Database error" });
              }
              const totalFee = feeRow && feeRow.totalFee ? feeRow.totalFee : 0;
              const totalReturn = totalFee * (refundRate / 100);
              db.all(
                `SELECT entry_balance, exit_balance, volume, exit_volume FROM user_pairs_trades WHERE user_id = ? AND account_id = ? AND pair_id = ?`,
                [userId, accountId, pairId],
                (err, trades) => {
                  if (err) {
                    return res.status(500).json({ error: "Database error" });
                  }
                  let totalCost = 0;
                  let totalVolume = 0;
                  trades.forEach((t) => {
                    totalCost += (t.entry_balance ?? 0) - (t.exit_balance ?? 0);
                    totalVolume += (t.exit_volume ?? 0) - (t.volume ?? 0);
                  });
                  const avg =
                    totalVolume !== 0 ? (totalCost / totalVolume) * 1000 : 0;
                  res.json({
                    token: row.token,
                    reward: row.reward || 0,
                    reward_amount: row.reward_amount || 0,
                    reward_amount_usd: row.reward_amount_usd || 0,
                    price: row.price || 0,
                    totalReturn,
                    refundRate,
                    totalFee,
                    avg,
                    totalCost,
                    totalVolume,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// GET /api/pairs - Tüm aktif pariteleri getir
router.get("/", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM pairs ORDER BY is_active DESC, created_at DESC",
    (err, pairs) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(pairs);
    }
  );
});

// POST /api/pairs - Admin parite ekleme
router.post("/", authenticateToken, isAdmin, (req, res) => {
  const { name, reward } = req.body;

  console.log("Gelen reward değeri:", reward, "Tip:", typeof reward);

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Parite adı gerekli" });
  }

  const pairName = name.trim().toLowerCase();
  const rewardAmount =
    typeof reward === "number" && !isNaN(reward) ? reward : 0;

  console.log("İşlenmiş reward değeri:", rewardAmount);

  // Parite zaten var mı kontrol et
  db.get(
    "SELECT id FROM pairs WHERE name = ?",
    [pairName],
    (err, existingPair) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (existingPair) {
        return res.status(400).json({ error: "Bu parite zaten mevcut" });
      }

      // Yeni parite ekle (reward ile birlikte)
      db.run(
        "INSERT INTO pairs (name, reward) VALUES (?, ?)",
        [pairName, rewardAmount],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          res.json({
            message: "Parite başarıyla oluşturuldu",
            pair: { id: this.lastID, name: pairName, reward: rewardAmount },
          });
        }
      );
    }
  );
});

// GET /api/pairs/user/:accountId - Kullanıcının belirli hesabındaki pariteleri getir
router.get("/user/:accountId", authenticateToken, (req, res) => {
  const accountId = req.params.accountId;
  const userId = req.user.id;

  // Hesabın kullanıcıya ait olduğunu kontrol et
  db.get(
    "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
    [accountId, userId],
    (err, account) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!account) {
        return res.status(404).json({ error: "Hesap bulunamadı" });
      }

      // Aktif ve biten pariteleri getir
      db.all(
        `
      SELECT 
        p.id, p.name, p.is_active,
        up.is_completed, up.reward_amount, up.completed_at
      FROM user_pairs up
      INNER JOIN pairs p ON p.id = up.pair_id
      WHERE up.account_id = ?
      ORDER BY up.is_completed ASC, p.created_at DESC
    `,
        [accountId],
        (err, pairs) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          const activePairs = pairs.filter((p) => !p.is_completed);
          const completedPairs = pairs.filter((p) => p.is_completed);

          res.json({
            activePairs,
            completedPairs,
          });
        }
      );
    }
  );
});

// POST /api/pairs/complete - Parite bitirme
router.post("/complete", authenticateToken, (req, res) => {
  const { pairId, accountId, rewardAmount } = req.body;
  const userId = req.user.id;

  if (!pairId || !accountId || rewardAmount === undefined) {
    return res.status(400).json({ error: "Tüm alanlar gerekli" });
  }

  // Hesabın kullanıcıya ait olduğunu ve paritenin aktif olduğunu kontrol et
  db.get(
    `
    SELECT up.id FROM user_pairs up
    JOIN accounts a ON up.account_id = a.id
    JOIN pairs p ON up.pair_id = p.id
    WHERE up.pair_id = ? AND up.account_id = ? AND a.user_id = ? AND up.is_completed = 0
  `,
    [pairId, accountId, userId],
    (err, userPair) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!userPair) {
        return res.status(404).json({ error: "Aktif parite bulunamadı" });
      }

      // Pariteyi bitir
      db.run(
        `
      UPDATE user_pairs 
      SET is_completed = 1, reward_amount = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        [rewardAmount, userPair.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          res.json({
            message: "Parite başarıyla tamamlandı",
            rewardAmount: rewardAmount,
          });
          updateUserPairStats(userId, accountId, pairId);
        }
      );
    }
  );
});

// GET /api/pairs/available/:accountId - Kullanıcının ekleyebileceği pariteleri getir
router.get("/available/:accountId", authenticateToken, (req, res) => {
  const accountId = req.params.accountId;
  const userId = req.user.id;

  // Hesabın kullanıcıya ait olduğunu kontrol et
  db.get(
    "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
    [accountId, userId],
    (err, account) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!account) {
        return res.status(404).json({ error: "Hesap bulunamadı" });
      }

      // Kullanıcının hesabında olmayan aktif pariteleri getir
      db.all(
        `
      SELECT p.id, p.name, p.created_at
      FROM pairs p
      WHERE p.is_active = 1 
      AND p.id NOT IN (
        SELECT up.pair_id 
        FROM user_pairs up 
        WHERE up.account_id = ?
      )
      ORDER BY p.created_at DESC
    `,
        [accountId],
        (err, availablePairs) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          res.json(availablePairs);
        }
      );
    }
  );
});

// POST /api/pairs/add-to-account - Seçilen pariteleri hesaba ekle
router.post("/add-to-account", authenticateToken, (req, res) => {
  const { accountId, pairIds, addToAllAccounts } = req.body;
  const userId = req.user.id;

  if (!accountId || !pairIds || !Array.isArray(pairIds)) {
    return res.status(400).json({ error: "Geçersiz parametreler" });
  }

  // Hesabın kullanıcıya ait olduğunu kontrol et
  db.get(
    "SELECT id FROM accounts WHERE id = ? AND user_id = ?",
    [accountId, userId],
    (err, account) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!account) {
        return res.status(404).json({ error: "Hesap bulunamadı" });
      }

      // Hangi hesaplara ekleneceğini belirle
      let targetAccounts = [accountId];

      if (addToAllAccounts) {
        // Kullanıcının tüm hesaplarını al
        db.all(
          "SELECT id FROM accounts WHERE user_id = ?",
          [userId],
          (err, userAccounts) => {
            if (err) {
              return res.status(500).json({ error: "Database error" });
            }
            targetAccounts = userAccounts.map((acc) => acc.id);
            addPairsToAccounts(targetAccounts, pairIds, userId, res);
          }
        );
      } else {
        addPairsToAccounts(targetAccounts, pairIds, userId, res);
      }
    }
  );
});

// Pariteleri hesaplara ekleme yardımcı fonksiyonu
function addPairsToAccounts(accountIds, pairIds, userId, res) {
  const insertPromises = [];

  accountIds.forEach((accountId) => {
    pairIds.forEach((pairId) => {
      insertPromises.push(
        new Promise((resolve, reject) => {
          // Önce zaten var mı kontrol et
          db.get(
            "SELECT id FROM user_pairs WHERE user_id = ? AND pair_id = ? AND account_id = ?",
            [userId, pairId, accountId],
            (err, row) => {
              if (err) return reject(err);
              if (row) return resolve(); // Zaten varsa ekleme
              // Yoksa ekle
              db.run(
                "INSERT INTO user_pairs (user_id, pair_id, account_id) VALUES (?, ?, ?)",
                [userId, pairId, accountId],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            }
          );
        })
      );
    });
  });

  Promise.all(insertPromises)
    .then(() => {
      res.json({
        message: "Pariteler başarıyla eklendi",
        addedPairs: pairIds.length,
        targetAccounts: accountIds.length,
      });
    })
    .catch((err) => {
      res.status(500).json({ error: "Pariteler eklenirken hata oluştu" });
    });
}

// PUT /api/pairs/:id/toggle - Parite aktif/pasif yapma
router.put("/:id/toggle", authenticateToken, isAdmin, (req, res) => {
  const pairId = req.params.id;

  // Pariteyi bul ve mevcut durumunu al
  db.get(
    "SELECT id, is_active FROM pairs WHERE id = ?",
    [pairId],
    (err, pair) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!pair) {
        return res.status(404).json({ error: "Parite bulunamadı" });
      }

      // Durumu tersine çevir
      const newStatus = pair.is_active ? 0 : 1;
      const statusText = newStatus ? "aktif" : "pasif";

      db.run(
        "UPDATE pairs SET is_active = ? WHERE id = ?",
        [newStatus, pairId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          res.json({
            message: `Parite ${statusText} hale getirildi`,
            pair: { id: pairId, is_active: newStatus },
          });
        }
      );
    }
  );
});

// POST /api/pairs/resume - Biten pariteyi tekrar aktif yap
router.post("/resume", authenticateToken, (req, res) => {
  const { pairId, accountId } = req.body;
  const userId = req.user.id;

  if (!pairId || !accountId) {
    return res.status(400).json({ error: "pairId ve accountId gerekli" });
  }

  // Hesabın kullanıcıya ait olduğunu ve paritenin bitmiş olduğunu kontrol et
  db.get(
    `SELECT up.id FROM user_pairs up
     JOIN accounts a ON up.account_id = a.id
     WHERE up.pair_id = ? AND up.account_id = ? AND a.user_id = ? AND up.is_completed = 1`,
    [pairId, accountId, userId],
    (err, userPair) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!userPair) {
        return res.status(404).json({ error: "Biten parite bulunamadı" });
      }
      // Pariteyi tekrar aktif yap
      db.run(
        `UPDATE user_pairs SET is_completed = 0, reward_amount = 0, completed_at = NULL WHERE id = ?`,
        [userPair.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          res.json({ message: "Parite tekrar aktifleştirildi" });
          updateUserPairStats(userId, accountId, pairId);
        }
      );
    }
  );
});

// DEBUG: Kullanıcının tüm hesaplarındaki tüm parite ilişkilerini döndür
router.get("/debug-user-pairs", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT up.id, up.user_id, up.account_id, up.pair_id, a.name as account_name, p.name as pair_name, up.is_completed
     FROM user_pairs up
     JOIN accounts a ON up.account_id = a.id
     JOIN pairs p ON up.pair_id = p.id
     WHERE up.user_id = ?
     ORDER BY up.account_id, up.pair_id`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ userPairs: rows });
    }
  );
});

// GET /api/pairs/price/:pairName - Bybit'ten fiyat çek
router.get("/price/:pairName", authenticateToken, async (req, res) => {
  const pairName = req.params.pairName;
  if (!pairName) return res.status(400).json({ error: "pairName gerekli" });
  try {
    // Bybit sembolü örnek: "ETHUSDT"
    const symbol = pairName.toUpperCase() + "USDT";
    const url = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`;
    const response = await axios.get(url);
    const price = response.data?.result?.list?.[0]?.lastPrice;
    if (!price) return res.status(404).json({ error: "Fiyat bulunamadı" });
    res.json({ price: parseFloat(price) });
  } catch (err) {
    res.status(500).json({ error: "Bybit API hatası" });
  }
});

// POST /api/pairs/update-price - Parite fiyatını güncelle
router.post("/update-price", authenticateToken, (req, res) => {
  const { accountId, pairId, price } = req.body;
  const userId = req.user.id;
  if (!accountId || !pairId || typeof price !== "number") {
    return res
      .status(400)
      .json({ error: "accountId, pairId ve price gerekli" });
  }
  // Hesap ve parite sahipliği kontrolü
  db.get(
    `SELECT up.id FROM user_pairs up
     JOIN accounts a ON up.account_id = a.id
     WHERE up.account_id = ? AND up.pair_id = ? AND a.user_id = ?`,
    [accountId, pairId, userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!row) return res.status(404).json({ error: "Kayıt bulunamadı" });
      // Fiyatı güncelle (user_pairs tablosuna price sütunu eklenmiş olmalı)
      db.run(
        `UPDATE user_pairs SET price = ? WHERE id = ?`,
        [price, row.id],
        function (err) {
          if (err)
            return res.status(500).json({ error: "Fiyat güncellenemedi" });
          res.json({ message: "Fiyat güncellendi", price });
          updateUserPairStats(userId, accountId, pairId);
        }
      );
    }
  );
});

// POST /api/pairs/trade/start - Trade başlat
router.post("/trade/start", authenticateToken, (req, res) => {
  const { accountId, pairId, entryBalance } = req.body;
  const userId = req.user.id;
  if (!accountId || !pairId || typeof entryBalance !== "number") {
    return res.status(400).json({
      error: "accountId, pairId, entryBalance gerekli",
    });
  }
  // Hesap var mı kontrol et
  db.get(
    `SELECT id FROM accounts WHERE id = ? AND user_id = ?`,
    [accountId, userId],
    (err, acc) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!acc)
        return res
          .status(404)
          .json({ error: "Hesap bulunamadı, trade başlatılamaz" });
      // Son biten trade'in exit_volume'unu bul
      db.get(
        `SELECT exit_volume FROM user_pairs_trades WHERE user_id = ? AND account_id = ? AND pair_id = ? AND is_completed = 1 ORDER BY ended_at DESC LIMIT 1`,
        [userId, accountId, pairId],
        (err, lastTrade) => {
          if (err) return res.status(500).json({ error: "Database error" });
          const lastVolume =
            lastTrade && typeof lastTrade.exit_volume === "number"
              ? lastTrade.exit_volume
              : 0;
          // Zaten açık trade var mı kontrolü
          db.get(
            `SELECT id FROM user_pairs_trades WHERE user_id = ? AND account_id = ? AND pair_id = ? AND is_completed = 0`,
            [userId, accountId, pairId],
            (err, row) => {
              if (err) return res.status(500).json({ error: "Database error" });
              if (row)
                return res.status(400).json({ error: "Zaten açık trade var" });
              db.run(
                `INSERT INTO user_pairs_trades (user_id, account_id, pair_id, volume, entry_balance, started_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  userId,
                  accountId,
                  pairId,
                  lastVolume,
                  entryBalance,
                  getTurkeyTime(),
                ],
                function (err) {
                  if (err)
                    return res
                      .status(500)
                      .json({ error: "Trade başlatılamadı" });
                  res.json({
                    message: "Trade başlatıldı",
                    tradeId: this.lastID,
                  });
                  updateUserPairStats(userId, accountId, pairId);
                }
              );
            }
          );
        }
      );
    }
  );
});

// VIP oranları sabiti
const VIP_FEE_RATES = {
  0: 0.001, // %0,1
  1: 0.0008375, // %0,08375
  2: 0.0007125, // %0,07125
  3: 0.0006875, // %0,06875
  4: 0.00055, // %0,055
  5: 0.00045, // %0,045
};
function getFeeRateForVip(vip) {
  return VIP_FEE_RATES[vip] ?? 0.001;
}

// POST /api/pairs/trade/finish - Trade bitir
router.post("/trade/finish", authenticateToken, (req, res) => {
  const { tradeId, exitBalance, exitVolume } = req.body;
  const userId = req.user.id;
  console.log("Trade bitirme isteği:", {
    tradeId,
    exitBalance,
    exitVolume,
    userId,
  });

  if (
    !tradeId ||
    typeof exitBalance !== "number" ||
    typeof exitVolume !== "number"
  ) {
    console.log("Eksik parametre hatası");
    return res.status(400).json({
      error: "tradeId, exitBalance, exitVolume gerekli",
    });
  }
  db.get(
    `SELECT * FROM user_pairs_trades WHERE id = ? AND user_id = ? AND is_completed = 0`,
    [tradeId, userId],
    (err, trade) => {
      if (err) {
        console.error("Trade bulma DB hatası:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!trade) {
        console.log("Açık trade bulunamadı");
        return res.status(404).json({ error: "Açık trade bulunamadı" });
      }
      // Hesaplamalar
      const balanceChange = exitBalance - (trade.entry_balance || 0);
      const volumeChange = exitVolume - (trade.volume || 0);
      const ratio =
        volumeChange !== 0 ? -(balanceChange / volumeChange) * 1000 : 0;
      db.get(
        `SELECT vip FROM accounts WHERE id = ?`,
        [trade.account_id],
        (err, acc) => {
          if (err) {
            console.error("VIP seviyesi DB hatası:", err);
            return res.status(500).json({ error: "Database error" });
          }
          if (!acc) {
            console.log("Hesap bulunamadı, VIP seviyesi alınamadı");
            return res
              .status(404)
              .json({ error: "Hesap bulunamadı, VIP seviyesi alınamadı" });
          }
          console.log(
            "Trade bitirme: trade.account_id =",
            trade.account_id,
            "accounts.vip =",
            acc.vip,
            "accounts kaydı:",
            acc
          );
          const vip =
            typeof acc.vip === "number" && !isNaN(acc.vip) ? acc.vip : 0;
          const feeRate = getFeeRateForVip(vip);
          const fee = volumeChange * feeRate;
          db.run(
            `UPDATE user_pairs_trades SET is_completed = 1, ended_at = ?, exit_balance = ?, exit_volume = ?, fee = ?, vip = ?, ratio = ? WHERE id = ?`,
            [
              getTurkeyTime(),
              exitBalance,
              exitVolume,
              fee,
              vip,
              ratio,
              trade.id,
            ],
            function (err) {
              if (err) {
                console.error("Trade bitirme DB hatası:", err);
                return res.status(500).json({ error: "Database error" });
              }
              console.log("Trade başarıyla bitirildi!");
              res.json({
                message: "Trade bitirildi",
                balanceChange,
                volumeChange,
                vip,
                feeRate,
                fee,
              });
              updateUserPairStats(userId, trade.account_id, trade.pair_id);
            }
          );
        }
      );
    }
  );
});

// GET /api/pairs/trade/list/:accountId/:pairId - Trade listesi
router.get("/trade/list/:accountId/:pairId", authenticateToken, (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);
  const pairId = parseInt(req.params.pairId, 10);
  const userId = req.user.id;
  if (!accountId || !pairId)
    return res.status(400).json({ error: "accountId ve pairId gerekli" });
  db.all(
    `SELECT * FROM user_pairs_trades WHERE user_id = ? AND account_id = ? AND pair_id = ? ORDER BY started_at DESC`,
    [userId, accountId, pairId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ trades: rows });
    }
  );
});

// PUT /api/pairs/trade/:tradeId - Trade düzenle
router.put("/trade/:tradeId", authenticateToken, (req, res) => {
  const tradeId = parseInt(req.params.tradeId, 10);
  const { volume, entry_balance, exit_balance, exit_volume } = req.body;
  const userId = req.user.id;

  if (!tradeId) return res.status(400).json({ error: "tradeId gerekli" });

  db.get(
    `SELECT * FROM user_pairs_trades WHERE id = ? AND user_id = ?`,
    [tradeId, userId],
    (err, trade) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!trade) return res.status(404).json({ error: "Trade bulunamadı" });

      // Güncellenecek alanları belirle
      const updates = [];
      const params = [];

      let newVolume = typeof volume === "number" ? volume : trade.volume;
      let newExitVolume =
        typeof exit_volume === "number" ? exit_volume : trade.exit_volume;

      if (typeof volume === "number") {
        updates.push("volume = ?");
        params.push(volume);
      }
      if (typeof entry_balance === "number") {
        updates.push("entry_balance = ?");
        params.push(entry_balance);
      }
      if (typeof exit_balance === "number") {
        updates.push("exit_balance = ?");
        params.push(exit_balance);
      }
      if (typeof exit_volume === "number") {
        updates.push("exit_volume = ?");
        params.push(exit_volume);
      }

      // Eğer hacim veya bakiye değiştiyse ratio'yu güncelle
      let balanceChange = null;
      let volumeChange = null;
      if (
        typeof entry_balance === "number" ||
        typeof exit_balance === "number" ||
        typeof volume === "number" ||
        typeof exit_volume === "number"
      ) {
        const eb =
          typeof entry_balance === "number"
            ? entry_balance
            : trade.entry_balance;
        const xb =
          typeof exit_balance === "number" ? exit_balance : trade.exit_balance;
        const v = typeof volume === "number" ? volume : trade.volume;
        const xv =
          typeof exit_volume === "number" ? exit_volume : trade.exit_volume;
        balanceChange = (xb ?? 0) - (eb ?? 0);
        volumeChange = (xv ?? 0) - (v ?? 0);
        const ratio =
          volumeChange !== 0 ? -(balanceChange / volumeChange) * 1000 : 0;
        updates.push("ratio = ?");
        params.push(ratio);
      }

      // Eğer hacim değiştiyse fee'yi güncelle
      if (typeof volume === "number" || typeof exit_volume === "number") {
        // VIP seviyesini al
        db.get(
          `SELECT vip FROM accounts WHERE id = ?`,
          [trade.account_id],
          (err, acc) => {
            if (err) return res.status(500).json({ error: "Database error" });
            const vip =
              typeof acc.vip === "number" && !isNaN(acc.vip) ? acc.vip : 0;
            const feeRate = getFeeRateForVip(vip);
            const fee = (newExitVolume - newVolume) * feeRate;
            updates.push("fee = ?");
            params.push(fee);
            params.push(tradeId);
            db.run(
              `UPDATE user_pairs_trades SET ${updates.join(", ")} WHERE id = ?`,
              params,
              function (err) {
                if (err)
                  return res
                    .status(500)
                    .json({ error: "Trade güncellenemedi" });
                res.json({
                  message: "Trade güncellendi ve fee otomatik hesaplandı",
                  fee,
                });
                updateUserPairStats(userId, trade.account_id, trade.pair_id);
              }
            );
          }
        );
      } else {
        params.push(tradeId);
        db.run(
          `UPDATE user_pairs_trades SET ${updates.join(", ")} WHERE id = ?`,
          params,
          function (err) {
            if (err)
              return res.status(500).json({ error: "Trade güncellenemedi" });
            res.json({ message: "Trade güncellendi" });
            updateUserPairStats(userId, trade.account_id, trade.pair_id);
          }
        );
      }
    }
  );
});

// DELETE /api/pairs/trade/:tradeId - Trade sil
router.delete("/trade/:tradeId", authenticateToken, (req, res) => {
  const tradeId = parseInt(req.params.tradeId, 10);
  const userId = req.user.id;

  if (!tradeId) return res.status(400).json({ error: "tradeId gerekli" });

  db.run(
    `DELETE FROM user_pairs_trades WHERE id = ? AND user_id = ?`,
    [tradeId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Trade silinemedi" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Trade bulunamadı" });
      res.json({ message: "Trade silindi" });
      db.get(
        `SELECT account_id, pair_id FROM user_pairs_trades WHERE id = ? AND user_id = ?`,
        [tradeId, userId],
        (err, trade) => {
          if (!err && trade) {
            updateUserPairStats(userId, trade.account_id, trade.pair_id);
          }
        }
      );
    }
  );
});

// GET /api/pairs/trades - Trade listesi
router.get("/trades", authenticateToken, (req, res) => {
  const { accountId, pairId } = req.query;
  const userId = req.user.id;
  let query = `SELECT * FROM user_pairs_trades WHERE user_id = ?`;
  let params = [userId];
  if (accountId) {
    query += ` AND account_id = ?`;
    params.push(accountId);
  }
  if (pairId) {
    query += ` AND pair_id = ?`;
    params.push(pairId);
  }
  query += ` ORDER BY started_at DESC`;
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    // Bakiye ve hacim değişimini hesapla
    const trades = rows.map((trade) => ({
      ...trade,
      balanceChange:
        (trade.exit_balance ?? null) !== null &&
        (trade.entry_balance ?? null) !== null
          ? trade.exit_balance - trade.entry_balance
          : null,
      volumeChange:
        (trade.exit_volume ?? null) !== null && (trade.volume ?? null) !== null
          ? trade.exit_volume - trade.volume
          : null,
    }));
    res.json(trades);
  });
});

// DELETE /api/pairs/:id - Admin parite silme
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const pairId = parseInt(req.params.id, 10);

  if (!pairId || isNaN(pairId)) {
    return res.status(400).json({ error: "Geçerli parite ID'si gerekli" });
  }

  // Önce paritenin var olup olmadığını kontrol et
  db.get("SELECT id, name FROM pairs WHERE id = ?", [pairId], (err, pair) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!pair) {
      return res.status(404).json({ error: "Parite bulunamadı" });
    }

    // Pariteyi sil
    db.run("DELETE FROM pairs WHERE id = ?", [pairId], function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        message: `${pair.name} paritesi başarıyla silindi`,
        deletedPair: { id: pairId, name: pair.name },
      });
    });
  });
});

// PATCH /api/pairs/userpair/reward - user_pairs tablosunda ödül miktarını güncelle
router.patch("/userpair/reward", authenticateToken, (req, res) => {
  const { accountId, pairId, rewardAmount, price } = req.body;
  const userId = req.user.id;

  if (
    !accountId ||
    !pairId ||
    typeof rewardAmount !== "number" ||
    typeof price !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "accountId, pairId, rewardAmount ve price gereklidir" });
  }

  const rewardAmountUsd = rewardAmount * price;

  db.run(
    `UPDATE user_pairs SET reward_amount = ?, reward_amount_usd = ? WHERE user_id = ? AND account_id = ? AND pair_id = ?`,
    [rewardAmount, rewardAmountUsd, userId, accountId, pairId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({
        message: "Ödül miktarı güncellendi",
        rewardAmount,
        rewardAmountUsd,
      });
    }
  );
});

// PATCH /api/pairs/userpair/selled - user_pairs tablosunda selled_dolar güncelle
router.patch("/userpair/selled", authenticateToken, (req, res) => {
  const { accountId, pairId, selledDolar } = req.body;
  const userId = req.user.id;

  if (!accountId || !pairId || typeof selledDolar !== "number") {
    return res
      .status(400)
      .json({ error: "accountId, pairId, selledDolar gereklidir" });
  }

  db.run(
    `UPDATE user_pairs SET selled_dolar = ? WHERE user_id = ? AND account_id = ? AND pair_id = ?`,
    [selledDolar, userId, accountId, pairId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({
        message: "Satış (USD) güncellendi",
        selledDolar,
      });
    }
  );
});

// GET /api/pairs/statistics - Kullanıcıya göre istatistikler (admin: tümü, normal: sadece kendi hesapları)
router.get("/statistics", authenticateToken, (req, res) => {
  let query = `SELECT up.id, u.username as user_name, a.id as account_id, a.user_id, a.vip, a.created_at as account_created_at, a.name as account_name, 
                      p.id as pair_id, p.name as pair_name, p.is_active, up.is_completed, up.reward_amount, up.completed_at, up.total_volume, up.total_cost, up.total_refund, up.avg_trade, up.selled_dolar,
                      MIN(t.started_at) as first_trade_date, MAX(t.ended_at) as last_trade_date
               FROM user_pairs up
               JOIN accounts a ON up.account_id = a.id
               JOIN users u ON a.user_id = u.id
               JOIN pairs p ON up.pair_id = p.id
               LEFT JOIN user_pairs_trades t ON up.user_id = t.user_id AND up.account_id = t.account_id AND up.pair_id = t.pair_id`;
  let params = [];
  let whereConditions = [];

  // Admin değilse sadece kendi hesaplarını görebilir
  if (!req.user.isAdmin) {
    whereConditions.push(`a.user_id = ?`);
    params.push(req.user.id);
  }

  // Eğer pairId parametresi varsa filtrele
  if (req.query.pairId) {
    whereConditions.push(`p.id = ?`);
    params.push(parseInt(req.query.pairId));
  }

  // WHERE koşullarını ekle
  if (whereConditions.length > 0) {
    query += ` WHERE ` + whereConditions.join(" AND ");
  }

  query += ` GROUP BY up.id, u.username, a.id, a.user_id, a.vip, a.created_at, a.name, p.id, p.name, p.is_active, up.is_completed, up.reward_amount, up.completed_at, up.total_volume, up.total_cost, up.total_refund, up.avg_trade, up.selled_dolar`;
  query += ` ORDER BY up.is_completed ASC, p.created_at DESC, a.id ASC`;

  console.log("Statistics query:", query);
  console.log("Statistics params:", params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Statistics query error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    console.log("Statistics result count:", rows ? rows.length : 0);
    res.json({ statistics: rows });
  });
});

// GET /api/pairs/user-pair-list - Kullanıcının tüm hesaplarındaki aktif ve biten pariteler (sadece isim/id/durum)
router.get("/user-pair-list", authenticateToken, (req, res) => {
  const userId = req.user.id;
  // Tüm hesaplarındaki user_pairs ve pair adlarını çek
  const sql = `SELECT p.id as pair_id, p.name as pair_name,
    MIN(up.is_completed) as all_completed, MAX(up.is_completed) as any_completed
    FROM user_pairs up
    JOIN pairs p ON up.pair_id = p.id
    JOIN accounts a ON up.account_id = a.id
    WHERE a.user_id = ?
    GROUP BY p.id
    ORDER BY p.name ASC`;
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    // Sadece tüm hesaplarda tamamlanmış olanlar bitenlere, diğerleri aktife
    const activePairs = rows
      .filter((r) => r.all_completed == 0)
      .map((r) => ({
        pair_id: r.pair_id,
        pair_name: r.pair_name,
        is_completed: 0,
      }));
    const completedPairs = rows
      .filter((r) => r.all_completed == 1)
      .map((r) => ({
        pair_id: r.pair_id,
        pair_name: r.pair_name,
        is_completed: 1,
      }));
    res.json({ activePairs, completedPairs });
  });
});

// GET /api/pairs/download-database - Database yedekleme (sadece admin)
router.get("/download-database", authenticateToken, isAdmin, (req, res) => {
  const fs = require("fs");
  const path = require("path");

  console.log("=== DATABASE İNDİRME İŞLEMİ BAŞLADI ===");
  console.log("Kullanıcı ID:", req.user.id);
  console.log("Kullanıcı Admin mi:", req.user.isAdmin);
  console.log("Tarih:", new Date().toISOString());

  const dbPath = path.join(__dirname, "../users.db");
  console.log("Database yolu:", dbPath);

  // Dosya var mı kontrol et
  if (!fs.existsSync(dbPath)) {
    console.error("❌ Database dosyası bulunamadı:", dbPath);
    return res.status(404).json({ error: "Database dosyası bulunamadı" });
  }

  console.log("✅ Database dosyası bulundu");

  // Dosya istatistiklerini al
  const stats = fs.statSync(dbPath);
  console.log("📊 Dosya boyutu:", stats.size, "bytes");
  console.log("📅 Dosya oluşturulma tarihi:", stats.birthtime);
  console.log("📅 Dosya değiştirilme tarihi:", stats.mtime);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `users-backup-${timestamp}.db`;
  console.log("📁 İndirilecek dosya adı:", filename);

  // Dosyayı indir
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", stats.size);

  console.log("🚀 Dosya indirme başlatılıyor...");

  const fileStream = fs.createReadStream(dbPath);

  fileStream.on("error", (error) => {
    console.error("❌ Dosya okuma hatası:", error);
  });

  fileStream.on("end", () => {
    console.log("✅ Dosya indirme tamamlandı");
    console.log("=== DATABASE İNDİRME İŞLEMİ BİTTİ ===");
  });

  fileStream.pipe(res);
});

module.exports = router;
