// src/services/comment.service.js
const Comment = require("../models/comment.model"); // Імпортуємо модель коментаря
const AnonymousController = require("../controllers/anonymous.controller");
const User = require("../models/user.model");
const Anonymous = require("../models/anonymous.model");

class CommentService {
  // Створити новий коментар
  async createComment(data, user) {
    try {
      const { email, text, fileUrl, parentId } = data.body;

      // Перевірка, чи є авторизований користувач (токен присутній)
      if (user) {
        // Створення коментаря для авторизованого користувача
        const comment = await Comment.create({
          text: text,
          fileUrl: fileUrl || null,
          parentId: parentId || null,
          userId: user.id,
          anonymousId: null,
        });

        return comment; // Повертаємо створений коментар
      }

      // Якщо користувач не авторизований (немає токена), працюємо як з анонімним користувачем
      let anon = await AnonymousController.getOneEmail(email);
      if (!anon) {
        anon = await AnonymousController.create(data);
      }

      // Створюємо коментар від анонімного користувача
      const comment = await Comment.create({
        text: text,
        fileUrl: fileUrl || null,
        parentId: parentId || null,
        userId: null,
        anonymousId: anon.id,
      });

      return comment; // Повертаємо створений коментар
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new Error("Failed to create comment: " + error.message);
    }
  }

  // Отримати всі коментарі разом з даними користувачів
  async getAllComments() {
    try {
      const comments = await Comment.findAll({
        where: {
          [Sequelize.Op.or]: [
            { userId: { [Sequelize.Op.ne]: null } },
            { anonymousId: { [Sequelize.Op.ne]: null } },
          ],
        },
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "email"],
          },
          {
            model: Anonymous,
            as: "anonymousAuthor",
            attributes: ["id", "username", "email"],
          },
        ],
      });
      return comments;
    } catch (error) {
      throw new Error("Failed to fetch comments");
    }
  }

  // Отримати коментар за ID
  async getCommentById(commentId) {
    try {
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }
      return comment;
    } catch (error) {
      throw new Error("Failed to fetch comment");
    }
  }
}

module.exports = new CommentService();
