import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import validate from "../middleware/validate.middleware.js";
import { z } from "zod";
import {
  createHabitSchema,
  updateHabitSchema,
  logHabitSchema,
} from "../validators/habit.validator.js";

const bulkHabitsSchema = z.object({
  habits: z.array(createHabitSchema).min(1).max(20),
});
import {
  addHabit,
  addHabitsBulk,
  getAllHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  logHabit,
  freezeHabit,
  getHabitLogs,
  getAnalytics,
} from "../controllers/habitController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireProfileCompleted);

router.post("/add", validate(createHabitSchema), addHabit);
router.post("/add-bulk", validate(bulkHabitsSchema), addHabitsBulk);
router.get("/all", getAllHabits);
router.get("/analytics/all", getAnalytics);
router.get("/:id", getHabitById);
router.get("/:id/logs", getHabitLogs);
router.patch("/:id", validate(updateHabitSchema), updateHabit);
router.delete("/:id", deleteHabit);
router.post("/:id/log", validate(logHabitSchema), logHabit);
router.post("/:id/freeze", freezeHabit);

export default router;
