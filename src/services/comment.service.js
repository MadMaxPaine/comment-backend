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

  async getAllComments(
    page,
    pageSize = 5,
    sortBy,
    sortOrder
  ) {
    
    try {
      // Перевірка на допустимі поля для сортування
      const validSortFields = ["createdAt", "username", "email"];
      if (!sortBy || !validSortFields.includes(sortBy)) {
        throw new Error(`Invalid sort field: ${sortBy}`);
      }
  
      // Перевірка на допустимі порядки сортування
      const validSortOrders = ["asc", "desc"];
      if (!sortOrder || !validSortOrders.includes(sortOrder)) {
        throw new Error(`Invalid sort order: ${sortOrder}`);
      }
  
      // Перевірка page і pageSize на коректність
      page = parseInt(page, 10) || 1;
      pageSize = parseInt(pageSize, 10) || 25;
      const offset = (page - 1) * pageSize;
      console.log(offset,pageSize);
      
      // Сортування за полями, враховуючи зв'язки
      let order = [];
      if (sortBy === "createdAt") {
        order = [["createdAt", sortOrder]]; // Сортуємо по полю createdAt
      } else if (sortBy === "username") {
        order = [
          [{ model: User, as: "author" }, "username", sortOrder],
          [{ model: Anonymous, as: "anonymousAuthor" }, "username", sortOrder],
        ];
      } else if (sortBy === "email") {
        order = [
          [{ model: User, as: "author" }, "email", sortOrder],
          [{ model: Anonymous, as: "anonymousAuthor" }, "email", sortOrder],
        ];
      }
  
      // Потрібно перевірити, чи правильно вказано атрибути у `include` та правильні асоціації
      const { rows: comments, count } = await Comment.findAndCountAll({
        limit: pageSize,
        offset: offset,
        order: order,
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "email"], // Перевірка на правильні поля
          },
          {
            model: Anonymous,
            as: "anonymousAuthor",
            attributes: ["id", "username", "email"], // Перевірка на правильні поля
          },
        ],
        logging: console.log, // Додати для виведення SQL запитів
      });
      
      
      return {
        comments,
        total: count, // Загальна кількість коментарів
        totalPages: Math.ceil(count / pageSize), // Кількість сторінок
        currentPage: page,
      };
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      throw new Error("Failed to fetch comments");
    }
  }
  

  /*// Отримати всі коментарі разом з даними користувачів
  async getAllComments() {
    try {
      const comments = await Comment.findAll({
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
      console.log(comments);
      
      return comments;
    } catch (error) {
      throw new Error("Failed to fetch comments");
    }
  }*/

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
