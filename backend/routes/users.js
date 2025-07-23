const express = require("express");
const router = express.Router();
const db = require("../db");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

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

module.exports = router;
