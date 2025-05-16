const multer = require("multer");
const path = require("path");
const uuid = require("uuid");
const ApiError = require("../errors/errors.API");
// Налаштування зберігання файлів
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "..", "uploads", "avatars"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuid.v4() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  // Приймаємо лише зображення
  try {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  } catch (e) {
    next(ApiError.badRequest("Unexpected error. avatar.middleware.file.filter",e));
  }
};

module.exports = multer({ storage, fileFilter });
