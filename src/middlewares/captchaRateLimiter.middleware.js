const redisClient = require("../utils/redisClient"); // імпортуємо клієнт Redis

const CAPTCHA_LIMIT = 20;
const WINDOW_SECONDS = 30;

module.exports = async function captchaRateLimiter(req, res, next) {
  try {
    const identifier =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.headers["fingerprint"] ||
      "unknown";

    const redisKey = `captcha:rate:${identifier}`;

    const current = await redisClient.incr(redisKey);

    if (current === 1) {
      // перший запит — ставимо TTL
      await redisClient.expire(redisKey, WINDOW_SECONDS);
    }

    if (current > CAPTCHA_LIMIT) {
      return res.status(429).json({
        error: "Too many CAPTCHA requests. Please wait a minute.",
      });
    }

    next();
  } catch (err) {
    console.error("CAPTCHA limiter error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
