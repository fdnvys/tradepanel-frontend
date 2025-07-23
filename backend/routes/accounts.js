const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "supersecretkey";

// Middleware: Kullanıcıyı JWT ile doğrula
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Hesapları listele (kullanıcıya özel)
router.get("/", authenticateToken, (req, res) => {
  db.all(
    "SELECT id, name, created_at, vip FROM accounts WHERE user_id = ? ORDER BY id ASC",
    [req.user.id],
    (err, accounts) => {
      if (err)
        return res.status(500).json({ error: "Hesaplar listelenemedi." });
      res.json({ accounts });
    }
  );
});

// Yeni hesap oluştur
router.post("/", authenticateToken, (req, res) => {
  console.log("=== HESAP EKLEME İSTEĞİ ===");
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);
  console.log("Body type:", typeof req.body);
  console.log("Body keys:", Object.keys(req.body));
  console.log("========================");

  const { name, vip } = req.body;
  if (!name) {
    console.log("HATA: name eksik!");
    return res.status(400).json({ error: "Hesap adı zorunlu." });
  }

  console.log("Hesap adı:", name);
  const vipLevel = Number.isInteger(vip) ? vip : 0;
  db.run(
    "INSERT INTO accounts (user_id, name, vip) VALUES (?, ?, ?)",
    [req.user.id, name, vipLevel],
    function (err) {
      if (err) {
        console.log("DB hatası:", err);
        return res.status(500).json({ error: "Hesap oluşturulamadı." });
      }
      console.log("Hesap başarıyla oluşturuldu, ID:", this.lastID);
      db.get(
        "SELECT id, name, created_at, vip FROM accounts WHERE id = ?",
        [this.lastID],
        (err, account) => {
          if (err) {
            console.log("Hesap getirme hatası:", err);
            return res
              .status(500)
              .json({ error: "Hesap oluşturuldu ama getirilemedi." });
          }
          console.log("Oluşturulan hesap:", account);
          res.json({ account });
        }
      );
    }
  );
});

// Hesap sil
router.delete("/:accountId", authenticateToken, (req, res) => {
  const { accountId } = req.params;
  db.run(
    "DELETE FROM accounts WHERE id = ? AND user_id = ?",
    [accountId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Hesap silinemedi." });
      if (this.changes === 0)
        return res.status(404).json({ error: "Hesap bulunamadı." });
      res.json({ success: true, message: "Hesap silindi." });
    }
  );
});

// VIP güncelle
router.put("/:accountId/vip", authenticateToken, (req, res) => {
  const { accountId } = req.params;
  const { vip } = req.body;
  if (typeof vip !== "number" || vip < 0) {
    return res.status(400).json({ error: "Geçersiz VIP seviyesi." });
  }
  db.run(
    "UPDATE accounts SET vip = ? WHERE id = ? AND user_id = ?",
    [vip, accountId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "VIP güncellenemedi." });
      if (this.changes === 0)
        return res.status(404).json({ error: "Hesap bulunamadı." });
      res.json({ success: true, vip });
    }
  );
});

module.exports = router;
