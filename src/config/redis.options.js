const redis = require("../utils/redisClient");

module.exports = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
  db: redis.options.db,
};
