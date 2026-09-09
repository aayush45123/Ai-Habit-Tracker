// server/src/routes/gamificationRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getOverview,
  getAchievements,
  getChallenges,
  joinChallenge,
  generateAIChallenges,
  getRewards,
  redeemReward,
  getXPHistory,
} from "../controllers/gamificationController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/overview", getOverview);
router.get("/achievements", getAchievements);
router.get("/challenges", getChallenges);
router.post("/challenges/:id/join", joinChallenge);
router.post("/challenges/ai-generate", generateAIChallenges);
router.get("/rewards", getRewards);
router.post("/rewards/:key/redeem", redeemReward);
router.get("/history", getXPHistory);

export default router;
