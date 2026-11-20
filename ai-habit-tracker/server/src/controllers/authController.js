import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";
import { createSession, recordActivityEvent } from "../services/activity.service.js";
import { verifyFirebaseIdToken } from "../services/firebaseAuth.service.js";

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// Helper: Get base client URL
const getClientUrl = () => {
  return process.env.CLIENT_URL || "https://ai-habit-tracker-eb72.vercel.app";
};

// Helper: Secure cookie configuration
const getCookieOptions = (maxAgeMs = 30 * 24 * 60 * 60 * 1000) => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "lax" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
};

// Helper: Generate Token Pair
const generateTokenPair = async ({ user, req, familyId = null }) => {
  const userRole = user.role || (user.isAdmin ? "admin" : "user");

  // 1. Short-Lived Access Token (15 mins)
  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: userRole,
      email: user.email || user.phoneNumber,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // 2. Cryptographically Secure Refresh Token (30 days)
  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const currentFamily = familyId || crypto.randomUUID();

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    familyId: currentFamily,
    isRevoked: false,
    expiresAt,
    userAgent: req?.headers["user-agent"] || "",
    ipAddress: req?.ip || req?.socket?.remoteAddress || "",
  });

  return { accessToken, refreshToken: rawRefreshToken, familyId: currentFamily };
};

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    // If user already exists and is verified, reject duplicate signup
    if (existingUser && existingUser.isEmailVerified !== false) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hardened password hashing (12 rounds)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const assignedRole = "user";
    const isAdmin = false;

    // Generate secure 32-byte verification token (SHA-256 hashed in database)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let user;
    if (existingUser && existingUser.isEmailVerified === false) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.emailVerificationToken = hashedToken;
      existingUser.emailVerificationExpires = tokenExpires;
      user = await existingUser.save();
    } else {
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

    // Send verification email asynchronously
    const verificationUrl = `${getClientUrl()}/verify-email?token=${rawToken}`;
    sendVerificationEmail(user, verificationUrl).catch((err) =>
      console.error("[Signup] Failed to send verification email:", err.message)
    );

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

    // Enumeration-safe generic response
    if (!user || user.isEmailVerified) {
      return res.json({
        message: "If an unverified account exists with this email, a verification link has been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationUrl = `${getClientUrl()}/verify-email?token=${rawToken}`;
    sendVerificationEmail(user, verificationUrl).catch((err) =>
      console.error("[Resend] Failed to send verification email:", err.message)
    );

    return res.json({
      message: "If an unverified account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error resending verification" });
  }
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

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before logging in. We have sent a verification link to your inbox.",
        requireVerification: true,
        email: user.email,
      });
    }

    // Generate short-lived access token + rotating refresh token
    const { accessToken, refreshToken } = await generateTokenPair({ user, req });
    const { sessionId } = await createSession({ userId: user._id, req });

    // Set secure HttpOnly cookies
    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

    const userRole = user.role || (user.isAdmin ? "admin" : "user");

    res.json({
      message: "Login successful",
      token: accessToken, // Backward compatibility for Bearer auth
      refreshToken,
      sessionId,
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

// ---------------- REFRESH TOKEN (ROTATION & REUSE DETECTION) ----------------
export const refreshTokens = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(storedToken.userId);
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "User account inactive or not found" });
    }

    // ── AUTOMATIC REUSE DETECTION ──
    // If a revoked refresh token is presented, someone may have compromised the family!
    if (storedToken.isRevoked) {
      console.warn(`[Security Alert] Refresh token reuse detected for user ${user._id}! Revoking all sessions.`);
      await RefreshToken.updateMany({ familyId: storedToken.familyId }, { isRevoked: true });
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Security breach detected: session invalidated. Please log in again." });
    }

    // Check expiration
    if (new Date() > storedToken.expiresAt) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Invalidate current refresh token (single use)
    storedToken.isRevoked = true;
    await storedToken.save();

    // Issue new pair under the same family
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair({
      user,
      req,
      familyId: storedToken.familyId,
    });

    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", newRefreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

    return res.json({
      message: "Tokens refreshed successfully",
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

// ---------------- LOGOUT & TOKEN REVOCATION ----------------
export const logout = async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawRefreshToken) {
      const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
      await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
    }

    // If authenticated, also invalidate tokens by family
    if (req.user?._id) {
      await RefreshToken.updateMany({ userId: req.user._id }, { isRevoked: true });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond with the same message to prevent email enumeration
    const genericResponse = {
      message: "If an account exists with that email, a password reset link has been dispatched.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate cryptographically secure 32-byte reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Single-use, valid for 15 minutes
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail(user, resetUrl).catch((err) =>
      console.error("[ForgotPassword] Failed to send reset email:", err.message)
    );

    return res.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error processing password reset" });
  }
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset link. Please request a new one.",
      });
    }

    // Update password with 12 salt rounds
    user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Invalidate all existing sessions / access tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

// ---------------- USER INFO ----------------
export const me = async (req, res) => {
  const user = req.user;

  res.json({
    id: user._id,
    name: user.name,
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    authProvider: user.authProvider || "local",
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

// ---------------- FIREBASE AUTH (GOOGLE & PHONE NUMBER) ----------------
export const firebaseAuth = async (req, res) => {
  try {
    const { idToken, name: customName } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    const { uid, email, phoneNumber, name, picture, signInProvider } = decoded;

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Firebase user profile has neither email nor phone number" });
    }

    let user = null;
    const isGoogle = (signInProvider && signInProvider.includes("google")) || (email && !phoneNumber);

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      user = await User.findOne({
        $or: [{ email: normalizedEmail }, { googleId: uid }],
      });

      if (user) {
        if (!user.googleId && isGoogle) user.googleId = uid;
        if (!user.profileImage && picture) user.profileImage = picture;
        user.isEmailVerified = true;
        if (phoneNumber && !user.phoneNumber) user.phoneNumber = phoneNumber;
        await user.save();
      } else {
        user = await User.create({
          name: customName || name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          googleId: isGoogle ? uid : undefined,
          phoneNumber: phoneNumber || undefined,
          profileImage: picture || "",
          authProvider: isGoogle ? "google" : "local",
          isEmailVerified: true,
          role: "user",
          isAdmin: false,
          isActive: true,
        });
      }
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber });

      if (user) {
        user.isEmailVerified = true;
        if (customName && (!user.name || user.name.startsWith("User "))) {
          user.name = customName;
        }
        await user.save();
      } else {
        user = await User.create({
          name: customName || name || `User ${phoneNumber.slice(-4)}`,
          phoneNumber,
          authProvider: "phone",
          isEmailVerified: true,
          role: "user",
          isAdmin: false,
          isActive: true,
        });
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Failed to authenticate user" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled. Please contact administrator." });
    }

    const { accessToken, refreshToken } = await generateTokenPair({ user, req });
    const { sessionId } = await createSession({ userId: user._id, req });

    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

    const userRole = user.role || (user.isAdmin ? "admin" : "user");

    return res.json({
      message: "Authentication successful",
      token: accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        authProvider: user.authProvider || (isGoogle ? "google" : "phone"),
        role: userRole,
        isAdmin: user.isAdmin === true || userRole === "admin",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Firebase auth controller error:", error);
    return res.status(500).json({ message: error.message || "Authentication failed" });
  }
};
