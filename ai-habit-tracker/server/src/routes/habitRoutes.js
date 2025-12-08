import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  logHabit,
  getHabitLogs,
  getAnalytics,
} from "../controllers/habitController.js";

const router = express.Router();

router.post("/add", authMiddleware, addHabit);
router.get("/all", authMiddleware, getAllHabits);
router.get("/:id", authMiddleware, getHabitById);
router.get("/:id/logs", authMiddleware, getHabitLogs); // NEW
router.patch("/:id", authMiddleware, updateHabit);
router.delete("/:id", authMiddleware, deleteHabit);

router.get("/analytics/all", authMiddleware, getAnalytics);

router.post("/:id/log", authMiddleware, logHabit); // mark done or missed

export default router;
