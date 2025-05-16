let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // Підписка на кімнату
    socket.on("joinRoom", (roomId) => {
      if (!roomId) {
        console.log("❌ Room ID is missing!");
        return;
      }
      socket.join(roomId);
      console.log(`👥 Socket ${socket.id} приєднався до кімнати: ${roomId}`);
    });

    // Вихід з кімнати
    socket.on("leaveRoom", (roomId) => {
      if (!roomId) {
        console.log("❌ Room ID is missing for leaveRoom!");
        return;
      }
      socket.leave(roomId);
      console.log(`👋 Socket ${socket.id} вийшов з кімнати: ${roomId}`);
    });

    // Відключення
    socket.on("disconnect", () => {
      console.log(`🔴 Користувач вийшов: ${socket.id}`);
    });
  });
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io не ініціалізовано!");
  }
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO,
};
