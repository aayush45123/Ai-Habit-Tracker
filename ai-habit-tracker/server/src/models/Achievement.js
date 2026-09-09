// server/src/models/Achievement.js
// Static achievement definitions — seeded once at startup
import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "??" },
    rarity: { type: String, enum: ["common", "uncommon", "rare", "epic", "legendary"], default: "common" },
    category: { type: String, enum: ["streak", "consistency", "challenge", "exploration", "mastery", "milestone"], default: "milestone" },
    xpReward: { type: Number, default: 0 },
    coinReward: { type: Number, default: 0 },
    // Human-readable description of how to unlock (shown in locked state)
    unlockCriteria: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement;
