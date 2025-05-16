const svgCaptcha = require("svg-captcha");
const { v4: uuidv4 } = require("uuid");
const redisClient = require("../utils/redisClient");
const ApiError = require("../errors/errors.API");

class CaptchaService {
  static async generateCaptcha() {
    const captcha = svgCaptcha.create({
      size: 6,
      noise: 4,
      color: true,
      background: "#ccf2ff",
    });

    const captchaId = uuidv4();
    const key = `captcha:${captchaId}`;
    const ttl = 300; // 5 хв

    await redisClient.set(key, captcha.text, "EX", ttl);

    return {
      id: captchaId,
      data: captcha.data,
    };
  }

  static async verifyCaptcha(captchaId, userInput) {
    if (!captchaId || !userInput) {
      throw ApiError.badRequest("Missing CAPTCHA ID or input");
    }

    const storedCaptcha = await redisClient.get(`captcha:${captchaId}`);
    if (!storedCaptcha) {
      throw ApiError.notFound("CAPTCHA expired or invalid");
    }

    const isCorrect =
      storedCaptcha.toLowerCase() === userInput.trim().toLowerCase();

    if (isCorrect) {
      await redisClient.del(`captcha:${captchaId}`);
      await redisClient.set(`captcha:verified:${captchaId}`, "true", "EX", 600); // ⬅️ ось тут
    }

    return isCorrect;
  }
}

module.exports = CaptchaService;
