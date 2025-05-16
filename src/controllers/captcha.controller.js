const CaptchaService = require("../services/captcha.service");
const ApiError = require("../errors/errors.API");
class CaptchaController {
  static async getCaptcha(req, res,next) {
    try {
      const { id, data } = await CaptchaService.generateCaptcha();
      res.set("Content-Type", "image/svg+xml");
      res.set("x-captcha-id", id);
      res.set("Access-Control-Expose-Headers", "x-captcha-id"); // ⬅️ Ось це головне!
      res.status(200).send(data);
    } catch (error) {
      console.error("Captcha generation error:", error);
      return next(ApiError.internal("❌ Failed to generate CAPTCHA."));
    }
  }

  static async submitCaptcha(req, res,next) {
    const { captchaId, captchaInput } = req.body;
    try {
      const isValid = await CaptchaService.verifyCaptcha(
        captchaId,
        captchaInput
      );

      if (isValid) {
        return res.status(200).send("✅ Captcha correct!");
      } else {
        return res.status(401).send("❌ Incorrect captcha.");
      }
    } catch (error) {
      console.error("Captcha verification error:", error);
      return next(ApiError.badRequest(`❌ ${error.message}`));
    }
  }
}

module.exports = CaptchaController;
