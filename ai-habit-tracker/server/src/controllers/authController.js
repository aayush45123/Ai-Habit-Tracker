import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/email.service.js";

// Helper: Get base client URL
const getClientUrl = () => {
  return process.env.CLIENT_URL || "https://ai-habit-tracker-eb72.vercel.app";
};

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    // If user already exists and is verified, reject duplicate signup
    if (existingUser && existingUser.isEmailVerified !== false) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Never allow admin self-promotion via public signup endpoint
    const assignedRole = "user";
    const isAdmin = false;

    // Generate secure 32-byte verification token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let user;
    if (existingUser && existingUser.isEmailVerified === false) {
      // Update existing unverified account
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.emailVerificationToken = hashedToken;
      existingUser.emailVerificationExpires = tokenExpires;
      user = await existingUser.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        isAdmin,
        profileImage: "",
        isActive: true,
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: tokenExpires,
      });
    }

    // Send verification email — fire & forget (do NOT await, avoids blocking the response)
    const verificationUrl = `${getClientUrl()}/verify-email?token=${rawToken}`;
    sendVerificationEmail(user, verificationUrl).catch((err) =>
      console.error("[Signup] Failed to send verification email:", err.message)
    );

    // Respond immediately — no need to wait for email delivery
    return res.status(201).json({
      message: "Account created! Please check your email to verify your account before logging in.",
      requireVerification: true,
      email: user.email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ---------------- VERIFY EMAIL ----------------
export const verifyEmail = async (req, res) => {
  try {
    const token = req.params.token || req.query.token || req.body.token;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link. Please request a new verification link.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully! You can now log in to HabitAI.",
      email: user.email,
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Server error verifying email" });
  }
};

// ---------------- RESEND VERIFICATION EMAIL ----------------
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "This email is already verified. You can log in directly." });
    }

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    const verificationUrl = `${getClientUrl()}/verify-email?token=${rawToken}`;
    // Fire & forget — respond immediately
    sendVerificationEmail(user, verificationUrl).catch((err) =>
      console.error("[Resend] Failed to send verification email:", err.message)
    );

    return res.json({
      message: "A new verification link has been sent to your email. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error resending verification" });
  }
};

// ---------------- USER INFO ----------------
export const me = async (req, res) => {
  const user = req.user;

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || (user.isAdmin ? "admin" : "user"),
    isAdmin: user.isAdmin === true || user.role === "admin",
    profileImage: user.profileImage || "",
    isActive: user.isActive !== false,
    isEmailVerified: user.isEmailVerified !== false,
    emailNotifications: user.emailNotifications ?? true,
    isReminderEnabled: user.isReminderEnabled ?? true,
    dailyReminderTime: user.dailyReminderTime || "20:00",
  });
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled. Please contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ── Check if email is verified ──
    if (user.isEmailVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before logging in. We have sent a verification link to your inbox.",
        requireVerification: true,
        email: user.email,
      });
    }

    const userRole = user.role || (user.isAdmin ? "admin" : "user");

    const token = jwt.sign(
      { userId: user._id, role: userRole, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        isAdmin: user.isAdmin === true || userRole === "admin",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ---------------- UPDATE REMINDER PREFERENCES ----------------
export const updateReminderPreferences = async (req, res) => {
  try {
    const { emailNotifications, isReminderEnabled, dailyReminderTime } = req.body;

    const updates = {};
    if (typeof emailNotifications === "boolean")
      updates.emailNotifications = emailNotifications;
    if (typeof isReminderEnabled === "boolean")
      updates.isReminderEnabled = isReminderEnabled;
    if (dailyReminderTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(dailyReminderTime))
      updates.dailyReminderTime = dailyReminderTime;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select("-password");

    res.json({ message: "Reminder preferences updated", user });
  } catch (err) {
    console.error("Update reminder preferences error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
