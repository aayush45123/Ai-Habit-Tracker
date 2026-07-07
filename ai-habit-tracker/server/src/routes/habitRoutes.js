import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
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

router.use(authMiddleware);
router.use(requireProfileCompleted);

router.post("/add", addHabit);
router.get("/all", getAllHabits);
router.get("/:id", getHabitById);
router.get("/:id/logs", getHabitLogs); // NEW
router.patch("/:id", updateHabit);
router.delete("/:id", deleteHabit);

router.get("/analytics/all", getAnalytics);

router.post("/:id/log", logHabit); // mark done or missed

export default router;
