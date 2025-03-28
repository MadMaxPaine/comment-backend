const ApiError = require("../errors/errors.API");
const { validateAccessToken } = require("../services/token.service");

module.exports = function (req, res, next) {
  if (req.method === "OPTIONS") {
    next();
  }
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return next(ApiError.unauthorizedError());
    }
    const accessToken = authorizationHeader.split(" ")[1];
    if (!accessToken) {
      return next(ApiError.unauthorizedError());
    }
    const userData = validateAccessToken(accessToken);
    if (!userData) {
      return next(ApiError.unauthorizedError());
    }
    req.user = userData;
    next();
  } catch (e) {
    return next(ApiError.unauthorizedError());
  }
};
