// CalorieProfile.js
import mongoose from "mongoose";

const calorieProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    age: Number,
    height: Number, // cm
    weight: Number, // kg
    gender: { type: String, enum: ["male", "female"], default: "male" },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate",
    },
    goal: {
      type: String,
      enum: ["lose", "maintain", "gain"],
      default: "maintain",
    },
    dailyGoal: Number,
    proteinGoal: Number,
  },
  { timestamps: true }
);

export default mongoose.model("CalorieProfile", calorieProfileSchema);
