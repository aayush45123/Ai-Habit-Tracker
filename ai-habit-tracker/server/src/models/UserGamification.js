// server/src/models/UserGamification.js
import mongoose from "mongoose";

const userGamificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    totalXP: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    habitCoins: { type: Number, default: 0, min: 0 },
    streakFreezes: { type: Number, default: 0, min: 0, max: 5 },
    consecutiveDaysForFreeze: { type: Number, default: 0 },
    lastFreezeEarnedAt: { type: Date, default: null },
    lastFreezeUsedAt: { type: Date, default: null },
    featuredBadges: { type: [String], default: [], validate: [(arr) => arr.length <= 3, "Max 3 featured badges"] },
    firstHabitGranted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserGamification = mongoose.model("UserGamification", userGamificationSchema);
export default UserGamification;
