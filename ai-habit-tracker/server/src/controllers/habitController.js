// server/src/controllers/habitController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

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
      frequency,
      startDate: new Date(),
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
// ---------------- LOG HABIT (fixed streak system) ----------------
export const logHabit = async (req, res) => {
  try {
    const habitId = req.params.id;
    const { status } = req.body;

    const todayISO = new Date().toISOString().split("T")[0];

    // Upsert log for today
    const log = await HabitLog.findOneAndUpdate(
      { habitId, date: todayISO },
      { status },
      { upsert: true, new: true }
    );

    // ---------- STREAK FIX ----------
    let newStreak = 0;

    if (status === "done") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().split("T")[0];

      const yesterdayLog = await HabitLog.findOne({
        habitId,
        date: yesterdayISO,
        status: "done",
      });

      if (yesterdayLog) {
        // continue streak
        const habit = await Habit.findById(habitId);
        newStreak = (habit.streak || 0) + 1;
      } else {
        // start new streak
        newStreak = 1;
      }
    } else {
      newStreak = 0;
    }

    // update habit streak
    await Habit.findByIdAndUpdate(habitId, {
      lastDate: todayISO,
      lastStatus: status,
      streak: newStreak,
    });

    res.json({ message: "Habit logged", log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging habit" });
  }
};

// ----------------------------------------------------
// ANALYTICS (WEEKLY, BEST DAY, CALENDAR COMPLETION)
// ----------------------------------------------------
// ----------------------------------------------------
// ANALYTICS (WEEKLY, BEST DAY, CALENDAR COMPLETION)
// ----------------------------------------------------
export const getAnalytics = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user });
    const habitIds = habits.map((h) => h._id);
    const totalHabits = habits.length;

    const logs = await HabitLog.find({ habitId: { $in: habitIds } });

    // Normalize date → "YYYY-MM-DD"
    const normalizedLogs = logs.map((l) => ({
      ...l._doc,
      date: new Date(l.date.getTime() - l.date.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0],
    }));

    // ----------------------------------------------------
    // WEEKLY TREND (LAST 7 DAYS)
    // ----------------------------------------------------
    const today = new Date();
    const weekly = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const key = d.toISOString().split("T")[0];

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
        const wd = new Date(l.date).toLocaleDateString("en-IN", {
          weekday: "long",
        });
        dayCount[wd]++;
      }
    });

    const bestDay = Object.keys(dayCount).reduce((a, b) =>
      dayCount[a] > dayCount[b] ? a : b
    );

    // ----------------------------------------------------
    // WEEK-OVER-WEEK TREND (SMOOTHED)
    // ----------------------------------------------------
    const getWeekDays = (offset) => {
      const arr = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - (offset + i));
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

    let rawChange = thisRate - lastRate;

    // 🔥 smoothen drastic changes
    let weekChange = Math.round(rawChange * 0.7);

    // ----------------------------------------------------
    // DAILY COMPLETION FOR CALENDAR (PERCENTAGE)
    // ----------------------------------------------------
    const dailyCompletion = {};

    normalizedLogs.forEach((l) => {
      if (!dailyCompletion[l.date]) dailyCompletion[l.date] = new Set();

      if (l.status === "done")
        dailyCompletion[l.date].add(l.habitId.toString());
    });

    Object.keys(dailyCompletion).forEach((date) => {
      dailyCompletion[date] = Math.round(
        (dailyCompletion[date].size / totalHabits) * 100
      );
    });

    // ----------------------------------------------------
    // CONSISTENCY SCORE – Last 30 days
    // ----------------------------------------------------
    const last30 = new Date();
    last30.setDate(last30.getDate() - 29);

    let completedDays = new Set();
    let totalDays = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(last30);
      d.setDate(last30.getDate() + i);
      const iso = d.toISOString().split("T")[0];

      const logsForDay = normalizedLogs.filter((l) => l.date === iso);

      if (logsForDay.length > 0) {
        totalDays++;
        if (logsForDay.some((l) => l.status === "done")) {
          completedDays.add(iso);
        }
      }
    }

    const consistencyScore =
      totalDays === 0 ? 0 : Math.round((completedDays.size / totalDays) * 100);

    // ----------------------------------------------------
    // HABIT SUCCESS RANKING (LEADERBOARD)
    // ----------------------------------------------------
    const leaderboard = [];

    for (let habit of habits) {
      const hLogs = normalizedLogs.filter(
        (l) => l.habitId.toString() === habit._id.toString()
      );

      if (hLogs.length === 0) {
        leaderboard.push({
          habit: habit.title,
          completionRate: 0,
          totalLogs: 0,
        });
        continue;
      }

      const done = hLogs.filter((l) => l.status === "done").length;
      const rate = Math.round((done / hLogs.length) * 100);

      leaderboard.push({
        habit: habit.title,
        completionRate: rate,
        totalLogs: hLogs.length,
      });
    }

    // sort — highest success first
    leaderboard.sort((a, b) => b.completionRate - a.completionRate);

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
    res.status(500).json({ message: "Analytics error", error: error.message });
  }
};
