const jwt = require("jsonwebtoken");
const Token = require("../models/token.model");
const cfg = require("../config/config");

class TokenService {
  // Генерація access і refresh токенів
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, cfg.jwt.secret, {
      expiresIn: cfg.jwt.accessTokenExpiresIn,
    });
    const refreshToken = jwt.sign(payload, cfg.jwt.secret, {
      expiresIn: cfg.jwt.refreshTokenExpiresIn,
    });
    return { accessToken, refreshToken };
  }

  // Зберігання refresh токену в базі даних
  async saveToken(userId, refreshToken) {
    const tokenData = await Token.findOne({ where: { userId } });
    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }
    const token = await Token.create({ userId, refreshToken });
    return token;
  }

  // Видалення refresh токену з бази даних
  async removeToken(refreshToken) {
    const tokenData = await Token.destroy({ where: { refreshToken } });
    return tokenData;
  }

  // Валідація access токену
  validateAccessToken(accessToken) {
    try {
      const userData = jwt.verify(accessToken, cfg.jwt.secret);
      return userData;
    } catch (e) {
      return null;
    }
  }

  // Валідація refresh токену
  validateRefreshToken(refreshToken) {
    try {
      const userData = jwt.verify(refreshToken, cfg.jwt.secret);
      return userData;
    } catch (e) {
      return null;
    }
  }

  // Пошук токену в базі даних
  async findToken(refreshToken) {
    console.log("Received refreshToken:", refreshToken); // Логування для перевірки
    try {
      // Перевірка на наявність порожнього або некоректного токена
      if (!refreshToken || refreshToken.trim() === "") {
        throw new Error("Invalid or empty refresh token");
      }

      // Очищаємо токен від пробілів
      const cleanRefreshToken = refreshToken.trim();

      // Шукаємо токен у базі даних
      const tokenData = await Token.findOne({
        where: { refreshToken: cleanRefreshToken },
      });

      // Якщо токен не знайдено, викидаємо помилку
      if (!tokenData) {
        throw new Error("Token not found");
      }

      return tokenData;
    } catch (error) {
      console.error("Error finding token:", error);
      throw error;
    }
  }
}

module.exports = new TokenService();
