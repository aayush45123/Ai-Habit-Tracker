import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { generateDataset } from "../controllers/datasetController.js";

const router = express.Router();

router.get("/generate", authMiddleware, generateDataset);

export default router;
