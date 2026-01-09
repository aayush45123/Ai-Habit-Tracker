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
// HELPER: Check if two date strings are consecutive days
// ----------------------------------------------------
const areConsecutiveDays = (date1String, date2String) => {
  const date1 = new Date(date1String + "T00:00:00Z");
  const date2 = new Date(date2String + "T00:00:00Z");

  const diffMs = Math.abs(date2 - date1);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
};

// ----------------------------------------------------
// HELPER: Get date string for N days ago
// ----------------------------------------------------
const getDaysAgo = (n) => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 330 * 60000); // IST offset
  istDate.setDate(istDate.getDate() - n);
  return istDate.toISOString().split("T")[0];
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
      console.log(`Updated existing log for ${todayISO} to ${status}`);
    } else {
      // Create new log
      await HabitLog.create({
        habitId,
        date: todayISO,
        status,
      });
      console.log(`Created new log for ${todayISO} with status ${status}`);
    }

    // ---------- RECALCULATE STREAK PROPERLY ----------
    // IMPORTANT: Fetch all logs AFTER we've saved today's log
    const allLogs = await HabitLog.find({ habitId }).sort({ date: 1 });

    console.log(`Total logs found: ${allLogs.length}`);
    console.log(`Today's date: ${todayISO}`);

    let longestStreak = 0;

    // Calculate longest streak by going through all logs
    let tempStreak = 0;
    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];

      if (log.status === "done") {
        if (i === 0) {
          // First log ever
          tempStreak = 1;
        } else {
          const prevLog = allLogs[i - 1];

          // Check if consecutive days
          if (
            areConsecutiveDays(prevLog.date, log.date) &&
            prevLog.status === "done"
          ) {
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

    // Calculate CURRENT streak - must include today and work backwards
    let currentStreak = 0;

    // Find today's log in the fetched logs (should exist since we just created/updated it)
    const todayLog = allLogs.find((log) => {
      const logDateString =
        typeof log.date === "string"
          ? log.date
          : log.date.toISOString().split("T")[0];
      return logDateString === todayISO;
    });

    console.log(
      `Today's log found:`,
      todayLog ? `${todayLog.date} - ${todayLog.status}` : "NOT FOUND"
    );

    if (todayLog && todayLog.status === "done") {
      currentStreak = 1;
      console.log(`Starting streak count from today`);

      // Count backwards from today by checking each previous day
      let checkDate = getDaysAgo(1); // Yesterday

      for (let daysBack = 1; daysBack <= 365; daysBack++) {
        // Max 365 days back
        const logForDate = allLogs.find((log) => {
          const logDateString =
            typeof log.date === "string"
              ? log.date
              : log.date.toISOString().split("T")[0];
          return logDateString === checkDate;
        });

        if (logForDate && logForDate.status === "done") {
          currentStreak++;
          console.log(
            `Day ${daysBack} ago (${checkDate}): done ✓ - streak now ${currentStreak}`
          );
          checkDate = getDaysAgo(daysBack + 1); // Move to previous day
        } else {
          // Streak broken - either no log or status is "missed"
          console.log(
            `Day ${daysBack} ago (${checkDate}): ${
              logForDate ? "missed ✗" : "no log ○"
            } - streak ends`
          );
          break;
        }
      }
    } else {
      // Today is not done or is missed, so current streak is 0
      currentStreak = 0;
      console.log(
        `Current streak is 0 because today is ${
          todayLog ? todayLog.status : "not logged"
        }`
      );
    }

    console.log(
      `Final calculated streaks - Current: ${currentStreak}, Longest: ${longestStreak}`
    );

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
    res
      .status(500)
      .json({ message: "Error logging habit", error: err.message });
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
        completionRateTrend: {},
      });
    }

    const logs = await HabitLog.find({ habitId: { $in: habitIds } });

    // Normalize all dates to IST
    const normalizedLogs = logs.map((l) => ({
      ...l._doc,
      date: normalizeDateIST(l.date),
    }));

    const now = new Date();

    // ----------------------------------------------------
    // WEEKLY TREND (LAST 7 DAYS)
    // ----------------------------------------------------
    const weekly = {};

    for (let i = 6; i >= 0; i--) {
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
    // COMPLETION RATE TREND (LAST 30 DAYS)
    // ----------------------------------------------------
    const completionRateTrend = {};

    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date(now.getTime() + 330 * 60000);
      targetDate.setDate(targetDate.getDate() - i);
      const dateKey = targetDate.toISOString().split("T")[0];

      // Count logs for this date
      const logsForDate = normalizedLogs.filter((l) => l.date === dateKey);
      const doneForDate = logsForDate.filter((l) => l.status === "done").length;

      // Calculate completion rate for the day
      if (logsForDate.length > 0) {
        completionRateTrend[dateKey] = Math.round(
          (doneForDate / logsForDate.length) * 100
        );
      } else {
        completionRateTrend[dateKey] = 0;
      }
    }

    // Sort by date
    const sortedCompletionTrend = Object.keys(completionRateTrend)
      .sort((a, b) => new Date(a) - new Date(b))
      .reduce((acc, key) => ((acc[key] = completionRateTrend[key]), acc), {});

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
      completionRateTrend: sortedCompletionTrend,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Analytics error", error: error.message });
  }
};
