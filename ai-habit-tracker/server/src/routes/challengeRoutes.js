import express from "express";
import {
  startChallenge,
  getCurrentChallenge,
  updateChallenge,
  markHabitDone,
} from "../controllers/challengeController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", auth, startChallenge);
router.get("/current", auth, getCurrentChallenge);
router.put("/update/:id", auth, updateChallenge);
router.post("/done/:id/:index", auth, markHabitDone);

export default router;
