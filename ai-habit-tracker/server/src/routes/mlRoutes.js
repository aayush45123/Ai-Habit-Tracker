import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getRiskAnalysis } from "../controllers/riskAnalysisController.js";
import { predictHabit } from "../controllers/mlController.js";

const router = express.Router();

router.post("/predict", authMiddleware, predictHabit);

router.get("/risk-analysis", authMiddleware, getRiskAnalysis);

export default router;
