const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// JWT secret key
const JWT_SECRET = "supersecretkey";

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Auth header:", authHeader);
  console.log("Token:", token);

  if (!token) {
    console.log("Token bulunamadı");
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Token doğrulama hatası:", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    console.log("Token doğrulandı, user:", user);
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log("isAdmin kontrolü, user:", req.user);
  if (!req.user.isAdmin) {
    console.log("Admin erişimi reddedildi");
    return res.status(403).json({ error: "Admin access required" });
  }
  console.log("Admin erişimi onaylandı");
  next();
};

/* GET users listing. */
router.get("/", authenticateToken, isAdmin, function (req, res, next) {
  console.log("Users endpoint çağrıldı, user:", req.user);
  const query = "SELECT id, username FROM users ORDER BY username ASC";

  db.all(query, [], (err, users) => {
    if (err) {
      console.error("Kullanıcılar listesi hatası:", err);
      return res.status(500).json({ error: "Database error" });
    }
    console.log("Kullanıcılar başarıyla getirildi:", users?.length || 0);
    res.json({ users: users || [] });
  });
});

// GET /api/users/:userId/statistics - Kullanıcının genel istatistikleri
router.get("/:userId/statistics", authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (!userId) return res.status(400).json({ error: "userId gerekli" });

  // Kullanıcının genel istatistiklerini hesapla
  const query = `
    SELECT 
      u.id,
      u.username,
      u.refund_rate,
      COUNT(DISTINCT a.id) as total_accounts,
      COUNT(DISTINCT up.id) as total_pairs,
      SUM(up.total_volume) as total_volume,
      SUM(up.total_cost) as total_cost,
      SUM(up.total_refund) as total_refund,
      SUM(up.reward_amount) as total_reward,
      COUNT(CASE WHEN up.is_completed = 1 THEN 1 END) as completed_pairs,
      COUNT(CASE WHEN up.is_completed = 0 THEN 1 END) as active_pairs,
      SUM(up.selled_dolar) as total_selled_dolar
    FROM users u
    LEFT JOIN accounts a ON u.id = a.user_id
    LEFT JOIN user_pairs up ON a.id = up.account_id
    WHERE u.id = ?
    GROUP BY u.id, u.username, u.refund_rate
  `;

  db.get(query, [userId], (err, userStats) => {
    if (err) {
      console.error("Kullanıcı istatistikleri hatası:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!userStats) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Verimlilik hesapla (kar/zarar oranı)
    const efficiency =
      userStats.total_cost > 0
        ? (userStats.total_refund + userStats.total_selled_dolar) /
            userStats.total_cost -
          1
        : 0;

    // Kar hesapla
    const profit =
      (userStats.total_selled_dolar || 0) +
      (userStats.total_refund || 0) -
      (userStats.total_cost || 0);

    // Trade ortalaması hesapla
    const avgTrade =
      userStats.total_volume > 0
        ? userStats.total_cost / (userStats.total_volume / 1000)
        : 0;

    res.json({
      user: {
        id: userStats.id,
        username: userStats.username,
        refund_rate: userStats.refund_rate || 0,
      },
      statistics: {
        total_accounts: userStats.total_accounts || 0,
        total_pairs: userStats.total_pairs || 0,
        total_volume: userStats.total_volume || 0,
        total_cost: userStats.total_cost || 0,
        total_refund: userStats.total_refund || 0,
        total_reward: userStats.total_reward || 0,
        completed_pairs: userStats.completed_pairs || 0,
        active_pairs: userStats.active_pairs || 0,
        avg_trade: Math.round(avgTrade * 10000) / 10000,
        total_selled_dolar: userStats.total_selled_dolar || 0,
        efficiency: Math.round(efficiency * 10000) / 10000,
        profit: Math.round(profit * 100) / 100,
      },
    });
  });
});

// GET /api/users/:userId/pair-statistics - Kullanıcının parite bazlı istatistikleri
router.get(
  "/:userId/pair-statistics",
  authenticateToken,
  isAdmin,
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) return res.status(400).json({ error: "userId gerekli" });

    const query = `
    SELECT 
      p.id as pair_id,
      p.name as pair_name,
      p.reward as pair_reward,
      COUNT(up.id) as account_count,
      SUM(up.total_volume) as total_volume,
      SUM(up.total_cost) as total_cost,
      SUM(up.total_refund) as total_refund,
      SUM(up.reward_amount) as total_reward,
      AVG(up.avg_trade) as avg_trade,
      SUM(up.selled_dolar) as total_selled_dolar,
      COUNT(CASE WHEN up.is_completed = 1 THEN 1 END) as completed_accounts,
      COUNT(CASE WHEN up.is_completed = 0 THEN 1 END) as active_accounts,
      MIN(up.created_at) as first_started,
      MAX(up.completed_at) as last_completed
    FROM user_pairs up
    JOIN accounts a ON up.account_id = a.id
    JOIN pairs p ON up.pair_id = p.id
    WHERE a.user_id = ?
    GROUP BY p.id, p.name, p.reward
    ORDER BY p.name ASC
  `;

    db.all(query, [userId], (err, pairStats) => {
      if (err) {
        console.error("Parite istatistikleri hatası:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Her parite için verimlilik, kar ve trade ortalaması hesapla
      const enrichedStats = pairStats.map((stat) => {
        const efficiency =
          stat.total_cost > 0
            ? (stat.total_refund + stat.total_selled_dolar) / stat.total_cost -
              1
            : 0;

        const profit =
          (stat.total_selled_dolar || 0) +
          (stat.total_refund || 0) -
          (stat.total_cost || 0);

        // Trade ortalaması hesapla
        const avgTrade =
          stat.total_volume > 0
            ? stat.total_cost / (stat.total_volume / 1000)
            : 0;

        return {
          ...stat,
          efficiency: Math.round(efficiency * 10000) / 10000,
          profit: Math.round(profit * 100) / 100,
          avg_trade: Math.round(avgTrade * 10000) / 10000,
        };
      });

      res.json({ pair_statistics: enrichedStats });
    });
  }
);

// Kullanıcının toplam fee ve toplam iade bilgisini dönen endpoint
router.get("/:userId/rebate-summary", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (!userId) return res.status(400).json({ error: "userId gerekli" });

  // Kullanıcının iade oranını çek
  db.get(
    "SELECT rebate_rate FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error (rebate_rate)" });
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      const rebateRate = user.rebate_rate || 0;
      // Kullanıcının toplam fee'sini hesapla
      db.get(
        "SELECT SUM(fee) as totalFee FROM user_pairs_trades WHERE user_id = ?",
        [userId],
        (err, row) => {
          if (err) return res.status(500).json({ error: "DB error (fee)" });
          const totalFee = row.totalFee || 0;
          const totalRebate = totalFee * rebateRate;
          res.json({
            userId,
            rebateRate,
            totalFee,
            totalRebate,
          });
        }
      );
    }
  );
});

// Admin panelden kullanıcıya iade oranı güncelleme endpointi
router.put("/:userId/rebate-rate", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { rebateRate } = req.body;
  if (!userId || typeof rebateRate !== "number") {
    return res.status(400).json({ error: "userId ve rebateRate gerekli" });
  }
  db.run(
    "UPDATE users SET rebate_rate = ? WHERE id = ?",
    [rebateRate, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      res.json({ message: "İade oranı güncellendi", userId, rebateRate });
    }
  );
});

// Kullanıcının refund_rate bilgisini dönen endpoint
router.get("/:userId/refund-rate", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (!userId) return res.status(400).json({ error: "userId gerekli" });
  db.get(
    "SELECT refund_rate FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB error (refund_rate)" });
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      res.json({ userId, refund_rate: user.refund_rate ?? 0 });
    }
  );
});

// Admin panelden kullanıcıya refund_rate güncelleme endpointi
router.put("/:userId/refund-rate", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { refund_rate } = req.body;
  if (!userId || typeof refund_rate !== "number") {
    return res.status(400).json({ error: "userId ve refund_rate gerekli" });
  }
  db.run(
    "UPDATE users SET refund_rate = ? WHERE id = ?",
    [refund_rate, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      res.json({ message: "İade oranı güncellendi", userId, refund_rate });
    }
  );
});

// GET /api/users/:userId/statistics-with-date - Tarih filtresi ile kullanıcı istatistikleri
router.get(
  "/:userId/statistics-with-date",
  authenticateToken,
  isAdmin,
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { startDate, endDate } = req.query;

    if (!userId) return res.status(400).json({ error: "userId gerekli" });

    let dateFilter = "";
    let params = [userId];

    if (startDate && endDate) {
      dateFilter = "AND up.created_at BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const query = `
    SELECT 
      u.id,
      u.username,
      u.refund_rate,
      COUNT(DISTINCT a.id) as total_accounts,
      COUNT(DISTINCT up.id) as total_pairs,
      SUM(up.total_volume) as total_volume,
      SUM(up.total_cost) as total_cost,
      SUM(up.total_refund) as total_refund,
      SUM(up.reward_amount) as total_reward,
      COUNT(CASE WHEN up.is_completed = 1 THEN 1 END) as completed_pairs,
      COUNT(CASE WHEN up.is_completed = 0 THEN 1 END) as active_pairs,
      SUM(up.selled_dolar) as total_selled_dolar
    FROM users u
    LEFT JOIN accounts a ON u.id = a.user_id
    LEFT JOIN user_pairs up ON a.id = up.account_id ${
      dateFilter ? `AND up.created_at IS NOT NULL ${dateFilter}` : ""
    }
    WHERE u.id = ?
    GROUP BY u.id, u.username, u.refund_rate
  `;

    db.get(query, params, (err, userStats) => {
      if (err) {
        console.error("Kullanıcı istatistikleri hatası:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!userStats) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Verimlilik hesapla
      const efficiency =
        userStats.total_cost > 0
          ? (userStats.total_refund + userStats.total_selled_dolar) /
              userStats.total_cost -
            1
          : 0;

      // Kar hesapla
      const profit =
        (userStats.total_selled_dolar || 0) +
        (userStats.total_refund || 0) -
        (userStats.total_cost || 0);

      // Trade ortalaması hesapla
      const avgTrade =
        userStats.total_volume > 0
          ? userStats.total_cost / (userStats.total_volume / 1000)
          : 0;

      res.json({
        user: {
          id: userStats.id,
          username: userStats.username,
          refund_rate: userStats.refund_rate || 0,
        },
        statistics: {
          total_accounts: userStats.total_accounts || 0,
          total_pairs: userStats.total_pairs || 0,
          total_volume: userStats.total_volume || 0,
          total_cost: userStats.total_cost || 0,
          total_refund: userStats.total_refund || 0,
          total_reward: userStats.total_reward || 0,
          completed_pairs: userStats.completed_pairs || 0,
          active_pairs: userStats.active_pairs || 0,
          avg_trade: Math.round(avgTrade * 10000) / 10000,
          total_selled_dolar: userStats.total_selled_dolar || 0,
          efficiency: Math.round(efficiency * 10000) / 10000,
          profit: Math.round(profit * 100) / 100,
        },
      });
    });
  }
);

// GET /api/users/:userId/account-statistics - Kullanıcının hesap bazlı istatistikleri
router.get(
  "/:userId/account-statistics",
  authenticateToken,
  isAdmin,
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { startDate, endDate } = req.query;

    console.log("Account statistics endpoint çağrıldı, userId:", userId);
    console.log("Date filters:", { startDate, endDate });

    if (!userId) return res.status(400).json({ error: "userId gerekli" });

    let dateFilter = "";
    let params = [userId];

    if (startDate && endDate) {
      dateFilter = "AND up.created_at BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const query = `
    SELECT 
      a.id as account_id,
      a.name as account_name,
      COALESCE(a.vip, 0) as vip,
      a.created_at as account_created_at,
      COALESCE(COUNT(up.id), 0) as total_pairs,
      COALESCE(SUM(up.total_volume), 0) as total_volume,
      COALESCE(SUM(up.total_cost), 0) as total_cost,
      COALESCE(SUM(up.total_refund), 0) as total_refund,
      COALESCE(SUM(up.reward_amount), 0) as total_reward,
      COALESCE(COUNT(CASE WHEN up.is_completed = 1 THEN 1 END), 0) as completed_pairs,
      COALESCE(COUNT(CASE WHEN up.is_completed = 0 THEN 1 END), 0) as active_pairs,
      COALESCE(SUM(up.selled_dolar), 0) as total_selled_dolar,
      MIN(up.created_at) as first_trade_date,
      MAX(up.completed_at) as last_completed_date
    FROM accounts a
    LEFT JOIN user_pairs up ON a.id = up.account_id ${
      dateFilter ? `AND up.created_at IS NOT NULL ${dateFilter}` : ""
    }
    WHERE a.user_id = ?
    GROUP BY a.id, a.name, a.vip, a.created_at
    ORDER BY a.created_at DESC
  `;

    console.log("Query:", query);
    console.log("Params:", params);

    db.all(query, params, (err, accountStats) => {
      if (err) {
        console.error("Hesap istatistikleri hatası:", err);
        return res.status(500).json({ error: "Database error" });
      }

      console.log("Account stats raw data:", accountStats);

      // Her hesap için verimlilik, kar ve trade ortalaması hesapla
      const enrichedStats = accountStats.map((stat) => {
        const efficiency =
          stat.total_cost > 0
            ? (stat.total_refund + stat.total_selled_dolar) / stat.total_cost -
              1
            : 0;

        const profit =
          (stat.total_selled_dolar || 0) +
          (stat.total_refund || 0) -
          (stat.total_cost || 0);

        // Trade ortalaması hesapla
        const avgTrade =
          stat.total_volume > 0
            ? stat.total_cost / (stat.total_volume / 1000)
            : 0;

        return {
          ...stat,
          efficiency: Math.round(efficiency * 10000) / 10000,
          profit: Math.round(profit * 100) / 100,
          avg_trade: Math.round(avgTrade * 10000) / 10000,
        };
      });

      console.log("Enriched stats:", enrichedStats);
      res.json({ account_statistics: enrichedStats });
    });
  }
);

// GET /api/users/:userId/pair-statistics-with-date - Tarih filtresi ile parite istatistikleri
router.get(
  "/:userId/pair-statistics-with-date",
  authenticateToken,
  isAdmin,
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { startDate, endDate } = req.query;

    if (!userId) return res.status(400).json({ error: "userId gerekli" });

    let dateFilter = "";
    let params = [userId];

    if (startDate && endDate) {
      dateFilter = "AND up.created_at BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const query = `
    SELECT 
      p.id as pair_id,
      p.name as pair_name,
      p.reward as pair_reward,
      COUNT(up.id) as account_count,
      SUM(up.total_volume) as total_volume,
      SUM(up.total_cost) as total_cost,
      SUM(up.total_refund) as total_refund,
      SUM(up.reward_amount) as total_reward,
      SUM(up.selled_dolar) as total_selled_dolar,
      COUNT(CASE WHEN up.is_completed = 1 THEN 1 END) as completed_accounts,
      COUNT(CASE WHEN up.is_completed = 0 THEN 1 END) as active_accounts,
      MIN(up.created_at) as first_started,
      MAX(up.completed_at) as last_completed
    FROM user_pairs up
    JOIN accounts a ON up.account_id = a.id
    JOIN pairs p ON up.pair_id = p.id
    WHERE a.user_id = ? ${dateFilter}
    GROUP BY p.id, p.name, p.reward
    ORDER BY p.name ASC
  `;

    db.all(query, params, (err, pairStats) => {
      if (err) {
        console.error("Parite istatistikleri hatası:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Her parite için verimlilik ve kar hesapla
      const enrichedStats = pairStats.map((stat) => {
        const efficiency =
          stat.total_cost > 0
            ? (stat.total_refund + stat.total_selled_dolar) / stat.total_cost -
              1
            : 0;

        const profit =
          (stat.total_selled_dolar || 0) +
          (stat.total_refund || 0) -
          (stat.total_cost || 0);

        return {
          ...stat,
          efficiency: Math.round(efficiency * 10000) / 10000,
          profit: Math.round(profit * 100) / 100,
        };
      });

      res.json({ pair_statistics: enrichedStats });
    });
  }
);

module.exports = router;
