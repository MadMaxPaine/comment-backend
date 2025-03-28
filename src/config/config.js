const { config } = require("dotenv");
require("dotenv").config();

module.exports = {
  jwt: {
    secret: process.env.SECRET_KEY || "your_secret_key",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "mdmxmp", // У PostgreSQL юзер за замовчуванням "postgres"
    password: process.env.DB_PASSWORD || "1111",
    name: process.env.DB_NAME || "comment",
    dialect: "postgres", // Змінюємо MySQL на PostgreSQL
    port: process.env.DB_PORT || 5432, // Порт PostgreSQL
  },
  server: {
    port: process.env.PORT || 5000,
    apiUrl: process.env.API_URL || "http://localhost:5000",
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  },  
  get: (key) => {
    const keys = key.split(".");
    return keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), config);
  },
};
