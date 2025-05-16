const appEventEmitter = require('./index.events');

function registerCommentEvents(io) {
  appEventEmitter.on('commentAdded', async (comment) => {
    console.log(`Event: Новий коментар: ${comment.id}`);
    
    const roomId = comment.parentId
      ? `comment-${comment.parentId}`
      : `comment-root`; // ✅ правильна кімната для головних коментарів
    
    console.log(`Відправляю коментар в кімнату: ${roomId}`);
    io.to(roomId).emit("receiveNewComment", comment);
  });
}

module.exports = { registerCommentEvents };
