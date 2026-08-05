import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD (IST normalized)
      required: true,
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalTemplate",
      default: null,
    },
    templateType: {
      type: String,
      enum: ["default", "student", "developer", "fitness", "business", "personal", "custom"],
      default: "default",
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "terrible", ""],
      default: "good",
    },
    moodScore: {
      type: Number, // 1 to 5
      min: 1,
      max: 5,
      default: 4,
    },
    energyLevel: {
      type: Number, // 1 to 5
      min: 1,
      max: 5,
      default: 3,
    },
    stressLevel: {
      type: Number, // 1 to 5
      min: 1,
      max: 5,
      default: 2,
    },
    productivityHours: {
      type: Number,
      default: 0,
    },
    learningHours: {
      type: Number,
      default: 0,
    },
    sleepHours: {
      type: Number,
      default: 0,
    },
    waterIntake: {
      type: Number, // Liters
      default: 0,
    },
    weight: {
      type: Number, // kg
      default: 0,
    },
    steps: {
      type: Number,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    workoutSummary: {
      type: String,
      default: "",
    },
    topPriorities: {
      type: [String],
      default: [],
    },
    todayGoal: {
      type: String,
      default: "",
    },
    learningLog: {
      type: String,
      default: "",
    },
    biggestAchievement: {
      type: String,
      default: "",
    },
    mistakesMade: {
      type: String,
      default: "",
    },
    challengesFaced: {
      type: String,
      default: "",
    },
    lessonsLearned: {
      type: String,
      default: "",
    },
    gratitude: {
      type: [String],
      default: [],
    },
    tomorrowsFocus: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    customFieldsData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one journal entry per user per date
journalEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("JournalEntry", journalEntrySchema);
