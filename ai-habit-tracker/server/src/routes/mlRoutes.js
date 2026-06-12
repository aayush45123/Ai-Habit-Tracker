import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { predictHabit } from "../controllers/mlController.js";

const router = express.Router();

router.post("/predict", authMiddleware, predictHabit);

export default router;

