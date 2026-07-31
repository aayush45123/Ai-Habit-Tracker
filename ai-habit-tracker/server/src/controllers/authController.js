import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === "admin" ? "admin" : "user";
    const isAdmin = assignedRole === "admin";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      isAdmin,
      profileImage: "",
      isActive: true,
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    emailNotifications: user.emailNotifications ?? true,
    isReminderEnabled: user.isReminderEnabled ?? true,
    dailyReminderTime: user.dailyReminderTime || "20:00",
  });
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled. Please contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

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
    res.status(500).json({ message: "Server error", error: error.message });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
