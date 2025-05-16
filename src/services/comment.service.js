const Comment = require("../models/comment.model");
const User = require("../models/user.model");
const Anonymous = require("../models/anonymous.model");
const ApiError = require("../errors/errors.API");
const { cleanComments, cleanComment } = require("../utils/cleanComment");
class CommentService {
  // Отримати коментар за IDз авторами
  async getCommentWithUserInfo(commentId) {
    try {
      const comment = await Comment.findOne({
        where: { id: commentId },
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "email", "avatar"],
          },
          {
            model: Anonymous,
            as: "anonymousAuthor",
            attributes: ["id", "username", "email"],
          },
        ],
      });
      if (!comment) {
        throw ApiError.notFound("Comment not found");
      }
      const cleanedComment = cleanComment(comment);
      return cleanedComment;
    } catch (error) {
      console.error("Failed to fetch comment:", error);
      throw ApiError.internal("Failed to fetch comment");
    }
  }
  // Створити новий коментар
  async createComment(data) {
    try {
      const { text, fileUrl, parentId, userId, anonymousId } = data;
      const comment = await Comment.create({
        text,
        fileUrl,
        parentId,
        userId,
        anonymousId,
      });
      return comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw ApiError.internal("Failed to create comment: " + error.message);
    }
  }

  // Отримати всі коментарі
  async getAllComments(page, pageSize = 25, sortBy, sortOrder) {
    try {
      const validSortFields = ["createdAt", "username", "email"];
      if (!sortBy || !validSortFields.includes(sortBy)) {
        throw ApiError.badRequest(`Invalid sort field: ${sortBy}`);
      }

      const validSortOrders = ["asc", "desc"];
      if (!sortOrder || !validSortOrders.includes(sortOrder)) {
        throw ApiError.badRequest(`Invalid sort order: ${sortOrder}`);
      }

      page = parseInt(page, 10) || 1;
      pageSize = parseInt(pageSize, 10) || 25;
      const offset = (page - 1) * pageSize;

      let order = [];
      if (sortBy === "createdAt") {
        order = [["createdAt", sortOrder]];
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

      const { rows: comments, count } = await Comment.findAndCountAll({
        where: { parentId: null },
        limit: pageSize,
        offset: offset,
        order: order,
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "email", "avatar"],
          },
          {
            model: Anonymous,
            as: "anonymousAuthor",
            attributes: ["id", "username", "email"],
          },
        ],
      });
      const cleanedComments = cleanComments(comments);
      return {
        comments: cleanedComments,
        total: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: page,
      };
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      throw ApiError.internal("Failed to fetch comments");
    }
  }

  // Отримати всі підкоментарі
  async getAllReply(id, page, pageSize = 25) {
    try {
      if (!id) {
        throw ApiError.badRequest("ID is required");
      }
      page = parseInt(page, 10) || 1;
      pageSize = parseInt(pageSize, 10) || 5;
      const offset = (page - 1) * pageSize;

      const { rows: comments, count } = await Comment.findAndCountAll({
        where: { parentId: id },
        limit: pageSize,
        offset: offset,
        order: [["createdAt", "desc"]],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username", "email", "avatar"],
          },

          {
            model: Anonymous,
            as: "anonymousAuthor",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      const totalPages = Math.ceil(count / pageSize);
      const hasMoreReplies = page < totalPages;
      const cleanedComments = cleanComments(comments);
      return {
        comments: cleanedComments,
        totalReplies: count,
        totalPages,
        currentPage: page,
        hasMoreReplies,
      };
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      throw ApiError.internal("Failed to fetch comments");
    }
  }

  // Отримати коментар за ID
  async getCommentById(commentId) {
    try {
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        throw ApiError.notFound("Comment not found");
      }
      return comment;
    } catch (error) {
      console.error("Failed to fetch comment:", error);
      throw ApiError.internal("Failed to fetch comment");
    }
  }

  // Отримати всі коментарі тільки ID
  async getAllCommentIds(page, pageSize = 25, sortBy, sortOrder) {
    try {
      const validSortFields = ["createdAt", "username", "email"];
      if (!sortBy || !validSortFields.includes(sortBy)) {
        throw ApiError.badRequest(`Invalid sort field: ${sortBy}`);
      }

      const validSortOrders = ["asc", "desc"];
      if (!sortOrder || !validSortOrders.includes(sortOrder)) {
        throw ApiError.badRequest(`Invalid sort order: ${sortOrder}`);
      }

      page = parseInt(page, 10) || 1;
      pageSize = parseInt(pageSize, 10) || 25;
      const offset = (page - 1) * pageSize;

      const { literal } = require("sequelize");

      let order;
      if (sortBy === "createdAt") {
        order = [["createdAt", sortOrder]];
      } else if (sortBy === "username") {
        order = [
          [
            literal(
              `COALESCE("author"."username", "anonymousAuthor"."username")`
            ),
            sortOrder,
          ],
        ];
      } else if (sortBy === "email") {
        order = [
          [
            literal(`COALESCE("author"."email", "anonymousAuthor"."email")`),
            sortOrder,
          ],
        ];
      }

      const { rows: comments, count } = await Comment.findAndCountAll({
        attributes: ["id"],
        where: { parentId: null },
        limit: pageSize,
        offset,
        order,
        include: [
          {
            model: User,
            as: "author",
            attributes: [],
            required: false,
          },
          {
            model: Anonymous,
            as: "anonymousAuthor",
            attributes: [],
            required: false,
          },
        ],
      });

      return {
        comments: comments.map((c) => c.id),
        total: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: page,
      };
    } catch (error) {
      console.error("Failed to fetch comment IDs:", error);
      throw ApiError.internal("Failed to fetch comment IDs");
    }
  }
  // Метод сервісу тільки для вибірки ID підкоментарів
  async getAllReplyIds(id, page, pageSize = 25) {
    try {
      if (!id) {
        throw ApiError.badRequest("ID is required");
      }

      page = parseInt(page, 10) || 1;
      pageSize = parseInt(pageSize, 10) || 5;
      const offset = (page - 1) * pageSize;

      // Отримуємо тільки ID коментарів
      const { rows: comments, count } = await Comment.findAndCountAll({
        where: { parentId: id },
        limit: pageSize,
        offset: offset,
        order: [["createdAt", "desc"]],
        attributes: ["id"], // Тільки ID
      });

      return { comments, count };
    } catch (error) {
      console.error("Failed to fetch replies:", error);
      throw ApiError.internal("Failed to fetch replies");
    }
  }
}

module.exports = new CommentService();
