// server/src/socket/socketHandlers.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Register all Socket.IO connection handlers
 * @param {import("socket.io").Server} io
 */
export function registerSocketHandlers(io) {
  // Authenticate socket connection via JWT with active & revoked token validation
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

      if (user.isActive === false) {
        return next(new Error("Account disabled"));
      }

      // Check token version to reject revoked sessions
      if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
        if (decoded.tokenVersion !== user.tokenVersion) {
          return next(new Error("Session expired or revoked"));
        }
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

    // Inbound socket event rate limiter state
    let eventCount = 0;
    let windowReset = Date.now() + 60000;

    const checkSocketRateLimit = () => {
      const now = Date.now();
      if (now > windowReset) {
        eventCount = 1;
        windowReset = now + 60000;
        return true;
      }
      eventCount++;
      return eventCount <= 60; // Max 60 events/minute per socket
    };

    // Join user-specific room for targeted events (strictly bound to authenticated userId)
    socket.join(`user:${userId}`);

    // Client can explicitly rejoin their own room
    socket.on("join:user", () => {
      if (!checkSocketRateLimit()) {
        return socket.emit("error", { message: "Socket rate limit exceeded" });
      }
      socket.join(`user:${userId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`⚡ Socket disconnected: user ${userId} — reason: ${reason}`);
    });

    socket.on("error", (err) => {
      console.error(`Socket error for user ${userId}:`, err.message);
    });
  });
}
