import express from "express";
import { generateAITimetable } from "../controllers/aiTimetableController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateAITimetable);

export default router;
