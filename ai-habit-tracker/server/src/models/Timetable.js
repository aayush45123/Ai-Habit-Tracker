// server/src/models/Timetable.js
import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: String },
  reps: { type: String },
  duration: { type: String },
  notes: { type: String },
});

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
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
  focusArea: { type: String }, // e.g., "Legs + Core", "Rest Day"
  exercises: [exerciseSchema],
  timeBlock: {
    morning: { type: String },
    evening: { type: String },
    night: { type: String },
  },
  isRestDay: { type: Boolean, default: false },
});

const timetableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "My Fitness Schedule",
    },
    goal: {
      type: String,
      enum: [
        "fat_loss",
        "muscle_gain",
        "strength",
        "sports_stamina",
        "general_fitness",
      ],
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    sportsMode: {
      enabled: { type: Boolean, default: false },
      sport: {
        type: String,
        enum: [
          "cricket_bowler",
          "cricket_batter",
          "football",
          "runner",
          "none",
        ],
        default: "none",
      },
    },
    timeAvailable: {
      type: Number, // in minutes
      required: true,
      default: 60,
    },
    weeklySchedule: [dayScheduleSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    generatedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Ensure only one active timetable per user
timetableSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("Timetable", timetableSchema);
