import mongoose from "mongoose";

const visitorLogSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isGuest: {
      type: Boolean,
      default: true,
      index: true,
    },
    path: {
      type: String,
      default: "/",
      index: true,
    },
    referrer: {
      type: String,
      default: "",
    },
    deviceType: {
      type: String,
      default: "desktop",
    },
    browser: {
      type: String,
      default: "Other",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
visitorLogSchema.index({ visitorId: 1, timestamp: -1 });
visitorLogSchema.index({ timestamp: -1, isGuest: 1 });
visitorLogSchema.index({ path: 1, timestamp: -1 });

const VisitorLog = mongoose.model("VisitorLog", visitorLogSchema);
export default VisitorLog;
