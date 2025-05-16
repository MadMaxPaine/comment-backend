const { validationResult } = require("express-validator");
const ApiError = require("../errors/errors.API");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest("Validation errors", errors.array()));
  }
  next();
};

module.exports = validateRequest;
