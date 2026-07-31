import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
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
