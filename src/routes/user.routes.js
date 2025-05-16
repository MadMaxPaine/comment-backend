const Router = require("express");
const upload = require("../middlewares/avatar.middleware");

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  registerValidation,
} = require("../validations/registration.validation");
const validateRequest = require("../middlewares/validate.request");
const router = new Router();

router.post(
  "/registration",
  upload.single("avatar"),
  registerValidation,
  validateRequest,
  userController.registration
);
router.post("/login", userController.login);
router.post("/logout", authMiddleware, userController.logout);
router.get("/refresh", userController.refresh);

module.exports = router;
