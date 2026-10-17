const { Server } = require("socket.io");
const env = require("../config/env");
const deviceStatusService = require("./deviceStatusService");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);
    socket.emit("device:status", deviceStatusService.getAllStatuses());

    socket.on("disconnect", () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });
  });

  // Periodically push device connectivity status so the dashboard reflects
  // an ESP32 going silent even when no new reading arrives.
  setInterval(() => {
    if (io) {
      io.emit("device:status", deviceStatusService.getAllStatuses());
    }
  }, 5000);

  return io;
}

function emitSensorUpdate(payload) {
  if (io) io.emit("sensor:update", payload);
}

function emitAlert(payload) {
  if (io) io.emit("alert:new", payload);
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitSensorUpdate, emitAlert, getIO };
