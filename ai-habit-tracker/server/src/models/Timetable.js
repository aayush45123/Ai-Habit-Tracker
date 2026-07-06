// server/src/models/Timetable.js
import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: String },
  reps: { type: String },
  duration: { type: String },
  restBetweenSets: { type: String },
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
  focusArea: { type: String },
  exercises: [exerciseSchema],
  timeBlock: {
    morning: { type: String },
    afternoon: { type: String },
    evening: { type: String },
    night: { type: String },
  },
  isRestDay: { type: Boolean, default: false },
  startTime: { type: String },
  endTime: { type: String },
});

const improvementSuggestionSchema = new mongoose.Schema({
  day: { type: String },
  category: {
    type: String,
    enum: [
      "exercise_order",
      "rest_periods",
      "volume",
      "intensity",
      "exercise_selection",
      "recovery",
      "timing",
      "general",
    ],
  },
  suggestion: { type: String, required: true },
  reason: { type: String },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium",
  },
  createdAt: { type: Date, default: Date.now },
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
      required: true,
      default: "My Workout Schedule",
    },
    category: {
      type: String,
      enum: [
        "bodybuilding",
        "powerlifting",
        "crossfit",
        "calisthenics",
        "sports_specific",
        "general_fitness",
        "weight_loss",
        "endurance",
      ],
      required: true,
    },
    goal: {
      type: String,
      enum: [
        "fat_loss",
        "muscle_gain",
        "strength",
        "sports_stamina",
        "general_fitness",
        "endurance",
        "flexibility",
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
          "basketball",
          "runner",
          "swimmer",
          "none",
        ],
        default: "none",
      },
    },
    weeklySchedule: [dayScheduleSchema],
    aiImprovements: [improvementSuggestionSchema],
    hasRequestedAI: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastImprovedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

timetableSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("Timetable", timetableSchema);
