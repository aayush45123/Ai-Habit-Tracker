import mongoose from "mongoose";

const calorieProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    age: Number,
    height: Number, // cm
    weight: Number, // kg
    activityLevel: String, // low | moderate | high
    dailyGoal: Number,
  },
  { timestamps: true }
);

export default mongoose.model("CalorieProfile", calorieProfileSchema);
