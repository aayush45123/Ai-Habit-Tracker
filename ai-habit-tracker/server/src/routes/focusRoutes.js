// server/src/routes/focusRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  logFocus,
  getTodayCount,
  getStats,
} from "../controllers/focusController.js";

const router = express.Router();

router.post("/log", auth, logFocus); // log a completed focus session
router.get("/today", auth, getTodayCount); // get today's count / minutes
router.get("/stats", auth, getStats); // aggregated stats (days query param)

export default router;
