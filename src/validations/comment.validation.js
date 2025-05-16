const { body } = require("express-validator");
const { validateXHTML } = require("../utils/xhtmlValidator");

exports.commentValidation = [
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

  body("homepage")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Homepage must be a valid URL"),

  body("text")
    .notEmpty()
    .withMessage("Comment content is required")
    .custom((value) => {
      const validationResult = validateXHTML(value);
      if (validationResult !== "Valid XHTML") {
        throw new Error(validationResult); // Якщо текст не валідний, кидаємо помилку
      }
      return true; // Якщо все добре, продовжуємо
    })
    .withMessage("Text is not valid XHTML"), // Якщо помилка з кастомним валідатором
];
