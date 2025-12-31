// WeeklyCheckIn.js (NEW MODEL)
import mongoose from "mongoose";

const weeklyCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weightChange: {
      type: String,
      enum: ["increased", "decreased", "same"],
      required: true,
    },
    feelingBetter: {
      type: String,
      enum: ["much_better", "better", "same", "worse"],
      required: true,
    },
    energyLevel: {
      type: String,
      enum: ["high", "moderate", "low"],
      required: true,
    },
    updatedProfile: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WeeklyCheckIn", weeklyCheckInSchema);
