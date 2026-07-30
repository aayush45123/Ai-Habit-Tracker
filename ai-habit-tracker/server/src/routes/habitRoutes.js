import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import validate from "../middleware/validate.middleware.js";
import {
  createHabitSchema,
  updateHabitSchema,
  logHabitSchema,
} from "../validators/habit.validator.js";
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

router.post("/add", validate(createHabitSchema), addHabit);
router.get("/all", getAllHabits);
router.get("/analytics/all", getAnalytics);
router.get("/:id", getHabitById);
router.get("/:id/logs", getHabitLogs);
router.patch("/:id", validate(updateHabitSchema), updateHabit);
router.delete("/:id", deleteHabit);
router.post("/:id/log", validate(logHabitSchema), logHabit);

export default router;
