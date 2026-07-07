// server/src/routes/focusRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import {
  logFocus,
  getTodayCount,
  getStats,
} from "../controllers/focusController.js";

const router = express.Router();

router.use(auth);
router.use(requireProfileCompleted);

router.post("/log", logFocus); // log a completed or skipped session
router.get("/today", getTodayCount); // get today's count / minutes / skipped
router.get("/stats", getStats); // aggregated stats (days query param)

export default router;
