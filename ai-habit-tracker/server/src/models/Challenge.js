import mongoose from "mongoose";

const challengeHabitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    endDate: {
      type: String, // startDate + 20 days
      required: true,
    },
    habits: [challengeHabitSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Challenge = mongoose.model("Challenge", challengeSchema);
export default Challenge;
