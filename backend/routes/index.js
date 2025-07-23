const express = require("express");
const router = express.Router();

// Healthcheck endpoint for Railway
router.get("/", (req, res) => {
  res.json({ status: "OK", message: "Trade Panel API is running" });
});

// Healthcheck endpoint for Railway
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Trade Panel API is healthy" });
});

module.exports = router;
