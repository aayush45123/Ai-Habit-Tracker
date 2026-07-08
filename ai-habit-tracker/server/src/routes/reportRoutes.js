// server/src/routes/reportRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import { getReport } from "../controllers/reportController.js";

const router = express.Router();

// Apply authentication and profile completion checks
router.use(authMiddleware);
router.use(requireProfileCompleted);

router.get("/weekly", (req, res) => getReport(req, res, "week"));
router.get("/monthly", (req, res) => getReport(req, res, "month"));

export default router;
