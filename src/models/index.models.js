const sequelize = require("../database/db");
const User = require("./user.model");
const Token = require("./token.model");
const Anonymous = require("./anonymous.model");
const Comment = require("./comment.model");

User.hasMany(Token, { foreignKey: "userId", onDelete: "CASCADE" });
Token.belongsTo(User, { foreignKey: "userId" });

Anonymous.hasMany(Comment, { foreignKey: "anonymousId" });
User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId", as: "author", onDelete: "SET NULL" });
Comment.belongsTo(Anonymous, { foreignKey: "anonymousId", as: "anonymousAuthor", onDelete: "SET NULL" });

Comment.belongsTo(Comment, { as: "parent", foreignKey: "parentId" });
Comment.hasMany(Comment, { as: "replies", foreignKey: "parentId", onDelete: "CASCADE" });

// Синхронізація бази даних
module.exports = {
  User,
  Token,
  Anonymous,
  Comment
};
