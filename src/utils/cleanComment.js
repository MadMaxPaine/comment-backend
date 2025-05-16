function cleanComments(comments) {
  return comments.map((comment) => {
    const { anonymousAuthor, ...rest } = comment.toJSON(); // або .dataValues
    return rest;
  });
}
function cleanComment(comment) {
  const { anonymousAuthor, ...rest } = comment.toJSON(); // або .dataValues
  return rest;
}
module.exports = { cleanComments,cleanComment };
