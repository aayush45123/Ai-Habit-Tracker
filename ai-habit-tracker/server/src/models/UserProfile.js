import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    disciplineScore: {
      type: Number,
      default: 0,
    },

    completionRate: {
      type: Number,
      default: 0,
    },

    focusScore: {
      type: Number,
      default: 0,
    },

    strongestHabit: String,

    weakestHabit: String,

    totalHabits: Number,

    completedHabits: Number,

    recommendations: [String],
  },
  { timestamps: true },
);

export default mongoose.model("UserProfile", userProfileSchema);
