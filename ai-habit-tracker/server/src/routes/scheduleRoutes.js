import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import {
  getEvents,
  getScheduleSummary,
  getMonthlyEventCounts,
  createEvent,
  updateEvent,
  toggleEventStatus,
  deleteEvent,
  cloneDaySchedule,
  applyPresetSchedule,
  getPresets,
} from "../controllers/scheduleController.js";

const router = express.Router();

// Require authenticated user
router.use(authMiddleware);
router.use(requireProfileCompleted);

// Preset list
router.get("/presets", getPresets);

// Daily summary & metrics (active task, upcoming, counts)
router.get("/summary", getScheduleSummary);

// Monthly event counts for calendar heatmap/indicators
router.get("/monthly-counts", getMonthlyEventCounts);

// Core CRUD
router.get("/", getEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.patch("/:id/status", toggleEventStatus);
router.delete("/:id", deleteEvent);

// Day utilities
router.post("/clone-day", cloneDaySchedule);
router.post("/apply-preset", applyPresetSchedule);

export default router;

