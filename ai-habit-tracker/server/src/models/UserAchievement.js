// server/src/models/UserAchievement.js
import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementKey: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index prevents duplicate unlocks
userAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

const UserAchievement = mongoose.model("UserAchievement", userAchievementSchema);
export default UserAchievement;
