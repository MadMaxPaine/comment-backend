const redisClient = require("../utils/redisClient");
const ApiError = require("../errors/errors.API");

const verifyCaptcha = async (req, res, next) => {
  console.log(req.headers);
  
  const captchaId = req.headers["captcha-id"];
  const captchaInput = req.headers["captcha-input"];
  console.log(captchaId,captchaInput);
  
  try {
    if (!captchaId) {
      throw ApiError.badRequest("❌ Missing CAPTCHA ID.");
    }

    // Перевіряємо, чи вже верифікована
    const isVerified = await redisClient.get(`captcha:verified:${captchaId}`);
    if (isVerified) {
      return next(); // Все ок — вже пройдена
    }

    if (!captchaInput) {
      throw ApiError.badRequest("❌ Missing CAPTCHA input.");
    }

    const storedCaptcha = await redisClient.get(`captcha:${captchaId}`);
    if (!storedCaptcha) {
      throw ApiError.notFound("❌ CAPTCHA expired or not found.");
    }

    const isCorrect =
      storedCaptcha.toLowerCase() === captchaInput.trim().toLowerCase();

    if (!isCorrect) {
      throw ApiError.badRequest("❌ CAPTCHA incorrect.");
    }

    // Якщо правильно — зберігаємо прапорець на 10 хв
    await redisClient.del(`captcha:${captchaId}`);
    await redisClient.set(`captcha:verified:${captchaId}`, "true", "EX", 600); // 10 хв

    return next();
  } catch (error) {
    console.error("Captcha middleware error:", error);
    next(error);
  }
};

module.exports = verifyCaptcha;
