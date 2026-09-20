import express from "express";
import { trackVisit } from "../controllers/visitorController.js";

const router = express.Router();

// Public endpoint to track page visits (guests & authenticated users)
router.post("/track", trackVisit);

export default router;
