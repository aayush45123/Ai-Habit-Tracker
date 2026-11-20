import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdmin.js";
import { generateDataset } from "../controllers/datasetController.js";

const router = express.Router();

// Sensitive global dataset generation — strictly restricted to Administrators
router.get("/generate", authMiddleware, isAdmin, generateDataset);

export default router;
