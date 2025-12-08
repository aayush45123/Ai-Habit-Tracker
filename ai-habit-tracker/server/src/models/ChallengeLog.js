import mongoose from "mongoose";

const challengeLogSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },
    habitIndex: {
      type: Number, // index in Challenge.habits
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    status: {
      type: String,
      enum: ["done"],
      required: true,
    },
  },
  { timestamps: true }
);

const ChallengeLog = mongoose.model("ChallengeLog", challengeLogSchema);
export default ChallengeLog;
