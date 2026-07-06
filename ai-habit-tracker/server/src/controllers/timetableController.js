// server/src/controllers/timetableController.js
import Timetable from "../models/Timetable.js";
import {
  generateImprovementSuggestions,
  getTodaysWorkout,
} from "../services/groqService.js";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const IST_OFFSET_MINUTES = 330;

function toISTDateString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return istDate.toISOString().split("T")[0];
}

function getISTDayName(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return istDate.toLocaleDateString("en-US", { weekday: "long" });
}

function normalizeCheckpointDate(value) {
  if (!value) {
    return toISTDateString();
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return toISTDateString(value);
}

function buildCheckpointAnalytics(timetable) {
  const checkpoints = [...(timetable.checkpoints || [])].sort((a, b) => {
    const left = new Date(a.recordedAt || a.date).getTime();
    const right = new Date(b.recordedAt || b.date).getTime();
    return left - right;
  });

  const totalCheckpoints = checkpoints.length;
  const correctCount = checkpoints.filter(
    (item) => item.status === "correct",
  ).length;
  const missedCount = checkpoints.filter(
    (item) => item.status === "missed",
  ).length;
  const adherenceRate =
    totalCheckpoints > 0
      ? Math.round((correctCount / totalCheckpoints) * 100)
      : 0;

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  checkpoints.forEach((checkpoint) => {
    if (checkpoint.status === "correct") {
      streak += 1;
      currentStreak = streak;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  });

  const today = toISTDateString();
  const recentTrend = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = toISTDateString(
      new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    );
    const dayCheckpoints = checkpoints.filter(
      (checkpoint) => checkpoint.date === date,
    );
    const dayCorrect = dayCheckpoints.filter(
      (checkpoint) => checkpoint.status === "correct",
    ).length;
    const dayMissed = dayCheckpoints.filter(
      (checkpoint) => checkpoint.status === "missed",
    ).length;
    const totalForDay = dayCheckpoints.length;

    recentTrend.push({
      date,
      label: date === today ? "Today" : date,
      correct: dayCorrect,
      missed: dayMissed,
      total: totalForDay,
      rate: totalForDay > 0 ? Math.round((dayCorrect / totalForDay) * 100) : 0,
    });
  }

  const weekdayMap = WEEKDAYS.reduce((acc, day) => {
    acc[day] = { correct: 0, missed: 0 };
    return acc;
  }, {});

  const focusMap = {};
  const scheduleFocusMap = (timetable.weeklySchedule || []).reduce(
    (acc, day) => {
      acc[day.day] = day.focusArea || "General";
      return acc;
    },
    {},
  );

  const latestByDay = {};

  checkpoints.forEach((checkpoint) => {
    weekdayMap[checkpoint.day] = weekdayMap[checkpoint.day] || {
      correct: 0,
      missed: 0,
    };

    if (checkpoint.status === "correct") {
      weekdayMap[checkpoint.day].correct += 1;
    } else {
      weekdayMap[checkpoint.day].missed += 1;
    }

    const resolvedFocus =
      checkpoint.focusArea || scheduleFocusMap[checkpoint.day] || "General";
    if (!focusMap[resolvedFocus]) {
      focusMap[resolvedFocus] = { correct: 0, missed: 0 };
    }

    if (checkpoint.status === "correct") {
      focusMap[resolvedFocus].correct += 1;
    } else {
      focusMap[resolvedFocus].missed += 1;
    }

    const existing = latestByDay[checkpoint.day];
    const currentStamp = new Date(
      checkpoint.recordedAt || checkpoint.date,
    ).getTime();
    const existingStamp = existing
      ? new Date(existing.recordedAt || existing.date).getTime()
      : 0;

    if (!existing || currentStamp >= existingStamp) {
      latestByDay[checkpoint.day] = {
        ...checkpoint,
        focusArea: resolvedFocus,
      };
    }
  });

  const weekdayPerformance = WEEKDAYS.map((day) => {
    const stats = weekdayMap[day] || { correct: 0, missed: 0 };
    const total = stats.correct + stats.missed;

    return {
      day,
      ...stats,
      rate: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
    };
  });

  const focusAreaPerformance = Object.entries(focusMap)
    .map(([focusArea, stats]) => {
      const total = stats.correct + stats.missed;

      return {
        focusArea,
        ...stats,
        rate: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.rate - a.rate || b.correct - a.correct);

  const bestDay = weekdayPerformance.reduce((best, current) => {
    if (!best) return current;
    if (current.rate > best.rate) return current;
    if (current.rate === best.rate && current.correct > best.correct)
      return current;
    return best;
  }, null);

  const weakestDay = weekdayPerformance.reduce((worst, current) => {
    if (!worst) return current;
    if (current.rate < worst.rate) return current;
    if (current.rate === worst.rate && current.missed > worst.missed)
      return current;
    return worst;
  }, null);

  const bestFocusArea = focusAreaPerformance[0] || null;

  return {
    summary: {
      totalCheckpoints,
      correctCount,
      missedCount,
      adherenceRate,
      currentStreak,
      longestStreak,
      activeDays: weekdayPerformance.filter(
        (day) => day.correct + day.missed > 0,
      ).length,
    },
    recentTrend,
    weekdayPerformance,
    focusAreaPerformance,
    insights: {
      bestDay: totalCheckpoints > 0 ? bestDay?.day || "N/A" : "N/A",
      weakestDay: totalCheckpoints > 0 ? weakestDay?.day || "N/A" : "N/A",
      bestFocusArea:
        totalCheckpoints > 0 ? bestFocusArea?.focusArea || "N/A" : "N/A",
    },
    recentCheckpoints: checkpoints.slice(-10).reverse(),
    latestStatusByDay: latestByDay,
  };
}

/**
 * Create timetable manually (user input)
 */
export const createTimetable = async (req, res) => {
  try {
    const { name, category, goal, level, sportsMode, weeklySchedule } =
      req.body;

    // Validation
    if (!category || !goal || !level) {
      return res.status(400).json({
        message: "Please provide category, goal, and level",
      });
    }

    if (!weeklySchedule || weeklySchedule.length !== 7) {
      return res.status(400).json({
        message: "Please provide schedule for all 7 days",
      });
    }

    // Deactivate previous timetables - ✅ FIXED: req.user._id
    await Timetable.updateMany(
      { userId: req.user._id, isActive: true },
      { isActive: false },
    );

    // Create new timetable - ✅ FIXED: req.user._id
    const timetable = await Timetable.create({
      userId: req.user._id,
      name: name || "My Workout Schedule",
      category,
      goal,
      level,
      sportsMode: sportsMode || { enabled: false, sport: "none" },
      weeklySchedule,
      isActive: true,
      hasRequestedAI: false,
    });

    res.json({
      message: "Timetable created successfully!",
      timetable,
    });
  } catch (err) {
    console.error("Create Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get AI improvement suggestions
 */
export const getAIImprovements = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIXED: req.user._id
    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Generate AI suggestions
    const aiResult = await generateImprovementSuggestions({
      category: timetable.category,
      goal: timetable.goal,
      level: timetable.level,
      sportsMode: timetable.sportsMode,
      weeklySchedule: timetable.weeklySchedule,
    });

    let suggestions = [];
    let overallAssessment = {};

    if (aiResult.success) {
      suggestions = aiResult.data.suggestions || [];
      overallAssessment = aiResult.data.overallAssessment || {};
    } else {
      suggestions = aiResult.fallback.suggestions || [];
      overallAssessment = aiResult.fallback.overallAssessment || {};
    }

    // Save suggestions to timetable
    timetable.aiImprovements = suggestions;
    timetable.hasRequestedAI = true;
    timetable.lastImprovedAt = new Date();
    await timetable.save();

    res.json({
      message: "AI improvements generated successfully!",
      suggestions,
      overallAssessment,
      aiSuccess: aiResult.success,
    });
  } catch (err) {
    console.error("Get AI Improvements Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get active timetable
 */
export const getActiveTimetable = async (req, res) => {
  try {
    // ✅ FIXED: req.user._id
    const timetable = await Timetable.findOne({
      userId: req.user._id,
      isActive: true,
    });

    if (!timetable) {
      return res.json({
        active: false,
        message: "No active timetable found",
      });
    }

    // Get today's workout
    const todaysWorkout = getTodaysWorkout(timetable.weeklySchedule);

    res.json({
      active: true,
      timetable,
      todaysWorkout,
    });
  } catch (err) {
    console.error("Get Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get today's workout specifically
 */
export const getTodaysWorkoutPlan = async (req, res) => {
  try {
    // ✅ FIXED: req.user._id
    const timetable = await Timetable.findOne({
      userId: req.user._id,
      isActive: true,
    });

    if (!timetable) {
      return res.status(404).json({
        message: "No active timetable found. Please create one first.",
      });
    }

    const todaysWorkout = getTodaysWorkout(timetable.weeklySchedule);

    res.json({
      todaysWorkout,
      timetableId: timetable._id,
      category: timetable.category,
      goal: timetable.goal,
      level: timetable.level,
    });
  } catch (err) {
    console.error("Get Today's Workout Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update timetable
 */
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weeklySchedule, category, goal, level, sportsMode } =
      req.body;

    // ✅ FIXED: req.user._id
    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Update fields
    if (name) timetable.name = name;
    if (category) timetable.category = category;
    if (goal) timetable.goal = goal;
    if (level) timetable.level = level;
    if (sportsMode) timetable.sportsMode = sportsMode;
    if (weeklySchedule) {
      timetable.weeklySchedule = weeklySchedule;
      // Reset AI improvements when schedule changes
      timetable.hasRequestedAI = false;
      timetable.aiImprovements = [];
    }

    await timetable.save();

    res.json({
      message: "Timetable updated successfully!",
      timetable,
    });
  } catch (err) {
    console.error("Update Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete timetable
 */
export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIXED: req.user._id
    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    await Timetable.findByIdAndDelete(id);

    res.json({ message: "Timetable deleted successfully" });
  } catch (err) {
    console.error("Delete Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all user timetables (history)
 */
export const getTimetableHistory = async (req, res) => {
  try {
    // ✅ FIXED: req.user._id
    const timetables = await Timetable.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      timetables,
      count: timetables.length,
    });
  } catch (err) {
    console.error("Get History Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Submit a checkpoint for a timetable day.
 */
export const createTimetableCheckpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day,
      status,
      note = "",
      plannedExercises = [],
      completedExercises = [],
      missedExercises = [],
      focusArea = "",
      date,
    } = req.body;

    if (!day || !status) {
      return res.status(400).json({
        message: "Please provide a day and checkpoint status",
      });
    }

    if (!WEEKDAYS.includes(day)) {
      return res.status(400).json({
        message: "Please provide a valid weekday",
      });
    }

    if (!["correct", "missed"].includes(status)) {
      return res.status(400).json({
        message: "Checkpoint status must be correct or missed",
      });
    }

    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    const checkpointDate = normalizeCheckpointDate(date);
    const scheduleEntry = (timetable.weeklySchedule || []).find(
      (entry) => entry.day === day,
    );
    const resolvedFocusArea =
      focusArea || scheduleEntry?.focusArea || "General";

    const checkpointPayload = {
      date: checkpointDate,
      day,
      status,
      focusArea: resolvedFocusArea,
      plannedExercises: Array.isArray(plannedExercises) ? plannedExercises : [],
      completedExercises: Array.isArray(completedExercises)
        ? completedExercises
        : [],
      missedExercises: Array.isArray(missedExercises) ? missedExercises : [],
      note,
      recordedAt: new Date(),
    };

    const existingIndex = (timetable.checkpoints || []).findIndex(
      (checkpoint) =>
        checkpoint.date === checkpointDate && checkpoint.day === day,
    );

    if (existingIndex >= 0) {
      timetable.checkpoints[existingIndex] = checkpointPayload;
    } else {
      timetable.checkpoints.push(checkpointPayload);
    }

    await timetable.save();

    const analytics = buildCheckpointAnalytics(timetable);

    res.status(201).json({
      message: "Checkpoint saved successfully!",
      checkpoint: checkpointPayload,
      analytics,
    });
  } catch (err) {
    console.error("Create Checkpoint Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get timetable checkpoint analytics.
 */
export const getTimetableAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.json({
      timetableId: timetable._id,
      analytics: buildCheckpointAnalytics(timetable),
    });
  } catch (err) {
    console.error("Get Timetable Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
};
