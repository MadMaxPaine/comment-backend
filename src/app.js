const cfg = require("../src/config/config");
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const router = require("../src/routes/index.routes");
const errorHandler = require("../src/middlewares/error.handling.middleware");
const models = require("../src/models/index.models");
const app = express();
const svgCaptcha = require("svg-captcha");
const session = require("express-session");
const corsOptions = require("./config/cors");
const { createClient } = require("redis"); // Підключаємо redis
const { RedisStore } = require("connect-redis");
// Ініціалізація клієнта Redis
const redisClient = createClient({
  url: "redis://localhost:6379", // Вказуємо адресу для підключення до Redis
});
redisClient.connect().catch(console.error);


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is online!" });
});

app.use(
  session({
    store: new RedisStore({
      client: redisClient, // Використовуємо клієнт redis
      prefix: "cbapp:", // Префікс для ключів в Redis
    }),
    secret: "your_secret_key", // Секретний ключ для сесії
    resave: false, // Не зберігати сесію, якщо нічого не змінилося
    saveUninitialized: true, // Зберігати незаповнені сесії
    rolling: true, // Оновлювати час сесії на кожен запит
    cookie: {
      secure: false, // Якщо без HTTPS
      maxAge: 300000, // Сесія буде існувати 5 хвилин (300000 мс), можна збільшити
    },
  })
);

app.use("/api", router);
app.use(errorHandler);
module.exports = app;
