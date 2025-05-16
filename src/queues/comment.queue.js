const Bull = require("bull");
const redisConfig = require("../config/redis.options"); // Налаштування Redis
const commentEventEmitter = require("../events/index.events"); // Імпортуємо emitter

// Ініціалізація черги (повинно бути створення через `new Bull` для нової версії)
const commentQueue = new Bull("commentQueue", {
  redis: redisConfig, // Передаємо конфігурацію Redis
});

commentQueue.on("ready", () => {
  console.log("Ready to queue!");
});
commentQueue.on("failed", (job, err) => {
  console.log(`Failed queue task: ${job.id}, помилка: ${err}`);
});

commentQueue.on("ready", () => {
  console.log("Queue tasks!");
});

commentQueue.on("failed", (job, err) => {
  console.log(`Failed task: ${job.id}, помилка: ${err}`);
});
// Обробник задач для черги
commentQueue.process("sendNotification", async (job) => {
  console.log(`Doing task: ${job.name}`);

  const { comment } = job.data;

  if (job.name === "sendNotification") {
    console.log("Notification triggered for comment:", comment);
    await sendNotification(comment);
    // Очищуємо чергу після виконання задачі
    await cleanQueue();
  }
});

// Функція для відправки сповіщень (через івенти)
async function sendNotification(comment) {
  console.log(`Queue: Notification triggered for comment: ${comment.id}`);
  commentEventEmitter.emitAsync("commentAdded", comment); // 'commentAdded'
}
// Функція для очищення черги після виконання задачі
async function cleanQueue() {
  try {
    // Очищаємо завершені та неуспішні задачі
    await commentQueue.clean(1000, "completed"); // Очищення завершених задач
    await commentQueue.clean(1000, "failed"); // Очищення неуспішних задач
    console.log("Cleaned Queue!");
  } catch (error) {
    console.error("Error at cleaninf Queue:", error);
  }
}

// Експортуємо чергу та інші елементи
module.exports = { commentQueue };
