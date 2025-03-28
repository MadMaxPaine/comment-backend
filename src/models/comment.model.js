// models/comment.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../database/db");
const User = require("./user.model");
const Anonymous = require("./anonymous.model");

const Comment = sequelize.define("Comment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Comments",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  userId: {
    
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: "id" },
  },
  anonymousId: {
    
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Anonymous, key: "id" },
  },
});


module.exports = Comment;
