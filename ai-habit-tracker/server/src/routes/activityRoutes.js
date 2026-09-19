import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  sendHeartbeat,
  logoutSession,
  initSession,
} from "../controllers/activityController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/heartbeat", sendHeartbeat);
router.post("/session/logout", logoutSession);
router.post("/session/init", initSession);

export default router;
