// server/src/controllers/habitController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import { deletePattern } from "../services/redis.service.js";
import {
  getTodayIST,
  normalizeDateIST,
  getYesterdayIST,
  getDaysAgoIST,
  areConsecutiveDays,
} from "../utils/getTodayIST.js";
import { generateProfile } from "../ai/profileGenerator.js";
import {
  emitDashboardUpdate,
  emitHabitUpdate,
  emitStreakUpdate,
  emitNotification,
} from "../services/socket.service.js";

const purgeUserDashboardCache = (user) => {
  if (!user) return;
  const uid = user._id ? user._id.toString() : user.toString();
  deletePattern(`dashboard:${uid}:*`).catch(() => {});
  deletePattern(`analytics:${uid}:*`).catch(() => {});
};

// ----------------------------------------------------
// RECALCULATE STREAKS (FIXED VERSION)
// This function is called after every habit log action
// ----------------------------------------------------
const recalculateStreaks = async (habitId) => {
  try {
    const todayISO = getTodayIST();
    const allLogs = await HabitLog.find({ habitId }).sort({ date: 1 });

    // Calculate LONGEST STREAK (all-time best)
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < allLogs.length; i++) {
      const log = allLogs[i];
      const logDateString =
        typeof log.date === "string"
          ? log.date
          : log.date.toISOString().split("T")[0];

      if (log.status === "done") {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevLog = allLogs[i - 1];
          const prevDateString =
            typeof prevLog.date === "string"
              ? prevLog.date
              : prevLog.date.toISOString().split("T")[0];

          if (
            areConsecutiveDays(prevDateString, logDateString) &&
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

    // Calculate CURRENT STREAK (must include today OR yesterday)
    let currentStreak = 0;

    // Find today's log
    const todayLog = allLogs.find((log) => {
      const logDateString =
        typeof log.date === "string"
          ? log.date
          : log.date.toISOString().split("T")[0];
      return logDateString === todayISO;
    });

    // Find yesterday's log
    const yesterdayISO = getYesterdayIST();
    const yesterdayLog = allLogs.find((log) => {
      const logDateString =
        typeof log.date === "string"
          ? log.date
          : log.date.toISOString().split("T")[0];
      return logDateString === yesterdayISO;
    });

    // CRITICAL FIX: Current streak logic
    // Case 1: Today is marked as "done" - count streak from today backwards
    if (todayLog && todayLog.status === "done") {
      currentStreak = 1;

      // Count backwards from yesterday
      for (let daysBack = 1; daysBack <= 365; daysBack++) {
        const checkDate = getDaysAgoIST(daysBack);

        const logForDate = allLogs.find((log) => {
          const logDateString =
            typeof log.date === "string"
              ? log.date
              : log.date.toISOString().split("T")[0];
          return logDateString === checkDate;
        });

        if (logForDate && logForDate.status === "done") {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    // Case 2: Today is NOT done, but yesterday was done - keep yesterday's streak
    else if (yesterdayLog && yesterdayLog.status === "done") {
      currentStreak = 1;

      // Count backwards from 2 days ago
      for (let daysBack = 2; daysBack <= 365; daysBack++) {
        const checkDate = getDaysAgoIST(daysBack);

        const logForDate = allLogs.find((log) => {
          const logDateString =
            typeof log.date === "string"
              ? log.date
              : log.date.toISOString().split("T")[0];
          return logDateString === checkDate;
        });

        if (logForDate && logForDate.status === "done") {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    // Case 3: Neither today nor yesterday is done - streak is BROKEN (0)
    else {
      currentStreak = 0;
    }

    return { currentStreak, longestStreak };
  } catch (err) {
    console.error("❌ Error recalculating streaks:", err);
    return { currentStreak: 0, longestStreak: 0 };
  }
};

// ----------------------------------------------------
// SCHEDULED CHECK: Reset streaks for missed habits
// This should be called daily (via cron job or on app load)
// ----------------------------------------------------
export const checkAndResetMissedStreaks = async () => {
  try {
    console.log("\nRunning daily streak check...");

    const todayISO = getTodayIST();
    const yesterdayISO = getYesterdayIST();

    // Get all habits
    const allHabits = await Habit.find({});

    console.log(`Checking ${allHabits.length} habits for missed streaks\n`);

    for (const habit of allHabits) {
      // Check if today is logged
      const todayLog = await HabitLog.findOne({
        habitId: habit._id,
        date: todayISO,
      });

      // Check if yesterday is logged
      const yesterdayLog = await HabitLog.findOne({
        habitId: habit._id,
        date: yesterdayISO,
      });

      // If neither today nor yesterday is done, reset streak to 0
      const todayDone = todayLog && todayLog.status === "done";
      const yesterdayDone = yesterdayLog && yesterdayLog.status === "done";

      if (!todayDone && !yesterdayDone && habit.streak > 0) {
        console.log(
          `❌ Resetting streak for "${habit.title}" (was ${habit.streak})`,
        );

        await Habit.findByIdAndUpdate(habit._id, {
          streak: 0,
          lastStatus: "missed",
        });

        await generateProfile(habit.userId);
      }
    }

    console.log("Daily streak check completed\n");
  } catch (err) {
    console.error("Error in daily streak check:", err);
  }
};

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

    purgeUserDashboardCache(req.user);

    // Emit real-time event
    const userId = req.user._id ? req.user._id.toString() : req.user.toString();
    emitDashboardUpdate(userId, { type: "habit:added", habit });
    emitNotification(userId, {
      type: "success",
      title: "Habit Created",
      message: `"${habit.title}" has been added to your habits!`,
    });

    res.status(201).json({ message: "Habit added", habit });
  } catch (error) {
    console.error("Error adding habit:", error);
    res.status(500).json({ message: "Error adding habit" });
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
    console.error("Error fetching habits:", error);
    res.status(500).json({ message: "Error fetching habits" });
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
    console.error("Error fetching habit:", error);
    res.status(500).json({ message: "Error fetching habit" });
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
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs" });
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
      { new: true },
    );

    if (!habit) return res.status(404).json({ message: "Habit not found" });

    purgeUserDashboardCache(req.user);

    res.json({ message: "Habit updated", habit });
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ message: "Error updating habit" });
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

    purgeUserDashboardCache(req.user);

    // Emit real-time event
    const userId = req.user._id ? req.user._id.toString() : req.user.toString();
    emitDashboardUpdate(userId, { type: "habit:deleted", habitId: req.params.id });

    res.json({ message: "Habit deleted" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ message: "Error deleting habit" });
  }
};

// ----------------------------------------------------
// LOG HABIT (DONE / MISSED) – ONE LOG PER DAY
// ✅ FIXED: Now properly resets streak when marking as "missed"
// ----------------------------------------------------
export const logHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    let { status } = req.body;

    if (status === "completed") {
      status = "done";
    }

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

    // Recalculate streaks
    const { currentStreak, longestStreak } = await recalculateStreaks(habitId);

    // Update habit with recalculated streaks
    await Habit.findByIdAndUpdate(habitId, {
      lastDate: todayISO,
      lastStatus: status,
      streak: currentStreak,
      longestStreak: longestStreak,
    });

    purgeUserDashboardCache(req.user);

    // Emit real-time socket events
    const userId = req.user._id ? req.user._id.toString() : req.user.toString();
    emitDashboardUpdate(userId, { type: "habit:logged", habitId, status, currentStreak, longestStreak });
    emitStreakUpdate(userId, { habitId, currentStreak, longestStreak });

    // Milestone notification — every 7-day streak multiple
    if (status === "done" && currentStreak > 0 && currentStreak % 7 === 0) {
      emitNotification(userId, {
        type: "milestone",
        title: `🔥 ${currentStreak}-Day Streak!`,
        message: `Amazing! You've maintained a ${currentStreak}-day streak!`,
      });
    }

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
// ✅ FIXED: Completion rate now based on days since start
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
      const key = getDaysAgoIST(i);
      weekly[key] = normalizedLogs.filter(
        (l) => l.status === "done" && l.date === key,
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
            dayCount[a] > dayCount[b] ? a : b,
          )
        : "N/A";

    // ----------------------------------------------------
    // WEEK-OVER-WEEK TREND
    // ----------------------------------------------------
    const getWeekDays = (offset) => {
      const arr = [];
      for (let i = 0; i < 7; i++) {
        arr.push(getDaysAgoIST(offset + i));
      }
      return arr;
    };

    const thisWeekDays = getWeekDays(0);
    const lastWeekDays = getWeekDays(7);

    const thisWeekDone = thisWeekDays.filter((d) =>
      normalizedLogs.some((l) => l.date === d && l.status === "done"),
    ).length;

    const lastWeekDone = lastWeekDays.filter((d) =>
      normalizedLogs.some((l) => l.date === d && l.status === "done"),
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
    let completedDays = new Set();
    let totalDaysWithLogs = 0;

    for (let i = 0; i < 30; i++) {
      const iso = getDaysAgoIST(29 - i);
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
    // HABIT SUCCESS RANKING (LEADERBOARD)
    // ✅ FIXED: Now calculates based on days since start, not total logs
    // ----------------------------------------------------
    // ----------------------------------------------------
    // HABIT SUCCESS RANKING (LEADERBOARD)
    // ✅ FIXED: startDate is a Mongo Date object, not a string.
    // Convert it to an IST "YYYY-MM-DD" string before building
    // a comparison Date, instead of doing `habit.startDate + "T00:00:00Z"`
    // (which string-coerces the Date object into garbage like
    // "Tue Jun 30 2026 00:00:00 GMT+0000 (UTC)T00:00:00Z" and parses
    // to Invalid Date, causing daysSinceStart to be NaN).
    // ----------------------------------------------------
    const leaderboard = [];
    const now = new Date();
    const todayIST = new Date(now.getTime() + 330 * 60000);
    const todayISO = todayIST.toISOString().split("T")[0];

    for (let habit of habits) {
      const hLogs = normalizedLogs.filter(
        (l) => l.habitId.toString() === habit._id.toString(),
      );

      const doneCount = hLogs.filter((l) => l.status === "done").length;

      // Normalize startDate (Date object OR createdAt fallback) into an
      // IST "YYYY-MM-DD" string, then rebuild a UTC-midnight Date from that
      // string for a clean day-diff calculation.
      const rawStart = habit.startDate || habit.createdAt;
      const startDateObj = new Date(rawStart);
      const startIST = new Date(startDateObj.getTime() + 330 * 60000);
      const startISO = startIST.toISOString().split("T")[0];

      const startDate = new Date(startISO + "T00:00:00Z");
      const todayDate = new Date(todayISO + "T00:00:00Z");

      const daysSinceStart =
        Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      let completionRate = 0;
      let expectedDays = 0;

      if (habit.frequency === "daily") {
        // For daily habits, expected days = days since start
        expectedDays = daysSinceStart;
        completionRate =
          daysSinceStart > 0
            ? Math.round((doneCount / daysSinceStart) * 100)
            : 0;
      } else if (habit.frequency === "weekly") {
        // For weekly habits, expected completions = weeks since start
        const weeksSinceStart = Math.ceil(daysSinceStart / 7);
        expectedDays = weeksSinceStart;
        completionRate =
          weeksSinceStart > 0
            ? Math.round((doneCount / weeksSinceStart) * 100)
            : 0;
      } else {
        // For other frequencies, use total logs
        completionRate =
          hLogs.length > 0 ? Math.round((doneCount / hLogs.length) * 100) : 0;
        expectedDays = hLogs.length;
      }

      leaderboard.push({
        habit: habit.title,
        completionRate: Math.min(completionRate, 100), // Cap at 100%
        totalLogs: hLogs.length,
        doneCount: doneCount,
        expectedDays: expectedDays,
        daysSinceStart: daysSinceStart,
      });
    }

    leaderboard.sort((a, b) => {
      if (b.completionRate === a.completionRate) {
        return b.doneCount - a.doneCount;
      }
      return b.completionRate - a.completionRate;
    });

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
    res.status(500).json({ message: "Analytics error" });
  }
};
