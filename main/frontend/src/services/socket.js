import { io } from "socket.io-client";

let socket = null;
let currentUrl = null;

export function getSocket(backendUrl) {
  if (socket && currentUrl === backendUrl) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentUrl = backendUrl;
  socket = io(backendUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUrl = null;
  }
}
