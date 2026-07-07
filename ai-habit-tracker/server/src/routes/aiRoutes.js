import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import { getAIInsights } from "../controllers/aiController.js";

const router = express.Router();

router.get("/insights", authMiddleware, requireProfileCompleted, getAIInsights);

export default router;
