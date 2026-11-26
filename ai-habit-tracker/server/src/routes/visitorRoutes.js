import express from "express";
import { z } from "zod";
import { trackVisit } from "../controllers/visitorController.js";
import validate from "../middleware/validate.middleware.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const visitorLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many visitor tracking requests.",
  keyPrefix: "visitor",
});

const trackVisitSchema = z.object({
  visitorId: z.string().trim().max(120).optional(),
  path: z.string().trim().max(300).optional(),
  referrer: z.string().trim().max(500).optional(),
});

// Public endpoint to track page visits (guests & authenticated users)
router.post("/track", visitorLimiter, validate(trackVisitSchema), trackVisit);

export default router;
