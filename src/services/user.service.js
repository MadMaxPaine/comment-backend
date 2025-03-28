const bcrypt = require("bcrypt");
const uuid = require("uuid");
const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const {
  generateTokens,
  saveToken,
  removeToken,
  validateRefreshToken,
  findToken,
} = require("./token.service");
const User = require("../models/user.model");
const ApiError = require("../errors/errors.API");
const UserDto = require("../dtos/user.dto");

const cfg = require("../config/config");

module.exports.getOne = async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    console.log("Fetching user with ID:", id); // Логування ID запиту
    const user = await User.findOne({ where: { id } });
    if (!user) {
      next(ApiError.internal("User not found!"));
    }
    const userDto = new UserDto(user);
    return res.json({ ...userDto });
  } catch (e) {
    next(e);
  }
};

async function handleAvatar(avatar) {
  let avatarFileName = "";

  // Якщо є аватар, обробляємо його
  if (avatar && avatar !== "null") {
    let regex = /^data:.+\/(.+);base64,(.*)$/;
    let matches = avatar.match(regex);

    if (!matches) {
      // Якщо регулярний вираз не знайде відповідності, повертаємо помилку
      console.log("Invalid avatar format", avatar); // Логування для діагностики
      throw ApiError.badRequest("Invalid avatar format");
    }

    // Отримуємо розширення та дані
    const ext = matches[1];
    const data = matches[2];

    // Перетворення Base64 в буфер
    const buffer = Buffer.from(data, "base64");

    // Генерація унікального імені файлу
    avatarFileName = uuid.v4() + "." + ext;

    try {
      // Збереження аватара на сервері
      const uploadPath = path.resolve(
        __dirname,
        "..",
        "uploads",
        "image.data",
        avatarFileName
      );
      fs.writeFileSync(uploadPath, buffer);
      console.log("Avatar file saved with name:", avatarFileName); // Логування успішного збереження
    } catch (error) {
      // Обробка помилок під час збереження
      console.error("Error saving avatar:", error);
      throw ApiError.internal("Error saving avatar"); // Викликаємо метод без new
    }
  } else {
    console.log("No avatar provided or null, skipping avatar processing"); // Логування відсутності аватара
  }

  return avatarFileName; // Повертаємо ім'я файлу аватара (або порожній рядок, якщо аватара не було)
}

module.exports.registration = async function registration(req, res, next) {
  try {
    // Валідація запиту
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array()); // Логування помилок валідації
      return next(ApiError.badRequest("Validation error", errors.array()));
    }

    const { username, email, password, homepage, avatar } = req.body;
    console.log("Registration data:", req.body); // Логування отриманих даних

    // Перевірка на наявність необхідних полів
    if (!email || !password) {
      console.log("Missing email or password"); // Логування відсутніх полів
      return next(ApiError.badRequest("Wrong email or password"));
    }

    // Перевірка на існування користувача з таким email
    console.log(email);
    const candidate = await User.findOne({ where: { email } });
    console.log("User search result:", candidate); // Логування результату пошуку користувача
    if (candidate) {
      console.log("User already exists with email:", email); // Логування існуючого користувача
      return next(ApiError.badRequest("User with current e-mail exists!"));
    }

    // Обробка аватара
    const avatarFileName = await handleAvatar(avatar);
    // Хешування пароля
    const hashPassword = await bcrypt.hash(password, 5);
    console.log("Password hashed:", hashPassword); // Логування хешованого пароля

    // Створення користувача
    const user = await User.create({
      username,
      email,
      password: hashPassword,
      homepage: homepage ?? "",
      avatar: avatarFileName,
    });

    console.log("New user created:", user); // Логування створеного користувача

    // Створення DTO для користувача
    const userDto = new UserDto(user);

    // Генерація токенів
    const token = generateTokens({ ...userDto });
    console.log("Generated tokens:", token); // Логування токенів

    // Збереження refreshToken в базі
    await saveToken(userDto.id, token.refreshToken);

    // Встановлення refreshToken в cookie
    res.cookie("refreshToken", token.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
      httpOnly: true,
    });

    // Відправка відповіді
    return res.json({ ...token, userDto });
  } catch (e) {
    console.error("Error in registration:", e); // Логування помилки
    next(e);
  }
};

module.exports.login = async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email); // Логування спроби входу
    const user = await User.findOne({ where: { email } });
    if (!user) {
      next(ApiError.internal("User not found!"));
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      next(ApiError.internal("Wrong password"));
    }
    const userDto = new UserDto(user);
    const token = generateTokens({ ...userDto });
    await saveToken(userDto.id, token.refreshToken);
    res.cookie("refreshToken", token.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.json({ ...token, userDto });
  } catch (e) {
    console.error("Error in login:", e); // Логування помилки входу
    next(e);
  }
};

module.exports.logout = async function logout(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    console.log("Logging out with refresh token:", refreshToken); // Логування токена для виходу
    const token = await removeToken(refreshToken);
    res.clearCookie("refreshToken");
    return res.json({ token });
  } catch (e) {
    console.error("Error in logout:", e); // Логування помилки при виході
    next(e);
  }
};

module.exports.refresh = async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    console.log("Refresh token:", refreshToken); // Логування refreshToken для оновлення
    if (!refreshToken) {
      throw ApiError.unauthorizedError();
    }
    const userData = validateRefreshToken(refreshToken);
    const tokenFromDb = await findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      // Логування для дебагу
      console.error("Invalid or expired refresh token");
      console.log(tokenFromDb);

      // Викидаємо помилку авторизації
      throw ApiError.unauthorizedError();
    }
    const user = await User.findOne({ where: { id: userData.id } });
    const userDto = new UserDto(user);
    const token = generateTokens({ ...userDto });
    await saveToken(userDto.id, token.refreshToken);
    res.cookie("refreshToken", token.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return res.json({ ...token, userDto });
  } catch (e) {
    console.error("Error in refresh:", e); // Логування помилки при оновленні токена
    next(e);
  }
};
