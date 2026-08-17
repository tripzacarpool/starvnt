const serverless = require("serverless-http");
// Import the compiled app (ensure `npm run build` has run so dist exists)
const { app } = require("../dist/src/server.js");
const { connectDb } = require("../dist/src/db.js");

let dbReady = global.__dbReady;
if (!dbReady) {
  dbReady = connectDb();
  global.__dbReady = dbReady;
}

const handler = serverless(app);

module.exports = async (req, res) => {
  await dbReady;
  return handler(req, res);
};
