const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: false },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  homepage: { type: DataTypes.STRING, allowNull: true },
  avatar: { type: DataTypes.STRING, allowNull: true },
  oldUserPrints: { 
    type: DataTypes.JSONB, 
    allowNull: true,
    defaultValue: [] // Масив об'єктів для oldAnonymousPrints
  },
  oldUserNames: { 
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: true, 
    defaultValue: [] // Масив для старих ніків
  },
  oldHomePages: { 
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: true, 
    defaultValue: [] // Масив для старих сайтів
  }
});

module.exports = User;
