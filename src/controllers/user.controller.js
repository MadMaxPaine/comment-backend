const { validationResult } = require("express-validator");
const UserService = require("../services/user.service");
const ApiError = require("../errors/errors.API");
const {
  getOneEmail,
  deleteAnonymous,
} = require("../services/anonymous.service");
class UserController {
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const userDto = await UserService.getOne(id);
      return res.json({ ...userDto });
    } catch (e) {
      return next(e);
    }
  }

  async registration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest("Validation error", errors.array()));
      }

      const { username, email, password, homepage } = req.body;
      const { file } = req;
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const fingerprint = req.headers["x-fingerprint"] || null;

      const oldPrint = {
        ipAddress: ip,
        userAgent,
        fingerprint: fingerprint ?? null,
        country: null, // Тут, можливо, захочеш визначити країну на основі IP
      };

      // Пошук аноніма
      const anon = await getOneEmail(email);
      let token, userDto;
      console.log(anon);
      if (anon) {
        // Якщо анонім існує, переносимо його дані на зареєстрованого користувача
        if (
          !anon.oldAnonymousPrints.some(
            (print) =>
              print.country === oldPrint.country &&
              print.ipAddress === oldPrint.ipAddress &&
              print.userAgent === oldPrint.userAgent &&
              print.fingerprint === oldPrint.fingerprint
          )
        ) {
          anon.oldAnonymousPrints.push(oldPrint); // Додаємо старий запис, якщо його ще немає
        }
        // oldUserNames
        if (anon.username && !anon.oldUserNames.includes(anon.username)) {
          anon.oldUserNames.push(anon.username);
        }

        // oldHomePages
        if (anon.homepage && !anon.oldHomePages.includes(anon.homepage)) {
          anon.oldHomePages.push(anon.homepage);
        }
        const registrationData = {
          username,
          email,
          password,
          homepage,
          file,
          oldUserPrints: anon.oldAnonymousPrints,
          oldUserNames: anon.oldUserNames,
          oldHomePages: anon.oldHomePages,
        };

        // Реєстрація користувача
        const result = await UserService.registration(registrationData);
        token = result.token;
        userDto = result.userDto;
        await UserService.updateCommentsFromAnonymousToUser(anon.id, userDto.id);

        // Видаляємо аноніма з бази після перенесення даних
        await deleteAnonymous(anon.id); // Тут викликаєш метод для видалення анонімного користувача з БД
      } else {
        // Якщо аноніма немає, створюємо новий акаунт
        const registrationData = {
          username,
          email,
          password,
          homepage,
          file,
          oldUserPrints: [oldPrint], // Якщо немає аноніма, створюємо новий запис
          oldUserNames: [],
          oldHomePages: [],
        };

        // Реєстрація користувача
        const result = await UserService.registration(registrationData);
        token = result.token;
        userDto = result.userDto;
      }

      // Встановлюємо refreshToken в cookies
      res.cookie("refreshToken", token.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
        httpOnly: true,
      });

      // Відповідаємо з токеном та DTO користувача
      return res.json({ ...token, userDto });
    } catch (e) {
      return next(e);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { token, userDto } = await UserService.login(email, password);
      await UserService.updateUserPrints(
        userDto.id,
        req.ip,
        req.headers["user-agent"],
        req.body.fingerprint
      );
      res.cookie("refreshToken", token.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res.json({ ...token, userDto });
    } catch (e) {
      return next(e);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const token = await UserService.logout(refreshToken);

      res.clearCookie("refreshToken");
      return res.json({ token });
    } catch (e) {
      return next(e);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return next(ApiError.unauthorizedError());
      }

      const { token, userDto } = await UserService.refresh(refreshToken);

      res.cookie("refreshToken", token.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res.json({ ...token, userDto });
    } catch (e) {
      return next(e);
    }
  }
}

module.exports = new UserController();
