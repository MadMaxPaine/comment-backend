const { body } = require("express-validator");

exports.registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Username can contain only letters and numbers"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),

  body("homepage")
  .optional({ checkFalsy: true }) 
    .isURL()
    .withMessage("Homepage must be a valid URL"),
];
