const TokenService = require("./token.service"); // Імпортуємо TokenService класс
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const ApiError = require("../errors/errors.API");
const UserDto = require("../dtos/user.dto");
const Comment = require("../models/comment.model");
const geoip = require("geoip-lite");

class UserService {
  // Отримання користувача по ID
  async getOne(id) {
    try {
      const user = await User.findOne({ where: { id } });
      if (!user) {
        throw ApiError.internal("User not found!");
      }
      return new UserDto(user);
    } catch (e) {
      throw e;
    }
  }
  async getOneEmail(email) {
    try {
      const user = await User.findOne({ where: { email: email } });
      if (!user) {
        return null;
      }
      return new UserDto(user);
    } catch (e) {
      throw e;
    }
  }

  // Реєстрація користувача
  async registration(data) {
    try {
      const {
        username,
        email,
        password,
        homepage,
        file,
        oldUserPrints = [],
        oldUserNames = [],
        oldHomePages = [],
      } = data;
      const candidate = await User.findOne({ where: { email } });
      if (candidate) {
        throw ApiError.badRequest("User with current e-mail exists!");
      }

      const avatarFileName = file ? file.filename : "";
      const hashPassword = await bcrypt.hash(password, 5);

      const user = await User.create({
        username,
        email,
        password: hashPassword,
        homepage: homepage ?? "",
        avatar: avatarFileName,
        oldUserPrints,
        oldUserNames,
        oldHomePages,
      });

      const userDto = new UserDto(user);
      const token = TokenService.generateTokens({ ...userDto });
      await TokenService.saveToken(userDto.id, token.refreshToken);

      return { token, userDto };
    } catch (e) {
      throw e;
    }
  }

  // Логін користувача
  async login(email, password) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw ApiError.internal("User not found!");
      }

      const comparePassword = bcrypt.compareSync(password, user.password);
      if (!comparePassword) {
        throw ApiError.internal("Wrong password");
      }

      const userDto = new UserDto(user);
      const token = TokenService.generateTokens({ ...userDto });
      await TokenService.saveToken(userDto.id, token.refreshToken);

      return { token, userDto };
    } catch (e) {
      throw e;
    }
  }

  // Вихід з системи
  async logout(refreshToken) {
    try {
      const token = await TokenService.removeToken(refreshToken);
      return token;
    } catch (e) {
      throw e;
    }
  }

  // Оновлення токену
  async refresh(refreshToken) {
    try {
      const userData = TokenService.validateRefreshToken(refreshToken);
      const tokenFromDb = await TokenService.findToken(refreshToken);

      if (!userData || !tokenFromDb) {
        throw ApiError.unauthorizedError();
      }

      const user = await User.findOne({ where: { id: userData.id } });
      const userDto = new UserDto(user);
      const token = TokenService.generateTokens({ ...userDto });

      await TokenService.saveToken(userDto.id, token.refreshToken);
      return { token, userDto };
    } catch (e) {
      throw e;
    }
  }
  async updateUserPrints(userId, ipAddress, userAgent, fingerprint) {
    try {
      // Якщо якихось обов'язкових даних не вистачає — просто пропускаємо
      if (!userId || !ipAddress || !userAgent) return;

      const user = await User.findByPk(userId);
      if (!user) {
        throw ApiError.notFound("User not found");
      }

      const country = geoip.lookup(ipAddress)?.country ?? null;
      const newPrint = {
        ipAddress,
        userAgent,
        fingerprint: fingerprint ?? null,
        country,
      };

      const existingPrints = Array.isArray(user.oldUserPrints)
        ? user.oldUserPrints
        : [];

      const isDuplicate = existingPrints.some(
        (p) =>
          p.ipAddress === newPrint.ipAddress &&
          p.userAgent === newPrint.userAgent &&
          p.fingerprint === newPrint.fingerprint &&
          p.country === newPrint.country
      );

      if (!isDuplicate) {
        existingPrints.push(newPrint);
        await User.update(
          { oldUserPrints: existingPrints },
          { where: { id: userId } }
        );
      }
    } catch (e) {
      console.error("Error in updateUserPrints:", e);
    }
  }
  async updateCommentsFromAnonymousToUser(anonymousId, userId) {
    try {
      const [updatedCount] = await Comment.update(
        {
          userId,
          anonymousId: null,
        },
        {
          where: { anonymousId },
        }
      );

      if (updatedCount === 0) {
        console.warn(`No comments found for anonymousId: ${anonymousId}`);
      } else {
        console.log(
          `Updated ${updatedCount} comment(s) from anonymousId to userId`
        );
      }

      return updatedCount;
    } catch (error) {
      console.error(
        `Failed to update comments from anonymousId (${anonymousId}) to userId (${userId}):`,
        error
      );
      throw new Error(
        "Failed to reassign comments from anonymous to registered user."
      );
    }
  }
}

module.exports = new UserService();
