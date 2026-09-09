// server/src/models/Reward.js
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "??" },
    category: { type: String, enum: ["cosmetic", "functional", "recognition"], default: "cosmetic" },
    coinCost: { type: Number, required: true, min: 0 },
    rarity: { type: String, enum: ["common", "uncommon", "rare", "epic", "legendary"], default: "common" },
    isAvailable: { type: Boolean, default: true },
    isRepeatable: { type: Boolean, default: false },
    // Minimum level required to purchase
    minLevel: { type: Number, default: 1 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Reward = mongoose.model("Reward", rewardSchema);
export default Reward;
