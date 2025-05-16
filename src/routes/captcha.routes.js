const router = require("express").Router();
const CaptchaController = require("../controllers/captcha.controller");
const captchaRateLimiter = require('../middlewares/captchaRateLimiter.middleware');

router.get("/",captchaRateLimiter, CaptchaController.getCaptcha);
router.post("/submit", CaptchaController.submitCaptcha);

module.exports = router;
