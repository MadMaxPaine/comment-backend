const axios = require("axios");

async function createTestComment() {
  try {
    const commentData = {
      name:"Max",
      email:"max@email.com",
      homePage:"",          
      text: "Тестовий коментар",
      parentId: 1, // або вкажи id для відповіді, наприклад: 1
    };

    const response = await axios.post("http://localhost:5000/api/comment", commentData);

    console.log("✅ Коментар створено:", response.data);
  } catch (error) {
    console.error("❌ Помилка при створенні коментаря:", error.response?.data || error.message);
  }
}

createTestComment();
