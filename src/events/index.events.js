const EventEmitter = require("events");

class AppEventEmitter extends EventEmitter {
  async emitAsync(event, ...args) {
    const listeners = this.listeners(event);
    if (listeners.length === 0) {
      console.warn(`Немає слухачів для події ${event}`);
    }
    for (const listener of listeners) {
      try {
        await listener(...args); // Слухач виконується асинхронно
      } catch (error) {
        console.error(
          `Error in time of serving listener for event ${event}:`,
          error
        );
      }
    }
  }
}

const appEventEmitter = new AppEventEmitter();

module.exports = appEventEmitter;
