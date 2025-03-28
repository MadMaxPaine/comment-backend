const { validationResult } = require("express-validator");
const ApiError = require("../errors/errors.API");
const AnonymousDTO = require("../dtos/anonymous.dto");
const Anonymous = require("../models/anonymous.model");
const geoip = require("geoip-lite");

module.exports = {
  // Отримання анонімного користувача за ID
  getOne: async function getOne(id) {
    try {
      const anonymous = await Anonymous.findOne({ where: { id } });
      if (!anonymous) {
        throw new ApiError.notFound("Anonymous user not found!");
      }
      return new AnonymousDTO(anonymous);
    } catch (e) {
      console.error("Error in getOne:", e);
      throw e;
    }
  },

  // Отримання анонімного користувача за email
  getOneEmail: async function getOneEmail(email) {
    try {
      const anonymous = await Anonymous.findOne({ where: { email } });
      if (!anonymous) {
        return null; // Явно повертаємо null, якщо користувач не знайдений
      }
      return new AnonymousDTO(anonymous);
    } catch (e) {
      console.error("Error in getOneEmail:", e);
      throw e;
    }
  },

  // Створення анонімного користувача
  create: async function create(req) {
    try {
      // Валідація введених даних
      const errors = validationResult(req);
     
      
      if (!errors.isEmpty()) {
        throw new ApiError.badRequest("Validation failed", errors.array());
      }

      const { username, email, homepage } = req.body;

      // Отримуємо дані про пристрій користувача
      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const geo = geoip.lookup(ipAddress); // Визначаємо країну
      const country = geo ? geo.country : null;
      const fingerprint = req.headers["x-fingerprint"] || null; // Якщо клієнт відправляє

      // Створюємо анонімного користувача
      const anonymous = await Anonymous.create({
        username,
        email,
        homepage: homepage ?? "", // Якщо homepage не надано, встановлюємо порожній рядок
        ipAddress,
        userAgent,
        fingerprint,
        country,
      });

      if (!anonymous) {
        throw new ApiError.internal("Anonymous user creation failed!");
      }

      return new AnonymousDTO(anonymous); // Повертаємо DTO анонімного користувача
    } catch (e) {
      console.error("Error in AnonymousController.create:", e);
      throw e;
    }
  },
};
