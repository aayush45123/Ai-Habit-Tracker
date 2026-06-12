import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import { getCoachProfile } from "../controllers/aiCoachController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getCoachProfile);

export default router;
