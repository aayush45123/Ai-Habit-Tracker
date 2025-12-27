import FoodLog from "../models/FoodLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";

/* ============================
   SAVE FOOD LOG
============================ */
export const addFoodLog = async (req, res) => {
  try {
    const userId = req.user;
    const { foodName, calories, imageUrl } = req.body;

    if (!foodName || !calories) {
      return res.status(400).json({
        message: "foodName and calories are required",
      });
    }

    const food = await FoodLog.create({
      userId,
      foodName,
      calories: Number(calories),
      imageUrl,
      date: normalizeDateIST(new Date()),
    });

    res.json(food);
  } catch (err) {
    console.error("Error adding food log:", err);
    res.status(500).json({ message: "Failed to add food log" });
  }
};

/* ============================
   GET PROFILE
============================ */
export const getCalorieProfile = async (req, res) => {
  try {
    const userId = req.user;
    const profile = await CalorieProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found. Please create one.",
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("Error getting profile:", err);
    res.status(500).json({ message: "Failed to get profile" });
  }
};

/* ============================
   SET / UPDATE PROFILE
============================ */
export const saveCalorieProfile = async (req, res) => {
  try {
    const userId = req.user;
    const { age, height, weight, activityLevel, dailyGoal } = req.body;

    // Validate required fields
    if (!age || !height || !weight || !activityLevel || !dailyGoal) {
      return res.status(400).json({
        message: "All profile fields are required",
      });
    }

    const profile = await CalorieProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        activityLevel,
        dailyGoal: Number(dailyGoal),
      },
      { upsert: true, new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error("Error saving profile:", err);
    res.status(500).json({ message: "Failed to save profile" });
  }
};

/* ============================
   GET TODAY STATUS
============================ */
export const getCalorieStatus = async (req, res) => {
  try {
    const userId = req.user;
    const today = normalizeDateIST(new Date());

    const profile = await CalorieProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found. Please create one first.",
      });
    }

    const logs = await FoodLog.find({ userId, date: today });

    const consumed = logs.reduce((s, l) => s + (l.calories || 0), 0);
    const remaining = profile.dailyGoal - consumed;

    res.json({
      goal: profile.dailyGoal,
      consumed,
      remaining,
    });
  } catch (err) {
    console.error("Error getting status:", err);
    res.status(500).json({ message: "Failed to get calorie status" });
  }
};
