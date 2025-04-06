// src/middlewares/checkCaptcha.middleware.js
const checkCaptcha = (req, res, next) => {
  //console.log("Middleware before checking CAPTCHA:", req);

  // Ініціалізація значення isCaptchaVerified, якщо воно відсутнє
  if (req.session.isCaptchaVerified === undefined) {
    req.session.isCaptchaVerified = false;
    console.log("isCaptchaVerified was not found, setting to false");
  }

  // Перевірка, чи пройшов користувач CAPTCHA
  if (!req.session.isCaptchaVerified) {
    console.log("CAPTCHA not passed");
    return res.status(403).send("Please complete the CAPTCHA first.");
  }

  console.log("CAPTCHA passed, proceeding...");
  next(); // CAPTCHA пройдена, передаємо управління наступному middleware/маршруту
};

module.exports = checkCaptcha; // Експортуємо мідлвар
