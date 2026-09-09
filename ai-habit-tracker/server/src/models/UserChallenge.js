// server/src/models/UserChallenge.js
import mongoose from "mongoose";

const userChallengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "GamificationChallenge", required: true },
    status: { type: String, enum: ["active", "completed", "expired", "abandoned"], default: "active" },
    progress: { type: Number, default: 0, min: 0 },     // current count/value
    progressMax: { type: Number, default: 100 },         // target count/value
    completedAt: { type: Date, default: null },
    rewardClaimed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
userChallengeSchema.index({ userId: 1, status: 1 });

const UserChallenge = mongoose.model("UserChallenge", userChallengeSchema);
export default UserChallenge;
