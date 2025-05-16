const Redis = require("ioredis");
const cfg = require("../config/config");
// Підключення до Redis
const redis = new Redis({
  host: cfg.get("redis.host"),
  port: cfg.get("redis.port"),
  password: cfg.get("redis.password"),
  db: cfg.get("redis.db"),
});
redis.on("connect", () => {
  console.log("Connected to Redis!");
});

redis.on("error", (err) => {
  console.log("Error connecting to Redis:", err);
});

module.exports = redis;
