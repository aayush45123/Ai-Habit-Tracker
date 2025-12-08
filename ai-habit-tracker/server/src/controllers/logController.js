import HabitLog from "../models/HabitLog.js";
import Habit from "../models/Habit.js";

// MARK HABIT DONE OR MISSED
export const logHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    const { status } = req.body; // "done" or "missed"

    if (!["done", "missed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check if habit exists
    const habit = await Habit.findById(habitId);
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    // Check if already logged today
    const today = new Date().toISOString().split("T")[0];

    const existingLog = await HabitLog.findOne({
      habitId,
      date: today,
    });

    if (existingLog) {
      return res
        .status(400)
        .json({ message: "Habit already logged for today" });
    }

    const newLog = await HabitLog.create({
      habitId,
      date: today,
      status,
    });

    res.status(201).json({ message: "Habit logged", log: newLog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET ALL LOGS FOR A HABIT
export const getHabitLogs = async (req, res) => {
  try {
    const logs = await HabitLog.find({ habitId: req.params.id });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getHabitAnalytics = async (req, res) => {
  try {
    const habitId = req.params.id;

    const logs = await HabitLog.find({ habitId }).sort({ date: 1 });

    if (logs.length === 0) {
      return res.status(200).json({
        streak: 0,
        longestStreak: 0,
        completionRate: 0,
        totalLogs: 0,
      });
    }

    let currentStreak = 0;
    let longestStreak = 0;

    let prevDate = null;
    let completedCount = 0;

    logs.forEach((log) => {
      const logDate = new Date(log.date);

      // Count completion rate
      if (log.status === "done") completedCount++;

      // Streak logic
      if (log.status === "done") {
        if (prevDate) {
          const diff = (logDate - prevDate) / (1000 * 60 * 60 * 24); // difference in days

          if (diff === 1) {
            currentStreak++;
          } else {
            currentStreak = 1; // reset streak
          }
        } else {
          currentStreak = 1;
        }

        longestStreak = Math.max(longestStreak, currentStreak);
      }

      prevDate = logDate;
    });

    // Percentage completed
    const completionRate = Math.round((completedCount / logs.length) * 100);

    return res.status(200).json({
      streak: currentStreak,
      longestStreak,
      completionRate,
      totalLogs: logs.length,
    });
  } catch (err) {
    return res.status(500).json({ message: "Analytics error", err });
  }
};
