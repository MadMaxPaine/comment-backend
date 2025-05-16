const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const checkCaptcha = require("../middlewares/captcha.middleware");
const {
  upload,
  checkFileSize,
  resizeImage,
} = require("../middlewares/upload.middleware"); // імпортуємо middleware для завантаження файлів
const { commentValidation } = require("../validations/comment.validation");
const validateRequest = require("../middlewares/validate.request");

router.post(
  "/",
  checkCaptcha,
  upload.single("file"),
  checkFileSize,
  resizeImage,
  commentValidation,
  validateRequest,
  commentController.create
); // Створити коментар
router.get("/", commentController.getAll); // Отримати всі коментарі
router.get("/:id", commentController.getById); // Отримати коментар за ID
router.get("/:id/replies", commentController.getReplies); // Під Коментарі за ID

module.exports = router;
