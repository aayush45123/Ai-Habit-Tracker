import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  addFoodLog,
  saveCalorieProfile,
  getCalorieStatus,
  getCalorieProfile,
  deleteFoodLog,
  getRecommendations,
  getAnalytics,
  getDateDetails,
  checkWeeklyCheckIn,
  saveWeeklyCheckIn,
} from "../controllers/calorieController.js";

import {
  estimateFoodCalories,
  getDailyCalorieSummary,
} from "../controllers/aiCalorieController.js";

const router = express.Router();

// Profile routes
router.post("/profile", auth, saveCalorieProfile);
router.get("/profile", auth, getCalorieProfile);
router.get("/recommendations", auth, getRecommendations);

// Food logging routes
router.post("/food", auth, addFoodLog);
router.get("/status", auth, getCalorieStatus);
router.delete("/food/:id", auth, deleteFoodLog);

// Analytics routes
router.get("/analytics", auth, getAnalytics);
router.get("/analytics/date/:date", auth, getDateDetails);

// Weekly check-in routes
router.get("/check-weekly", auth, checkWeeklyCheckIn);
router.post("/weekly-checkin", auth, saveWeeklyCheckIn);

// AI routes
router.post("/ai/estimate", auth, estimateFoodCalories);
router.get("/ai/summary", auth, getDailyCalorieSummary);

export default router;
