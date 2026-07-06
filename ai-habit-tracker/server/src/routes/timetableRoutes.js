// server/src/routes/timetableRoutes.js
import express from "express";
import {
  createTimetable,
  getActiveTimetable,
  getTodaysWorkoutPlan,
  updateTimetable,
  deleteTimetable,
  getTimetableHistory,
  getAIImprovements,
} from "../controllers/timetableController.js";
import {
  finalizeWorkoutLog,
  getTodayWorkoutLog,
  getWorkoutLogAnalytics,
  getWorkoutLogHistory,
  updateWorkoutLogDraft,
} from "../controllers/workoutLogController.js";
import protect from "../middleware/authMiddleware.js"; // ✅ FIXED: Removed curly braces

const router = express.Router();

// All routes are protected
router.use(protect);

// Create new timetable manually
router.post("/create", createTimetable);

// Get AI improvement suggestions
router.post("/:id/ai-improve", getAIImprovements);

// Get active timetable
router.get("/active", getActiveTimetable);

// Get today's workout specifically
router.get("/today", getTodaysWorkoutPlan);

// Workout log routes kept on the timetable router for compatibility
router.get("/:id/workout-log/today", getTodayWorkoutLog);
router.patch("/:id/workout-log/today", updateWorkoutLogDraft);
router.post("/:id/workout-log/submit", finalizeWorkoutLog);
router.get("/:id/workout-log/analytics", getWorkoutLogAnalytics);
router.get("/:id/workout-log/history", getWorkoutLogHistory);

// Get timetable history
router.get("/history", getTimetableHistory);

// Update timetable
router.put("/:id", updateTimetable);

// Delete timetable
router.delete("/:id", deleteTimetable);

export default router;
