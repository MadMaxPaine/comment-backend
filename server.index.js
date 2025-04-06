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
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "src", "uploads")));
/*app.use(
  express.static(path.resolve(__dirname, "..", "uploads", "image.data"), {
    setHeaders: (res, path) => {
      console.log(`Requesting file: ${path}`);
    },
  })
);*/

//app.use(fileUpload({}));
app.use(
  cors({
    origin: cfg.server.clientUrl,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is online!" });
});

app.use(errorHandler);

app.use(
  session({
    secret: "your_secret_key", // Секретний ключ для сесії
    resave: false, // Не зберігати сесію, якщо нічого не змінилося
    saveUninitialized: true, // Зберігати незаповнені сесії
    cookie: {
      secure: false, // Якщо працюєш без HTTPS
      maxAge: 300000, // Сесія буде існувати 5 хвилин (300000 мс), можна збільшити
    },
  })
);
app.use("/api", router);
/*
app.get("/sessiontest", (req, res) => {
  if (!req.session.viewCount) {
    req.session.viewCount = 1;
    res.send("Session initialized.");
  } else {
    req.session.viewCount += 1;
    res.send(`You have visited this page ${req.session.viewCount} times.`);
  }
});*/
// 📌 Генерація CAPTCHA
app.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({ noise: 6, size: 6, color: true });
  req.session.captcha = captcha.text.toLowerCase(); // Зберігаємо CAPTCHA (у нижньому регістрі)
  req.session.captchaGeneratedAt = Date.now(); // Додаємо час створення CAPTCHA

  console.log("Generated CAPTCHA:", captcha.text);
  console.log("Session after generating CAPTCHA:", req.session);

  res.type("svg");
  res.send(captcha.data);
});

app.post("/submit", (req, res) => {
  const { captchaInput } = req.body;
  console.log("Captcha Input:", captchaInput);
  console.log("Session before CAPTCHA check:", req.session);

  // Перевірка терміну дії CAPTCHA
  const captchaExpiryTime = 5 * 60 * 1000; // 5 хвилин
  const captchaGeneratedAt = req.session.captchaGeneratedAt || 0;
  if (Date.now() - captchaGeneratedAt > captchaExpiryTime) {
    return res.status(400).send("Captcha expired. Try again.");
  }

  if (!req.session.captcha) {
    return res.status(400).send("Captcha expired. Try again.");
  }

  // Перевірка введеного тексту CAPTCHA
  if (captchaInput.toLowerCase() === req.session.captcha) {
    req.session.isCaptchaVerified = true; // Відзначаємо, що CAPTCHA пройдена
    //console.log(req.session);

    return res.send("✅ Captcha correct!");
  }

  res.send("❌ Captcha incorrect!");
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
