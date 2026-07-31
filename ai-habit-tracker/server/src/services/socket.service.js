// server/src/services/socket.service.js
import { getIO } from "../socket/socket.js";

/**
 * Emit a real-time event to a specific user's socket room
 * @param {string} userId - MongoDB user ID string
 * @param {string} event  - Event name (e.g. "dashboard:update")
 * @param {any}    payload - Data to send
 */
export function emitToUser(userId, event, payload) {
  const io = getIO();
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized — skipping emit:", event);
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Broadcast an event to ALL connected socket clients
 * @param {string} event
 * @param {any}    payload
 */
export function broadcast(event, payload) {
  const io = getIO();
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized — skipping broadcast:", event);
    return;
  }
  io.emit(event, payload);
}

/**
 * Emit a dashboard refresh signal to a user
 * @param {string} userId
 * @param {Object} data - optional partial update data
 */
export function emitDashboardUpdate(userId, data = {}) {
  emitToUser(userId, "dashboard:update", data);
}

/**
 * Emit habit update event to a user
 * @param {string} userId
 * @param {Object} habit
 */
export function emitHabitUpdate(userId, habit) {
  emitToUser(userId, "habit:update", { habit });
}

/**
 * Emit analytics refresh signal to a user
 * @param {string} userId
 */
export function emitAnalyticsUpdate(userId) {
  emitToUser(userId, "analytics:update", {});
}

/**
 * Emit streak update to a user
 * @param {string} userId
 * @param {Object} data - { habitId, currentStreak, longestStreak }
 */
export function emitStreakUpdate(userId, data) {
  emitToUser(userId, "streak:update", data);
}

/**
 * Emit a real-time notification to a user
 * @param {string} userId
 * @param {Object} notification - { type, title, message }
 */
export function emitNotification(userId, notification) {
  emitToUser(userId, "notification:new", notification);
}
