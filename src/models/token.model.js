const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");

const Token = sequelize.define("Token", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  refreshToken: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = Token;