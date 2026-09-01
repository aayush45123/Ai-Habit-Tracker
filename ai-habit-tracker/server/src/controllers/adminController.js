import User from "../models/User.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import Challenge from "../models/Challenge.js";
import HabitTemplate from "../models/HabitTemplate.js";

/**
 * Get Admin Dashboard Metrics
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHabits = await User.db.collection("habits").countDocuments().catch(() => Habit.countDocuments());
    const challengesCompleted = await Challenge.countDocuments({ isCompleted: true }).catch(() => 0);

    // Calculate today's active users (logged habit within last 24h)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeUserIds = await HabitLog.distinct("userId", {
      createdAt: { $gte: today },
    }).catch(() => []);

    const todaysActiveUsers = activeUserIds.length;

    // Top performing users by streak / habits completed
    const topPerformingUsers = await Habit.aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: "$userId",
          totalHabits: { $sum: 1 },
          maxStreak: { $max: "$streak" },
          avgStreak: { $avg: "$streak" },
        },
      },
      { $sort: { maxStreak: -1, totalHabits: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          name: "$userInfo.name",
          email: "$userInfo.email",
          maxStreak: 1,
          totalHabits: 1,
        },
      },
    ]).catch(() => []);

    res.json({
      totalUsers,
      todaysActiveUsers,
      totalHabits,
      challengesCompleted,
      topPerformingUsers,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard" });
  }
};

/**
 * List all users with pagination and role filter
 */
export const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Admin getUsers error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * Update user role or account status
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && ["user", "admin"].includes(role)) {
      user.role = role;
      user.isAdmin = role === "admin";
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Admin updateUserRole error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

/**
 * Delete User
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clean up all user data to prevent orphaned documents
    const userHabits = await Habit.find({ userId: id }).select("_id");
    const habitIds = userHabits.map((h) => h._id);
    await HabitLog.deleteMany({ habitId: { $in: habitIds } });
    await Habit.deleteMany({ userId: id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin deleteUser error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

/**
 * Habit Templates Management (Admin)
 */
export const createTemplate = async (req, res) => {
  try {
    const { title, description, category, recommendedTime, difficulty } = req.body;
    const template = await HabitTemplate.create({
      title,
      description,
      category,
      recommendedTime,
      difficulty,
    });

    res.status(201).json({ message: "Template created successfully", template });
  } catch (error) {
    console.error("Admin createTemplate error:", error);
    res.status(500).json({ message: "Failed to create template" });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await HabitTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Admin deleteTemplate error:", error);
    res.status(500).json({ message: "Failed to delete template" });
  }
};
