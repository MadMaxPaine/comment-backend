// models/user.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: false },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING,allowNull: false  },
  homepage: { type: DataTypes.STRING },
  avatar: { type: DataTypes.STRING },
  ipAddress: { type: DataTypes.STRING, allowNull: true }, // Змінено
  userAgent: { type: DataTypes.STRING, allowNull: true }, // Змінено
  fingerprint: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
});

module.exports = User;
