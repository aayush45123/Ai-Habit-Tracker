import FoodLog from "../models/FoodLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";

/* ============================
   SAVE FOOD LOG
============================ */
export const addFoodLog = async (req, res) => {
  const userId = req.user;
  const { foodName, calories, imageUrl } = req.body;

  const food = await FoodLog.create({
    userId,
    foodName,
    calories,
    imageUrl,
    date: normalizeDateIST(new Date()),
  });

  res.json(food);
};

/* ============================
   SET / UPDATE PROFILE
============================ */
export const saveCalorieProfile = async (req, res) => {
  const userId = req.user;

  const profile = await CalorieProfile.findOneAndUpdate(
    { userId },
    { ...req.body, userId },
    { upsert: true, new: true }
  );

  res.json(profile);
};

/* ============================
   GET TODAY STATUS
============================ */
export const getCalorieStatus = async (req, res) => {
  const userId = req.user;
  const today = normalizeDateIST(new Date());

  const profile = await CalorieProfile.findOne({ userId });
  const logs = await FoodLog.find({ userId, date: today });

  const consumed = logs.reduce((s, l) => s + l.calories, 0);
  const remaining = profile.dailyGoal - consumed;

  res.json({
    goal: profile.dailyGoal,
    consumed,
    remaining,
  });
};
