const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = "supersecretkey"; // Gerçek projede .env ile saklanmalı

// Admin kullanıcı adı ve şifresi (gerçek projede veritabanında saklanmalı)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "deneme123.";

// Kullanıcı kaydı
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Kullanıcı adı ve şifre zorunlu." });
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (user)
        return res.status(400).json({ error: "Kullanıcı adı zaten alınmış." });
      const hash = await bcrypt.hash(password, 10);
      db.run(
        "INSERT INTO users (username, password, is_approved, is_pro) VALUES (?, ?, 0, 0)",
        [username, hash],
        function (err) {
          if (err) {
            console.error("REGISTER ERROR:", err); // Hata detayını logla
            return res.status(500).json({ error: "Kayıt sırasında hata." });
          }
          // Yeni kullanıcıyı is_pro ile döndür
          db.get(
            "SELECT id, username, is_approved, COALESCE(is_pro, 0) as is_pro FROM users WHERE id = ?",
            [this.lastID],
            (err, newUser) => {
              res.json({
                success: true,
                message: "Kayıt başarılı, admin onayı bekleniyor.",
                user: newUser,
              });
            }
          );
        }
      );
    }
  );
});

// Kullanıcı girişi
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Kullanıcı adı ve şifre zorunlu." });
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (!user)
        return res.status(400).json({ error: "Kullanıcı bulunamadı." });
      if (!user.is_approved)
        return res
          .status(403)
          .json({ error: "Hesabınız henüz admin tarafından onaylanmadı." });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: "Şifre hatalı." });
      const token = jwt.sign(
        { id: user.id, username: user.username, is_pro: user.is_pro },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: { id: user.id, username: user.username, is_pro: user.is_pro },
      });
    }
  );
});

// Admin girişi
router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Kullanıcı adı ve şifre zorunlu." });

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 0, username: username, isAdmin: true },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: 0, username: username, isAdmin: true } });
  } else {
    res.status(401).json({ error: "Admin bilgileri hatalı." });
  }
});

// Admin: Tüm kullanıcıları listele
router.get("/admin/users", (req, res) => {
  db.all(
    "SELECT id, username, is_approved, COALESCE(is_pro, 0) as is_pro FROM users ORDER BY id DESC",
    (err, users) => {
      if (err) {
        console.error("KULLANICI LİSTESİ HATASI:", err);
        return res
          .status(500)
          .json({ error: "Kullanıcılar listelenirken hata." });
      }
      res.json({ users });
    }
  );
});

// Admin: Kullanıcıyı onayla
router.post("/admin/approve", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Kullanıcı ID zorunlu." });
  db.run(
    "UPDATE users SET is_approved = 1 WHERE id = ?",
    [userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Onay sırasında hata." });
      if (this.changes === 0)
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      // Onaylandıysa default hesap oluştur
      db.run(
        "INSERT INTO accounts (user_id, name) VALUES (?, ?)",
        [userId, "Default"],
        function (err2) {
          if (err2)
            return res
              .status(500)
              .json({ error: "Default hesap oluşturulamadı." });
          res.json({
            success: true,
            message: "Kullanıcı onaylandı ve default hesap oluşturuldu.",
          });
        }
      );
    }
  );
});

// Admin: Kullanıcıyı reddet/sil
router.delete("/admin/users/:userId", (req, res) => {
  const { userId } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
    if (err)
      return res.status(500).json({ error: "Kullanıcı silinirken hata." });
    if (this.changes === 0)
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    res.json({ success: true, message: "Kullanıcı silindi." });
  });
});

// Admin: Kullanıcıyı onayla (örnek, gerçek projede auth eklenmeli)
router.post("/approve", (req, res) => {
  const { username } = req.body;
  if (!username)
    return res.status(400).json({ error: "Kullanıcı adı zorunlu." });
  db.run(
    "UPDATE users SET is_approved = 1 WHERE username = ?",
    [username],
    function (err) {
      if (err) return res.status(500).json({ error: "Onay sırasında hata." });
      if (this.changes === 0)
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      res.json({ success: true, message: "Kullanıcı onaylandı." });
    }
  );
});

// Admin: Kullanıcıyı pro yap
router.post("/admin/setpro", (req, res) => {
  const { userId, isPro } = req.body;
  if (typeof userId === "undefined" || typeof isPro === "undefined")
    return res.status(400).json({ error: "Kullanıcı ID ve isPro zorunlu." });
  db.run(
    "UPDATE users SET is_pro = ? WHERE id = ?",
    [isPro ? 1 : 0, userId],
    function (err) {
      if (err)
        return res
          .status(500)
          .json({ error: "Pro yetkisi güncellenirken hata." });
      if (this.changes === 0)
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      res.json({
        success: true,
        message: isPro
          ? "Kullanıcı pro yapıldı."
          : "Kullanıcı pro yetkisi kaldırıldı.",
      });
    }
  );
});

module.exports = router;
