// server/src/routes/timetableRoutes.js
import express from "express";
import {
  generateTimetable,
  getActiveTimetable,
  getTodaysWorkoutPlan,
  updateTimetable,
  deleteTimetable,
  getTimetableHistory,
  regenerateTimetable,
} from "../controllers/timetableController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Generate new AI-powered timetable
router.post("/generate", generateTimetable);

// Get active timetable
router.get("/active", getActiveTimetable);

// Get today's workout specifically
router.get("/today", getTodaysWorkoutPlan);

// Get timetable history
router.get("/history", getTimetableHistory);

// Update timetable
router.put("/:id", updateTimetable);

// Regenerate timetable with new AI suggestions
router.post("/:id/regenerate", regenerateTimetable);

// Delete timetable
router.delete("/:id", deleteTimetable);

export default router;