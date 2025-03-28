const { Sequelize } = require("sequelize");
const cfg = require("../config/config");

module.exports = new Sequelize(
  cfg.database.name,
  cfg.database.user,
  cfg.database.password,
  {
    dialect: cfg.database.dialect,
    host: cfg.database.host,
    port: cfg.database.port,
    logging: (msg) => console.log(msg), // Вимкнення логування запитів у консоль (можна включити для дебагу)
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);