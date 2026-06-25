import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getRiskAnalysis } from "../controllers/riskAnalysisController.js";

const router = express.Router();

router.get("/risk-analysis", authMiddleware, getRiskAnalysis);

export default router;
