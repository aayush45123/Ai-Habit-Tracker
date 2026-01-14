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

const router = express.Router();

router.post("/start", auth, startChallenge);
router.post("/restart", auth, restartChallenge); // ✅ NEW: Restart challenge
router.get("/current", auth, getCurrentChallenge);
router.put("/update/:id", auth, updateChallenge);
router.post("/done/:id/:index", auth, markHabitDone);
router.get("/heatmap", auth, getChallengeHeatmap);
router.get("/history", auth, getChallengeHistory);
router.delete("/:id", auth, deleteChallenge);

export default router;
