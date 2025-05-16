const { commentQueue } = require("../../src/queues/comment.queue"); // Імпортуємо чергу

// Тестовий коментар
const comment = {
  id: 1,
  parentId:1,
  text: "Це тестовий коментар",
  parentId: "globalRoom", // Використовуємо глобальну кімнату
};

// Додаємо задачу до черги
async function addJob() {
  await commentQueue.add("sendNotification", { comment });
  console.log("Задачу додано до черги!");
}

addJob();
