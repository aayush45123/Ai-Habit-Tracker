import express from "express";
import {
  signup,
  login,
  me,
  verifyEmail,
  resendVerification,
  updateReminderPreferences,
  firebaseAuth,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Rate-limited credential endpoints
router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);

// Token refresh & session revocation
router.post("/refresh", refreshTokens);
router.post("/logout", logout);

// Password recovery with rate limiting & Zod validation
router.post("/forgot-password", passwordResetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", passwordResetLimiter, validate(resetPasswordSchema), resetPassword);

// OAuth / Firebase authentication (Google & Phone)
router.post("/firebase", authLimiter, firebaseAuth);
router.post("/google", authLimiter, firebaseAuth);
router.post("/phone", authLimiter, firebaseAuth);

// Email verification routes
router.get("/verify-email/:token", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);

router.get("/test", (req, res) => {
  res.send("Auth route working!");
});

// Logged-in user info
router.get("/me", auth, me);

// Update email reminder preferences
router.patch("/reminder-preferences", auth, updateReminderPreferences);

export default router;
