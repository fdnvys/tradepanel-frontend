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

app.use(cors());
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
// Frontend çift API sorunu çözüldü - 07/25/2025 04:10:00
// Frontend endpoint'ler düzeltildi - 07/25/2025 04:15:00
// Environment variable değiştirmeden çift API sorunu çözüldü - 07/25/2025 04:20:00
