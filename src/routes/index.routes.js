const Router = require("express");
const router = new Router();
const authMiddleware = require("../middlewares/auth.middleware");

const userRouter = require("./user.routes");
const commentRouter = require("./comment.routes");


router.use("/user", userRouter);
router.use("/comment", commentRouter);


module.exports = router;
