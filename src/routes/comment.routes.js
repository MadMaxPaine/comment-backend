// src/routes/comment.routes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const checkCaptcha = require("../middlewares/checkCaptcha.middleware");
const { upload, checkFileSize, resizeImage } = require("../middlewares/upload.middleware"); // імпортуємо middleware для завантаження файлів

router.post("/", checkCaptcha,upload.single("file"), checkFileSize, resizeImage,commentController.create); // Створити коментар
router.get("/", commentController.getAll); // Отримати всі коментарі
router.get("/:id", commentController.getById); // Отримати коментар за ID
router.get("/:id/replies", commentController.getReplies);// Під Коментарі за ID

module.exports = router;
