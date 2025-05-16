const ApiError = require("../errors/errors.API");
const AnonymousDTO = require("../dtos/anonymous.dto");
const Anonymous = require("../models/anonymous.model");
const crypto = require("crypto");

function generateHash(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
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
  // Видалення користувача за ID
  deleteAnonymous: async function deleteAnonymous(id) {
  try {
    const result = await Anonymous.destroy({ where: { id:id } });
    if (result === 0) {
      throw new ApiError.notFound("Anonymous user not found!");
    }

    return { message: "Anonymous user deleted successfully!" };
  } catch (e) {
    console.error("Error in deleteAnonymous:", e);
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
  create: async function create(data) {
    try {
      const {
        username,
        email,
        homepage,
        ipAddress,
        userAgent,
        fingerprint,
        country,
      } = data;

      if (!username || !email) {
        throw ApiError.badRequest("Username and email are required");
      }

      const oldAnonymousPrint = {
        ipAddress,
        userAgent,
        fingerprint: fingerprint ?? null,
        country,
      };

      // Якщо не знайдено — створюємо нового
      const anonymous = await Anonymous.create({
        username,
        email,
        homepage: homepage ?? "",
        oldAnonymousPrints: [oldAnonymousPrint],
        oldUserNames: [],
        oldHomePages: [],
      });

      if (!anonymous) {
        throw ApiError.internal("Anonymous user creation failed!");
      }

      return new AnonymousDTO(anonymous);
    } catch (e) {
      console.error("Error in AnonymousService.create:", e);
      throw ApiError.internal("Error while creating anonymous user");
    }
  },
  // Створення анонімного користувача
  updateAnon: async function updateAnon(existing, data) {
    try {
      const {
        username,
        email,
        homepage,
        ipAddress,
        userAgent,
        fingerprint,
        country,
      } = data;

      if (!username || !email) {
        throw ApiError.badRequest("Username and email are required for update");
      }

      const updates = {};

      // Prints
      const newPrint = { ipAddress, userAgent, fingerprint, country };
      const oldPrints = existing.oldAnonymousPrints || [];
      const isDuplicate = oldPrints.some(
        (p) => generateHash(p) === generateHash(newPrint)
      );
      if (!isDuplicate) {
        oldPrints.push(newPrint);
        updates.oldAnonymousPrints = oldPrints;
      }

      // Username
      if (username && username !== existing.username) {
        const oldNames = existing.oldUserNames || [];
        if (!oldNames.includes(existing.username)) {
          oldNames.push(existing.username);
          updates.oldUserNames = oldNames;
        }
        updates.username = username;
      }

      // Homepage
      if (homepage && homepage !== existing.homepage) {
        const oldPages = existing.oldHomePages || [];
        if (existing.homepage && !oldPages.includes(existing.homepage)) {
          oldPages.push(existing.homepage);
          updates.oldHomePages = oldPages;
        }
        updates.homepage = homepage;
      }

      await Anonymous.update(updates, {
        where: { id: existing.id },
      });

      return new AnonymousDTO(existing);
    } catch (e) {
      console.error("Error in AnonymousService.create:", e);
      throw ApiError.internal("Error while updating anonymous user");
    }
  },
};
