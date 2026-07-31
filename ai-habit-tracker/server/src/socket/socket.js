// server/src/socket/socket.js
import { Server } from "socket.io";

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer
 * @returns {Server} io instance
 */
export function initSocket(httpServer) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ai-habit-tracker-eb72.vercel.app",
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
          return callback(null, true);
        }
        return callback(new Error("CORS not allowed"), false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  console.log("⚡ Socket.IO server initialized");
  return io;
}

/**
 * Get the shared io instance (after initSocket has been called)
 * @returns {Server|null}
 */
export function getIO() {
  return io;
}
