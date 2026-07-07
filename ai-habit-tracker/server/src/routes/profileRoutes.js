import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  saveCalorieProfile,
  getCalorieProfile,
} from "../controllers/calorieController.js";

const router = express.Router();

router.get("/", auth, getCalorieProfile);
router.post("/", auth, saveCalorieProfile);

export default router;
