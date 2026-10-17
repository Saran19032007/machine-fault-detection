const mongoose = require("mongoose");
const env = require("./env");

let isConnected = false;

async function connectDB() {
  mongoose.connection.on("connected", () => {
    isConnected = true;
    console.log("[db] MongoDB connected");
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("[db] MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    isConnected = false;
    console.error("[db] MongoDB connection error:", err.message);
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    console.error("[db] Initial MongoDB connection failed:", err.message);
    console.error("[db] The server will keep running; DB-dependent routes will report errors until MongoDB is reachable.");
  }
}

function getDbStatus() {
  return isConnected ? "connected" : "disconnected";
}

module.exports = { connectDB, getDbStatus };
