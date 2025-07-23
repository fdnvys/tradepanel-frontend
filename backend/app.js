const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const app = express();

// CORS ayarları
const corsOptions = {
  origin: [
    "https://tradepanel-frontend.vercel.app",
    "https://tradepanel-frontend-git-main-fdnvys.vercel.app",
    "https://tradepanel-frontend-fdnvys.vercel.app",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight için

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger("dev"));

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Health check passed" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Trade Panel API is running" });
});

// API Routes
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const accountsRouter = require("./routes/accounts");
const pairsRouter = require("./routes/pairs");

// API routes
app.use("/api", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/pairs", pairsRouter);

// Production'da sadece API serve et, frontend build dosyalarını arama
if (process.env.NODE_ENV === "production") {
  // Sadece API endpoint'leri
  app.get("*", (req, res) => {
    res.json({ status: "OK", message: "Trade Panel API is running" });
  });
} else {
  app.use(express.static(path.join(__dirname, "public")));
}

module.exports = app;
