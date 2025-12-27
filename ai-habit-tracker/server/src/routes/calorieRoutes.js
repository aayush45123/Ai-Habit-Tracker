import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  addFoodLog,
  saveCalorieProfile,
  getCalorieStatus,
  getCalorieProfile,
  deleteFoodLog,
} from "../controllers/calorieController.js";

import {
  estimateFoodCalories,
  getDailyCalorieSummary,
} from "../controllers/aiCalorieController.js";

const router = express.Router();

// Profile routes
router.post("/profile", auth, saveCalorieProfile);
router.get("/profile", auth, getCalorieProfile);

// Food logging routes
router.post("/food", auth, addFoodLog);
router.get("/status", auth, getCalorieStatus);
router.delete("/food/:id", auth, deleteFoodLog);

// AI routes
router.post("/ai/estimate", auth, estimateFoodCalories);
router.get("/ai/summary", auth, getDailyCalorieSummary);

export default router;
