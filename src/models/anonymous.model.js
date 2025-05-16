const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");

const Anonymous = sequelize.define("Anonymous", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  homepage: { type: DataTypes.STRING, allowNull: true },
  oldAnonymousPrints: { 
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
module.exports = Anonymous;
