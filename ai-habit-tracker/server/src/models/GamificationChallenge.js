// server/src/models/GamificationChallenge.js
import mongoose from "mongoose";

const gamificationChallengeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["daily", "weekly", "monthly", "personal", "ai_generated"], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard", "expert"], default: "medium" },
    category: { type: String, default: "consistency" },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true },   // YYYY-MM-DD
    requirements: { type: mongoose.Schema.Types.Mixed, default: {} },
    // e.g. { type: "streak", value: 7 } or { type: "completions", value: 5, habitTitle: "Morning Run" }
    xpReward: { type: Number, default: 100 },
    coinReward: { type: Number, default: 20 },
    badgeKey: { type: String, default: null },
    isAIGenerated: { type: Boolean, default: false },
    // null = available to all users, set userId for personal challenges
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

gamificationChallengeSchema.index({ type: 1, isActive: 1 });
gamificationChallengeSchema.index({ endDate: 1 });

const GamificationChallenge = mongoose.model("GamificationChallenge", gamificationChallengeSchema);
export default GamificationChallenge;
