const commentService = require("../services/comment.service");
const jwt = require("jsonwebtoken");
const ApiError = require("../errors/errors.API"); // Якщо використовуєте клас для помилок
const cfg = require("../config/config");

class CommentController {
  // Створити коментар
  async create(req, res, next) {
    //console.log(req.body);
    //console.log(req.headers.authorization);
    try {
      // Перевірка наявності токену в заголовках запиту
      const token = req.headers.authorization?.split(" ")[1];
      let user = null;
      if (token) {
        try {
          // Якщо токен є, декодуємо його для отримання даних користувача
          const decoded = jwt.verify(token, cfg.jwt.secret);
          user = decoded; // Це ваш об'єкт користувача з токену
        } catch (error) {
          return next(ApiError.unauthorized("Invalid token"));
        }
      }

      // Викликаємо сервіс для створення коментаря, передаючи дані про користувача (якщо є)
      const comment = await commentService.createComment(req, user);

      return res.status(201).json(comment);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  // Отримати всі коментарі
  async getAll(req, res, next) {
    try {
      const comments = await commentService.getAllComments(
        req.query.page.page,
        req.query.pageSize.pageSize,
        req.query.page.sortBy,
        req.query.page.sortOrder
      );
           // Перевірте, що коментарі дійсно отримано
      return res.status(200).json(comments);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  // Отримати коментар за ID
  async getById(req, res, next) {
    const { id } = req.params;

    try {
      const comment = await commentService.getCommentById(id);
      return res.status(200).json(comment);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  // Оновити коментар
  async update(req, res, next) {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return next(ApiError.badRequest("Content is required"));
    }

    try {
      const updatedComment = await commentService.updateComment(id, content);
      return res.status(200).json(updatedComment);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  // Видалити коментар
  async delete(req, res, next) {
    const { id } = req.params;

    try {
      const response = await commentService.deleteComment(id);
      return res.status(200).json(response);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }
}

module.exports = new CommentController();
