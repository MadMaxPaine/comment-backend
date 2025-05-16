const app = require("./app");
const { Pool } = require("pg");
const sequelize = require("../src/database/db");
const cfg = require("../src/config/config");
const { registerCommentEvents } = require("../src/events/comment.events");

const PORT = cfg.server.port || 7000;
const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("../src/socket"); //

const start = async () => {
  try {
    const pool = new Pool({
      host: cfg.database.host,
      port: cfg.database.port,
      user: cfg.database.user,
      password: cfg.database.password,
      database: cfg.database.dialect,
    });

    const client = await pool.connect();
    const dbName = "comment";

    const dbExists = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbExists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    client.release();
   
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // === HTTP + Socket.IO ===
    const server = http.createServer(app); // створюємо сервер
    const io = new Server(server, {
      cors: {
        origin: cfg.server.clientUrl, //  фронтовий домен
        methods: ["GET", "POST"],
        credentials: true,
      },
    });   
    initSocket(io); // підключаємо логіку сокетів  
    registerCommentEvents(io);
    // Передаємо io в контролери або сервіси
    app.set("io", io); // зберігаємо io в app для доступу
    server.listen(PORT, () =>
      console.log(`Server is starting on port: ${PORT}`)
    );
  } catch (e) {
    console.log(e);
  }
};

start();
