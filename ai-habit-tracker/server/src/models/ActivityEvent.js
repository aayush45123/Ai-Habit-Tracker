import mongoose from "mongoose";

const activityEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
      default: null,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
activityEventSchema.index({ userId: 1, timestamp: -1 });
activityEventSchema.index({ eventType: 1, timestamp: -1 });
activityEventSchema.index({ timestamp: -1 });
activityEventSchema.index({ sessionId: 1, timestamp: -1 });

const ActivityEvent = mongoose.model("ActivityEvent", activityEventSchema);
export default ActivityEvent;
