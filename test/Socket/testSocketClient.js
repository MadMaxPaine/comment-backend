const io = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log(`🟢 Підключено до серверу, socket ID: ${socket.id}`);

  const roomId = "comment-1"; // заміни на потрібний ID
  socket.emit("joinRoom", roomId);
  console.log(`👥 Підписано на кімнату: ${roomId}`);
});

// Слухач нового коментаря
socket.on("receiveNewComment", (comment) => {
  console.log(`👀 Отримано новий коментар: ${JSON.stringify(comment)}`);
});

// НЕ виходь одразу з кімнати!
