import mongoose from "mongoose";

const userFoodMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    foodKey: {
      type: String,
      required: true,
      index: true,
    },
    foodName: {
      type: String,
      required: true,
    },
    calories: {
      type: Number,
      required: true,
    },
    protein: {
      type: Number,
      default: 0,
    },
    logCount: {
      type: Number,
      default: 1,
    },
    isCorrection: {
      type: Boolean,
      default: false,
    },
    lastLoggedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per user and normalized food key
userFoodMemorySchema.index({ userId: 1, foodKey: 1 }, { unique: true });

export default mongoose.model("UserFoodMemory", userFoodMemorySchema);
