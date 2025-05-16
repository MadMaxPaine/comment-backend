const corsOptions = {
  origin: [
    "http://localhost:3000", // dev frontend
    //"https://production-domain.com", // прод
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization","captcha-id", "captcha-input"],
  credentials: true, // дозволити куки
};

module.exports = corsOptions;
