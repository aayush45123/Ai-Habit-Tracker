import express from "express";
import { generateAITimetable } from "../controllers/aiTimetableController.js";
import protect from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";

const router = express.Router();

router.post("/generate", protect, requireProfileCompleted, generateAITimetable);

export default router;
