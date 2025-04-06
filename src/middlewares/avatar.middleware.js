const multer = require("multer");
const path = require("path");
const uuid = require("uuid");

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
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

module.exports = multer({ storage, fileFilter });
