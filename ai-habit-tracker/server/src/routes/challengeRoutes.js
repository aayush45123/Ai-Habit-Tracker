// server/src/routes/challengeRoutes.js (ENHANCED)
import express from "express";
import {
  startChallenge,
  restartChallenge, // ✅ NEW
  getCurrentChallenge,
  updateChallenge,
  markHabitDone,
  getChallengeHeatmap,
  getChallengeHistory,
  deleteChallenge,
} from "../controllers/challengeController.js";
import auth from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";

const router = express.Router();

router.use(auth);
router.use(requireProfileCompleted);

router.post("/start", startChallenge);
router.post("/restart", restartChallenge); // ✅ NEW: Restart challenge
router.get("/current", getCurrentChallenge);
router.put("/update/:id", updateChallenge);
router.post("/done/:id/:index", markHabitDone);
router.get("/heatmap", getChallengeHeatmap);
router.get("/history", getChallengeHistory);
router.delete("/:id", deleteChallenge);

export default router;
