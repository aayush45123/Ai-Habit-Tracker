// server/src/controllers/habitController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import {
  getTodayIST,
  normalizeDateIST,
  getYesterdayIST,
} from "../utils/getTodayIST.js";

// ----------------------------------------------------
// ADD HABIT
// ----------------------------------------------------
export const addHabit = async (req, res) => {
  try {
    const { title, description, frequency } = req.body;

    const habit = await Habit.create({
      userId: req.user,
      title,
      description,
      frequency: frequency || "daily",
      startDate: getTodayIST(),
    });

    res.status(201).json({ message: "Habit added", habit });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding habit", error: error.message });
  }
};

// ----------------------------------------------------
// GET ALL HABITS
// ----------------------------------------------------
export const getAllHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user }).sort({
      createdAt: -1,
    });
    res.json({ habits });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching habits", error: error.message });
  }
};

// ----------------------------------------------------
// GET HABIT BY ID
// ----------------------------------------------------
export const getHabitById = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user });
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    res.json({ habit });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching habit", error: error.message });
  }
};

// ----------------------------------------------------
// GET HABIT LOGS
// ----------------------------------------------------
export const getHabitLogs = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user });
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    const logs = await HabitLog.find({ habitId: req.params.id }).sort({
      date: -1,
    });
    res.json({ habit, logs });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching logs", error: error.message });
  }
};

// ----------------------------------------------------
// UPDATE HABIT
// ----------------------------------------------------
export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      req.body,
      { new: true }
    );

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    res.json({ message: "Habit updated", habit });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating habit", error: error.message });
  }
};

// ----------------------------------------------------
// DELETE HABIT
// ----------------------------------------------------
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    await HabitLog.deleteMany({ habitId: req.params.id });

    res.json({ message: "Habit deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting habit", error: error.message });
  }
};

// ----------------------------------------------------
// LOG HABIT (DONE / MISSED) – ONE LOG PER DAY
// ----------------------------------------------------
export const logHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    const { status } = req.body;

    if (!["done", "missed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const todayISO = getTodayIST();

    // Check if already logged today
    const existingLog = await HabitLog.findOne({
      habitId,
      date: todayISO,
    });

    if (existingLog) {
      // Update existing log instead of creating duplicate
      existingLog.status = status;
      await existingLog.save();
    } else {
      // Create new log
      await HabitLog.create({
        habitId,
        date: todayISO,
        status,
      });
    }

    // ---------- RECALCULATE STREAK FROM SCRATCH ----------
    const allLogs = await HabitLog.find({ habitId }).sort({ date: 1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks
    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];
      const logDate = new Date(log.date + "T00:00:00Z");

      if (log.status === "done") {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevLog = allLogs[i - 1];
          const prevDate = new Date(prevLog.date + "T00:00:00Z");

          const diffDays = Math.round(
            (logDate - prevDate) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1 && prevLog.status === "done") {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Current streak = check if today and recent days are "done"
    const todayLog = allLogs[allLogs.length - 1];

    if (todayLog && todayLog.date === todayISO && todayLog.status === "done") {
      currentStreak = 1;
      for (let i = allLogs.length - 2; i >= 0; i--) {
        const currentLog = allLogs[i];
        const nextLog = allLogs[i + 1];

        const currentDate = new Date(currentLog.date + "T00:00:00Z");
        const nextDate = new Date(nextLog.date + "T00:00:00Z");

        const diffDays = Math.round(
          (nextDate - currentDate) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1 && currentLog.status === "done") {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    // Update habit with recalculated streaks
    await Habit.findByIdAndUpdate(habitId, {
      lastDate: todayISO,
      lastStatus: status,
      streak: currentStreak,
      longestStreak: longestStreak,
    });

    res.json({
      message: "Habit logged",
      currentStreak,
      longestStreak,
    });
  } catch (err) {
    console.error("Error in logHabit:", err);
    res.status(500).json({ message: "Error logging habit" });
  }
};

// ----------------------------------------------------
// ANALYTICS (WEEKLY, BEST DAY, CALENDAR COMPLETION)
// ----------------------------------------------------
export const getAnalytics = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user });
    const habitIds = habits.map((h) => h._id);
    const totalHabits = habits.length;

    if (totalHabits === 0) {
      return res.json({
        weekly: {},
        dayCount: {},
        bestDay: "N/A",
        weekChange: 0,
        dailyCompletion: {},
        consistencyScore: 0,
        leaderboard: [],
      });
    }

    const logs = await HabitLog.find({ habitId: { $in: habitIds } });

    // Normalize all dates to IST
    const normalizedLogs = logs.map((l) => ({
      ...l._doc,
      date: normalizeDateIST(l.date),
    }));

    // ----------------------------------------------------
    // WEEKLY TREND (LAST 7 DAYS)
    // ----------------------------------------------------
    const weekly = {};

    for (let i = 6; i >= 0; i--) {
      const now = new Date();
      const targetDate = new Date(now.getTime() + 330 * 60000);
      targetDate.setDate(targetDate.getDate() - i);
      const key = targetDate.toISOString().split("T")[0];

      weekly[key] = normalizedLogs.filter(
        (l) => l.status === "done" && l.date === key
      ).length;
    }

    const sortedWeekly = Object.keys(weekly)
      .sort((a, b) => new Date(a) - new Date(b))
      .reduce((acc, key) => ((acc[key] = weekly[key]), acc), {});

    // ----------------------------------------------------
    // DAY-WISE PERFORMANCE
    // ----------------------------------------------------
    const dayCount = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    normalizedLogs.forEach((l) => {
      if (l.status === "done") {
        const d = new Date(l.date + "T00:00:00Z");
        const istDate = new Date(d.getTime() + 330 * 60000);
        const wd = istDate.toLocaleDateString("en-US", { weekday: "long" });
        dayCount[wd]++;
      }
    });

    const bestDay =
      Object.keys(dayCount).length > 0
        ? Object.keys(dayCount).reduce((a, b) =>
            dayCount[a] > dayCount[b] ? a : b
          )
        : "N/A";

    // ----------------------------------------------------
    // WEEK-OVER-WEEK TREND
    // ----------------------------------------------------
    const getWeekDays = (offset) => {
      const arr = [];
      for (let i = 0; i < 7; i++) {
        const now = new Date();
        const d = new Date(now.getTime() + 330 * 60000);
        d.setDate(d.getDate() - (offset + i));
        arr.push(d.toISOString().split("T")[0]);
      }
      return arr;
    };

    const thisWeekDays = getWeekDays(0);
    const lastWeekDays = getWeekDays(7);

    const thisWeekDone = thisWeekDays.filter((d) =>
      normalizedLogs.some((l) => l.date === d && l.status === "done")
    ).length;

    const lastWeekDone = lastWeekDays.filter((d) =>
      normalizedLogs.some((l) => l.date === d && l.status === "done")
    ).length;

    const thisRate = Math.round((thisWeekDone / 7) * 100);
    const lastRate = Math.round((lastWeekDone / 7) * 100);
    const weekChange = thisRate - lastRate;

    // ----------------------------------------------------
    // DAILY COMPLETION FOR CALENDAR (PERCENTAGE)
    // ----------------------------------------------------
    const dailyCompletion = {};

    normalizedLogs.forEach((l) => {
      if (!dailyCompletion[l.date]) {
        dailyCompletion[l.date] = { done: new Set(), total: new Set() };
      }

      dailyCompletion[l.date].total.add(l.habitId.toString());

      if (l.status === "done") {
        dailyCompletion[l.date].done.add(l.habitId.toString());
      }
    });

    Object.keys(dailyCompletion).forEach((date) => {
      const doneCount = dailyCompletion[date].done.size;
      const totalCount = dailyCompletion[date].total.size;

      dailyCompletion[date] = Math.round((doneCount / totalCount) * 100);
    });

    // ----------------------------------------------------
    // CONSISTENCY SCORE – Last 30 days
    // ----------------------------------------------------
    const now = new Date();
    const last30 = new Date(now.getTime() + 330 * 60000);
    last30.setDate(last30.getDate() - 29);

    let completedDays = new Set();
    let totalDaysWithLogs = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(last30);
      d.setDate(last30.getDate() + i);
      const iso = d.toISOString().split("T")[0];

      const logsForDay = normalizedLogs.filter((l) => l.date === iso);

      if (logsForDay.length > 0) {
        totalDaysWithLogs++;
        if (logsForDay.some((l) => l.status === "done")) {
          completedDays.add(iso);
        }
      }
    }

    const consistencyScore =
      totalDaysWithLogs === 0
        ? 0
        : Math.round((completedDays.size / totalDaysWithLogs) * 100);

    // ----------------------------------------------------
    // HABIT SUCCESS RANKING (LEADERBOARD) - FIXED
    // ----------------------------------------------------
    const leaderboard = [];
    const todayIST = new Date(now.getTime() + 330 * 60000);
    const todayISO = todayIST.toISOString().split("T")[0];

    for (let habit of habits) {
      const hLogs = normalizedLogs.filter(
        (l) => l.habitId.toString() === habit._id.toString()
      );

      // Get habit start date
      const startDate = habit.startDate
        ? new Date(habit.startDate + "T00:00:00Z")
        : new Date(habit.createdAt);
      const startIST = new Date(startDate.getTime() + 330 * 60000);
      const today = new Date(todayISO + "T00:00:00Z");
      const todayIST_Date = new Date(today.getTime() + 330 * 60000);

      // Calculate total days since habit was created (up to today)
      const totalDaysSinceStart =
        Math.floor((todayIST_Date - startIST) / (1000 * 60 * 60 * 24)) + 1;

      // Count how many days were actually completed
      const doneCount = hLogs.filter((l) => l.status === "done").length;

      // Calculate completion rate based on expected days
      let completionRate = 0;
      let expectedDays = totalDaysSinceStart;

      if (totalDaysSinceStart > 0) {
        if (habit.frequency === "daily") {
          // For daily habits: done / total days since start
          completionRate = Math.round((doneCount / totalDaysSinceStart) * 100);
        } else if (habit.frequency === "weekly") {
          // For weekly habits: done / (weeks since start)
          expectedDays = Math.ceil(totalDaysSinceStart / 7);
          completionRate = Math.round((doneCount / expectedDays) * 100);
        } else {
          // Default: use actual logs if no frequency set
          const totalLogs = hLogs.length;
          completionRate =
            totalLogs > 0 ? Math.round((doneCount / totalLogs) * 100) : 0;
          expectedDays = totalLogs;
        }
      }

      leaderboard.push({
        habit: habit.title,
        completionRate: Math.min(completionRate, 100), // Cap at 100%
        totalLogs: hLogs.length,
        doneCount: doneCount,
        expectedDays: expectedDays,
      });
    }

    // Sort by completion rate (highest first)
    leaderboard.sort((a, b) => {
      if (b.completionRate === a.completionRate) {
        return b.doneCount - a.doneCount; // If same rate, sort by done count
      }
      return b.completionRate - a.completionRate;
    });

    // ----------------------------------------------------
    // RETURN ANALYTICS
    // ----------------------------------------------------
    return res.json({
      weekly: sortedWeekly,
      dayCount,
      bestDay,
      weekChange,
      dailyCompletion,
      consistencyScore,
      leaderboard,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Analytics error", error: error.message });
  }
};
