import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["done", "missed"],
      required: true,
    },
  },
  { timestamps: true }
);

const HabitLog = mongoose.model("HabitLog", habitLogSchema);
export default HabitLog;
