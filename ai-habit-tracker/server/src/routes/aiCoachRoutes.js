import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";

import { getCoachProfile } from "../controllers/aiCoachController.js";

const router = express.Router();

router.get("/profile", authMiddleware, requireProfileCompleted, getCoachProfile);

export default router;
