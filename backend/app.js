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

// CORS ayarları - production ve development için
const corsOptions = {
  origin: function (origin, callback) {
    // Development'ta tüm origin'lere izin ver
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // Production'ta sadece belirli domain'lere izin ver
    const allowedOrigins = [
      "https://tradepanel-frontend.vercel.app/", // Vercel URL'inizi buraya yazın
      "http://localhost:3000", // Local development
      "http://localhost:3001", // Local development
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/pairs", pairsRouter);

// Vercel için port ayarı
const port = process.env.PORT || 3001;

// Sadece development'ta server'ı başlat
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
