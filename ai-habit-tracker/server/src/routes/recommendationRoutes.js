import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getRecommendations,
  getRecommendationDetails,
} from "../controllers/recommendationController.js";
import {
  retrainModel,
  getTrainingStatus,
} from "../controllers/modelRetrainController.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

// Recommendation endpoints
router.get("/recommendations", authMiddleware, getRecommendations);
router.get("/recommendation-details", authMiddleware, getRecommendationDetails);

// Model training endpoints (admin only)
router.post("/retrain", authMiddleware, isAdmin, retrainModel);
router.get("/training-status", authMiddleware, isAdmin, getTrainingStatus);

export default router;
