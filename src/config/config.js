const configObj = {
  jwt: {
    secret: process.env.SECRET_KEY || "your_secret_key",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "1234",
    name: process.env.DB_NAME || "comment",
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
  },
  server: {
    port: process.env.PORT || 5000,
    apiUrl: process.env.API_URL || "http://localhost:5000",
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || "",
    db: process.env.REDIS_DB || 0, // За замовчуванням використовується база 0
  },
};

configObj.get = (key, defaultValue = null) => {
  const keys = key.split(".");
  return keys.reduce((obj, k) => {
    if (obj && obj[k] !== undefined) {
      return obj[k];
    } else {
      console.warn(`Config key "${key}" not found. Returning default value.`);
      return defaultValue;
    }
  }, configObj);
};

module.exports = configObj;
