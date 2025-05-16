const commentService = require("../services/comment.service");
const jwt = require("jsonwebtoken");
const ApiError = require("../errors/errors.API");
const cfg = require("../config/config");
const UserService = require("../services/user.service");

const {
  create,
  getOneEmail,
  updateAnon,
} = require("../services/anonymous.service");
const { commentQueue } = require("../queues/index.queue");
const redis = require("../utils/redisClient"); // імпортуємо клієнт Redis
class CommentController {
  // Створити коментар
  async create(req, res, next) {
    console.log(req.body);

    try {
      // Перевірка наявності токену в заголовках запиту
      const token = req.headers.authorization?.split(" ")[1];
      let user = null;
      let anon = null;
      if (token) {
        try {
          // Якщо токен є, декодуємо його для отримання даних користувача
          const decoded = jwt.verify(token, cfg.jwt.secret);
          user = decoded;
        } catch (error) {
          return next(ApiError.unauthorized("Invalid token"));
        }
      }
      const { email, text, parentId } = req.body;
      const fileURL = req.file?.path
        ? "uploads" + req.file.path.split("uploads")[1]
        : null;

      if (!user) {
        if (!email) {
          return next(
            ApiError.badRequest("Email is required for anonymous user")
          );
        }
        // Перевіряємо, чи є такий емейл серед зареєстрованих користувачів
        const existingUser = await UserService.getOneEmail(email);
        if (existingUser) {
          return next(
            ApiError.badRequest(
              "This email is already associated with a registered user. Please log in."
            )
          );
        }
        // Пошук існуючого анонімного користувача
        anon = await getOneEmail(email);

        const { username, homepage } = req.body;

        // Отримання IP адреси
        const ipAddress =
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          req.ip;

        // Витягуємо user-agent
        const userAgent = req.headers["user-agent"] ?? null;

        // Визначаємо країну користувача
        let country = null;
        try {
          const geo = geoip.lookup(ipAddress);
          country = geo?.country ?? null;
        } catch (e) {
          console.warn("Geo lookup failed:", e.message);
        }

        // Отримуємо device fingerprint, якщо надано
        const fingerprint = req.headers["x-fingerprint"] ?? null;

        const anonData = {
          username: username ?? "Anonymous",
          email: email,
          homepage: homepage ?? null,
          ipAddress,
          userAgent,
          fingerprint,
          country,
        };

        if (!anon) {
          anon = await create(anonData);
        } else {
          anon = await updateAnon(anon, anonData);
        }
      }

      // Створюємо коментар від авторизованого чи анонімного користувача
      const comment = await commentService.createComment({
        text,
        fileUrl: fileURL ?? null,
        parentId: parentId || null,
        userId: user ? user.id : null,
        anonymousId: anon ? anon.id : null, // Якщо є користувач, додаємо userId, якщо ні - додаємо anonymousId
      });

      // Очищаємо CAPTCHA після створення коментаря
      req.session.captcha = null;
      req.session.isCaptchaVerified = false;

      // Після створення коментаря додаємо задачу в чергу для відправки сповіщення
      const fullComment = await commentService.getCommentWithUserInfo(
        comment.id
      );
      await commentQueue.add("sendNotification", { comment: fullComment });

      return res.status(201).json(comment);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  async getAll(req, res, next) {
    try {
      console.log(req.query);

      // Отримуємо параметри з запиту
      const page = req.query["page[page]"] || 1;
      const pageSize = req.query.pageSize || 25;
      const sortBy = req.query["page[sortBy]"] || "createdAt";
      const sortOrder = req.query["page[sortOrder]"] || "asc";

      // Перевірка на наявність параметрів
      if (!req.query["page[page]"]) {
        throw ApiError.badRequest("Missing page parameter");
      }
      if (!req.query.pageSize) {
        throw ApiError.badRequest("Missing pageSize parameter");
      }

      const cacheKey = `comments:root:page:${page}:size:${pageSize}:sortBy:${sortBy}:sortOrder:${sortOrder}`;
      const cachedData = await redis.get(cacheKey);
      const cached = cachedData ? JSON.parse(cachedData) : null;

      // Якщо щось є в кеші, перевіряємо чи ID коментарів збігаються
      if (cached && cached.commentIds) {
        const fresh = await commentService.getAllCommentIds(
          page,
          pageSize,
          sortBy,
          sortOrder
        );

        const idsEqual =
          Array.isArray(fresh.comments) &&
          Array.isArray(cached.commentIds) &&
          fresh.comments.length === cached.commentIds.length &&
          fresh.comments.every((id, i) => id === cached.commentIds[i]);

        if (idsEqual && cached.fullComments) {
          console.log("Cache returned");

          return res.status(200).json({
            comments: cached.fullComments,
            total: fresh.total,
            totalPages: fresh.totalPages,
            currentPage: fresh.currentPage,
          });
        }
      }

      const comments = await commentService.getAllComments(
        page,
        pageSize,
        sortBy,
        sortOrder
      );

      // Кешуємо новий результат (включно з ID)
      await redis.setex(
        cacheKey,
        3600,
        JSON.stringify({
          commentIds: comments.comments.map((c) => c.id),
          fullComments: comments.comments,
        })
      );

      // Повертаємо коментарі
      return res.status(200).json(comments);
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  // Отримати всі коментарі
  async getReplies(req, res, next) {
    const { id } = req.params; // отримаємо id з параметрів URL
    let { page = 1, pageSize = 25 } = req.query;

    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);
    if (!id) {
      return next(ApiError.badRequest("ID required"));
    }
    try {
      // Формуємо ключ кешу
      const cacheKey = `comments:replies:${id}:page:${page}:size:${pageSize}`;
      console.log(`Cache Key: ${cacheKey}`);
      console.log("Attempting to get data from cache with key:", cacheKey);
      const cachedData = await redis.get(cacheKey);
      const cached = cachedData ? JSON.parse(cachedData) : null;

      console.log("Cached Data:", cached);

      // Якщо є кеш, перевіряємо чи ID коментарів збігаються
      if (cached && cached.replyIds) {
        const fresh = await commentService.getAllReplyIds(id, page, pageSize);

        const idsEqual =
          Array.isArray(fresh.comments) &&
          Array.isArray(cached.replyIds) &&
          fresh.comments.map((comment) => comment.id).length ===
            cached.replyIds.length &&
          fresh.comments.every(
            (comment, i) => comment.id === cached.replyIds[i]
          );

        console.log("Fresh Comments:", fresh.comments);
        console.log("Cached Reply IDs:", cached.replyIds);

        if (idsEqual) {
          console.log("Reply Cache return");

          return res.status(200).json({
            comments: cached.fullReplies, // Повертаємо кешовані дані
            totalReplies: cached.totalReplies,
            totalPages: cached.totalPages,
            currentPage: cached.currentPage,
            hasMoreReplies: cached.hasMoreReplies,
          });
        }
      }

      
      // Якщо кешу немає, запитуємо з бази даних
      const replies = await commentService.getAllReply(id, page, pageSize);

      // Кешуємо результат для подальших запитів     
      // Кешуємо ID та інші метадані
      await redis.setex(
        cacheKey,
        3600, // TTL 1 година
        JSON.stringify({
          replyIds: replies.comments.map((comment) => comment.id), // Кешуємо тільки ID
          fullReplies: replies.comments, // Кешуємо повні коментарі
          totalReplies: replies.count,
          totalPages: replies.totalPages,
          currentPage: page,
          hasMoreReplies: replies.hasMoreReplies,
        })
      );
      console.log("Reply return");
      return res.status(200).json({
        comments: replies.comments,
        totalReplies: replies.count,
        totalPages: replies.totalPages,
        currentPage: page,
        hasMoreReplies: replies.hasMoreReplies,
      });
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
}

module.exports = new CommentController();
