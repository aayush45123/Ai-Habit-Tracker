import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    habitTitle: {
      type: String,
      default: "Habit",
    },
    category: {
      type: String,
      default: "General",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["done", "missed"],
      required: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for fast profile/heatmap and streak querying
habitLogSchema.index({ userId: 1, date: -1 });
habitLogSchema.index({ userId: 1, status: 1 });
habitLogSchema.index({ habitId: 1, date: 1 });

const HabitLog = mongoose.model("HabitLog", habitLogSchema);
export default HabitLog;
