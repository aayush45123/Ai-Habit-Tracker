// client/src/services/socket.service.js
import { io } from "socket.io-client";

// Strip /api suffix if present — Socket.IO connects to the root
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  rawApiUrl.replace(/\/api$/, "");

let socket = null;

/**
 * Connect to Socket.IO server with the user's JWT token
 * @param {string} token - JWT token from localStorage
 * @returns {Socket}
 */
export function connectSocket(token) {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("⚡ Socket connected:", socket.id);
    socket.emit("join:user");
  });

  socket.on("disconnect", (reason) => {
    console.log("⚡ Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("⚡ Socket connection error:", err.message);
  });

  return socket;
}

/**
 * Disconnect the socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance
 * @returns {Socket|null}
 */
export function getSocket() {
  return socket;
}

/**
 * Subscribe to a socket event
 * @param {string} event
 * @param {Function} callback
 */
export function onSocketEvent(event, callback) {
  if (!socket) return;
  socket.on(event, callback);
}

/**
 * Unsubscribe from a socket event
 * @param {string} event
 * @param {Function} callback
 */
export function offSocketEvent(event, callback) {
  if (!socket) return;
  socket.off(event, callback);
}
