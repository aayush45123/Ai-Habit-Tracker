import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  addFoodLog,
  saveCalorieProfile,
  getCalorieStatus,
} from "../controllers/calorieController.js";

import {
  estimateFoodCalories,
  getDailyCalorieSummary,
} from "../controllers/aiCalorieController.js";

const router = express.Router();

router.post("/profile", auth, saveCalorieProfile);
router.post("/food", auth, addFoodLog);
router.get("/status", auth, getCalorieStatus);

router.post("/ai/estimate", auth, estimateFoodCalories);
router.get("/ai/summary", auth, getDailyCalorieSummary);

export default router;
