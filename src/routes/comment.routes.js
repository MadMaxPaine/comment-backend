// src/routes/comment.routes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");

router.post("/", commentController.create); // Створити коментар
router.get("/", commentController.getAll); // Отримати всі коментарі
router.get("/:id", commentController.getById); // Отримати коментар за ID
router.put("/:id", commentController.update); // Оновити коментар
router.delete("/:id", commentController.delete); // Видалити коментар

module.exports = router;
