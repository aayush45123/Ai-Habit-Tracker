// server/src/models/WorkoutLog.js
import mongoose from "mongoose";

const workoutExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String, required: true },
    name: { type: String, required: true },
    sets: { type: String },
    reps: { type: String },
    duration: { type: String },
    restBetweenSets: { type: String },
    notes: { type: String },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false },
);

const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    scheduledDay: {
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
    focusArea: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "partial", "missed", "rest"],
      default: "pending",
    },
    totalExercises: {
      type: Number,
      default: 0,
    },
    completedExercises: {
      type: Number,
      default: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    scheduledDuration: {
      type: Number,
      default: 0,
    },
    actualDuration: {
      type: Number,
      default: 0,
    },
    completedExerciseIds: {
      type: [String],
      default: [],
    },
    exerciseEntries: {
      type: [workoutExerciseSchema],
      default: [],
    },
    checkpoint: {
      submitted: { type: Boolean, default: false },
      note: { type: String, default: "" },
      submittedAt: { type: Date },
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

workoutLogSchema.index(
  { userId: 1, timetableId: 1, date: 1 },
  { unique: true },
);

export default mongoose.model("WorkoutLog", workoutLogSchema);
