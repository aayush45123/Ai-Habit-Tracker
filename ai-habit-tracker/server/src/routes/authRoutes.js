import express from "express";
import { signup, login, me, updateReminderPreferences } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.middleware.js";
import { signupSchema, loginSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);

router.get("/test", (req, res) => {
  res.send("Auth route working!");
});

// Logged-in user info
router.get("/me", auth, me);

// Update email reminder preferences
router.patch("/reminder-preferences", auth, updateReminderPreferences);

export default router;
