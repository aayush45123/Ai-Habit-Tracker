import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import cacheMiddleware from "../middleware/cache.middleware.js";
import { getUserDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireProfileCompleted);

// GET User Dashboard (Cached for 5 minutes / 300s)
router.get("/", cacheMiddleware("dashboard", 300), getUserDashboard);

export default router;
