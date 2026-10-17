const http = require("http");
const createApp = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const { initSocket } = require("./services/socketService");

async function start() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`[server] MFD Backend running on http://localhost:${env.PORT}`);
    console.log(`[server] ML service target: ${env.ML_SERVICE_URL}`);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[server] Unhandled promise rejection:", reason);
  });
}

start();
