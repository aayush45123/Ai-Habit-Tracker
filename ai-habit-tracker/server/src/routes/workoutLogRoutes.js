// server/src/routes/workoutLogRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import {
  finalizeWorkoutLog,
  getTodayWorkoutLog,
  getWorkoutLogAnalytics,
  getWorkoutLogHistory,
  updateWorkoutLogDraft,
} from "../controllers/workoutLogController.js";

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

router.get("/timetable/:timetableId/today", getTodayWorkoutLog);
router.patch("/timetable/:timetableId/today", updateWorkoutLogDraft);
router.post("/timetable/:timetableId/submit", finalizeWorkoutLog);
router.get("/timetable/:timetableId/analytics", getWorkoutLogAnalytics);
router.get("/timetable/:timetableId/history", getWorkoutLogHistory);

export default router;
