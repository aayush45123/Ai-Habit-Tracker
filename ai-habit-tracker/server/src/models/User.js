import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "phone"],
      default: "local",
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    // Email reminder preferences
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    isReminderEnabled: {
      type: Boolean,
      default: true,
    },
    dailyReminderTime: {
      type: String,
      default: "20:00", // 8 PM IST
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
