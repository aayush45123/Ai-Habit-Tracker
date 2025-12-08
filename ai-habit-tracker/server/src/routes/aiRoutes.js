import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAIInsights } from "../controllers/aiController.js";

const router = express.Router();

router.get("/insights", authMiddleware, getAIInsights);

export default router;
