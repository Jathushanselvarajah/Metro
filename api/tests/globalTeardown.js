// Global teardown to close shared db pool and avoid open handle warnings
const app = require("../server");

module.exports = async () => {
  if (app && app.dbPool) {
    try {
      await app.dbPool.end();
    } catch {
      // ignored
    }
  }
};
