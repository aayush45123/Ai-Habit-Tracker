import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    activeDurationSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "closed", "expired"],
      default: "active",
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
userSessionSchema.index({ userId: 1, status: 1 });
userSessionSchema.index({ status: 1, lastActivityAt: -1 });
userSessionSchema.index({ loginAt: -1, status: 1 });

const UserSession = mongoose.model("UserSession", userSessionSchema);
export default UserSession;
