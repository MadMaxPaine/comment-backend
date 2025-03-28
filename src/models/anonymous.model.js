// models/anonymous.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");

const Anonymous = sequelize.define("Anonymous", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  homepage: { type: DataTypes.STRING, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true }, // Змінено
  userAgent: { type: DataTypes.STRING, allowNull: true }, // Змінено
  fingerprint: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
});
module.exports = Anonymous;
