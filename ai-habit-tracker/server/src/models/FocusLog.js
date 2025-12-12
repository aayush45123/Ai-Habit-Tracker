// server/src/models/FocusLog.js
import mongoose from "mongoose";

const focusLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    durationMin: { type: Number, required: true }, // minutes
    sessionType: {
      type: String,
      enum: ["focus", "short", "long"],
      default: "focus",
    },
    status: {
      type: String,
      enum: ["completed", "skipped"],
      default: "completed",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

focusLogSchema.index({ userId: 1, date: 1 }); // speed up today queries

export default mongoose.model("FocusLog", focusLogSchema);
