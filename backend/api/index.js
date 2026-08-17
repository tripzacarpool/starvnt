const serverless = require("serverless-http");
// Import the compiled app (ensure `npm run build` has run so dist exists)
const { app } = require("../dist/src/server.js");
const { connectDb } = require("../dist/src/db.js");

// Wrap the Express app with serverless-http once
const handler = serverless(app);

// Lazy, cached DB connection promise. We don't want the function to crash
// on a connection error; instead return a clear 500 response.
function getDbReady() {
  if (!global.__dbReady) {
    global.__dbReady = (async () => {
      try {
        await connectDb();
        return true;
      } catch (err) {
        // store the error so we can inspect it without throwing repeatedly
        global.__dbConnectError = err;
        throw err;
      }
    })();
  }
  return global.__dbReady;
}

module.exports = async (req, res) => {
  try {
    try {
      await getDbReady();
    } catch (err) {
      console.error(
        "DB connection failed:",
        err && err.message ? err.message : err,
      );
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ message: "Database connection failed" }));
      return;
    }

    return handler(req, res);
  } catch (err) {
    console.error("Unhandled function error", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};
