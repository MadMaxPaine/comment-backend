const ApiError = require("../errors/errors.API");

module.exports = function (err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.url}`);
  console.error(err.stack || err); // Покажемо stack trace якщо є

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      status: "error",
      message: err.message,
      errors: err.errors || [],
    });
  }

  return res.status(500).json({
    status: "error",
    message: "❌ Unexpected error occurred on server.",
  });
};
