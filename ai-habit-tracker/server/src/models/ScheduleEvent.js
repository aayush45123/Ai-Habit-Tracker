import mongoose from "mongoose";

const scheduleEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    date: {
      type: String,
      required: [true, "Date is required (YYYY-MM-DD)"],
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required (HH:mm)"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm 24h format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required (HH:mm)"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm 24h format"],
    },
    startMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1440,
    },
    endMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1440,
    },
    category: {
      type: String,
      enum: ["work", "study", "fitness", "meeting", "routine", "personal", "break", "other"],
      default: "routine",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    reminderMinutesBefore: {
      type: Number,
      default: 15,
      enum: [0, 5, 10, 15, 30, 60],
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDays: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
    ],
    color: {
      type: String,
      default: "#000000",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for super-fast date and timetable range queries
scheduleEventSchema.index({ userId: 1, date: 1, startMinutes: 1 });
scheduleEventSchema.index({ userId: 1, status: 1 });

const ScheduleEvent = mongoose.model("ScheduleEvent", scheduleEventSchema);

export default ScheduleEvent;

