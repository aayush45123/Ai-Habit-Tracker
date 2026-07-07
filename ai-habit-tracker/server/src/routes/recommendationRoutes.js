import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
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

router.use(authMiddleware);
router.use(requireProfileCompleted);

// Recommendation endpoints
router.get("/recommendations", getRecommendations);
router.get("/recommendation-details", getRecommendationDetails);

// Model training endpoints (admin only)
router.post("/retrain", isAdmin, retrainModel);
router.get("/training-status", isAdmin, getTrainingStatus);

export default router;
