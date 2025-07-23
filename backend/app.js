const cors = require("cors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const accountsRouter = require("./routes/accounts");
const pairsRouter = require("./routes/pairs");

const app = express();

// Production için CORS ayarları
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://quantteknoloji.com", "https://www.quantteknoloji.com"]
      : "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API routes
app.use("/api", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/pairs", pairsRouter);

// Production'da React build dosyalarını serve et
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
} else {
  app.use(express.static(path.join(__dirname, "public")));
}

module.exports = app;
