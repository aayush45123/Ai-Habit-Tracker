// server/src/models/UserReward.js
import mongoose from "mongoose";

const userRewardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rewardKey: { type: String, required: true },
    redeemedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique index — prevents duplicate redemption for non-repeatable rewards
userRewardSchema.index({ userId: 1, rewardKey: 1 }, { unique: true });

const UserReward = mongoose.model("UserReward", userRewardSchema);
export default UserReward;
