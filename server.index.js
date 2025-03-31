const cfg = require("./src/config/config");
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const cookieParser = require("cookie-parser");
const sequelize = require("./src/database/db");
const { parse } = require("dotenv");
const router = require("./src/routes/index.routes");
const errorHandler = require("./src/middlewares/error.handling.middleware");
const models = require("./src/models/index.models");
const { Pool } = require("pg"); // Використовуємо pg замість mysql2
const app = express();
const PORT = cfg.server.port || 7000;
const svgCaptcha = require("svg-captcha");
const session = require("express-session");

app.use(express.json());
app.use(cookieParser());
app.use(
  express.static(path.resolve(__dirname, "..","uploads","image.data"), {
    setHeaders: (res, path) => {
      console.log(`Requesting file: ${path}`);
    },
  })
);

app.use(fileUpload({}));
app.use(
  cors({
    origin: cfg.server.clientUrl,
    credentials: true,
  })
);
app.use("/api", router);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is online!" });
});

app.use(errorHandler);

// Налаштування сесій
app.use(session({
  secret: cfg.jwt.secret,  // Задайте секретний ключ
  resave: false,
  saveUninitialized: true,
}));

app.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create();
  // Зберігаємо текст CAPTCHA у сесії
  req.session.captcha = captcha.text;  
  res.type("svg");
  res.send(captcha.data);
});

// API для отримання тексту CAPTCHA
app.get("/captcha-text", (req, res) => {
  // Надсилаємо текст CAPTCHA з сесії
    if (req.session.captcha) {
    res.json({ captchaText: req.session.captcha });
  } else {
    res.status(400).json({ error: "CAPTCHA text not found" });
  }
});

app.post("/submit", express.json(), (req, res) => {
  const { captchaInput } = req.body;

  if (captchaInput === req.session.captcha) {
    res.send("Captcha correct!");
  } else {
    res.send("Captcha incorrect!");
  }
});
const start = async () => {
  try {
    const pool = new Pool({
      host: cfg.database.host,
      port: cfg.database.port,
      user: cfg.database.user,
      password: cfg.database.password,
      database: cfg.database.dialect, // Підключаємось до стандартної бази PostgreSQL
    });

    const client = await pool.connect();
    const dbName = "comment"; // PostgreSQL не підтримує дефіс у назві БД

    const dbExists = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbExists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    client.release(); // Відпускаємо підключення

    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    app.listen(PORT, () => console.log(`Server is starting on port: ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();
