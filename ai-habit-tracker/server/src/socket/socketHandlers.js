// server/src/socket/socketHandlers.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Register all Socket.IO connection handlers
 * @param {import("socket.io").Server} io
 */
export function registerSocketHandlers(io) {
  // Authenticate socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`⚡ Socket connected: user ${userId} (socket ${socket.id})`);

    // Join user-specific room for targeted events
    socket.join(`user:${userId}`);

    // Client can explicitly join their room (idempotent)
    socket.on("join:user", () => {
      socket.join(`user:${userId}`);
      console.log(`📥 ${userId} joined their room`);
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `⚡ Socket disconnected: user ${userId} — reason: ${reason}`
      );
    });

    socket.on("error", (err) => {
      console.error(`Socket error for user ${userId}:`, err.message);
    });
  });
}
