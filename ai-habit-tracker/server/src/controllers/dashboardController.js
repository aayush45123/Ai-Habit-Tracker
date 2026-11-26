import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import ScheduleEvent from "../models/ScheduleEvent.js";
import Timetable from "../models/Timetable.js";
import WorkoutLog from "../models/WorkoutLog.js";
import FocusLog from "../models/FocusLog.js";
import JournalEntry from "../models/JournalEntry.js";
import UserGamification from "../models/UserGamification.js";

function getTodayISTString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get Comprehensive Unified Personal Growth Command Center Dashboard Data
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayISTString();

    const d = new Date(todayStr + "T12:00:00Z");
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[d.getDay()];

    const startOfToday = new Date(todayStr + "T00:00:00.000Z");
    const endOfToday = new Date(todayStr + "T23:59:59.999Z");

    // 1. Parallel fetch of all core modules
    const [
      habits,
      todayHabitLogs,
      todayScheduleEvents,
      activeTimetable,
      todayWorkoutLog,
      todayFocusLogs,
      todayJournal,
      gamification,
    ] = await Promise.all([
      Habit.find({ userId, isArchived: { $ne: true }, isDeleted: { $ne: true } }).lean(),
      HabitLog.find({
        userId,
        date: { $gte: startOfToday, $lte: endOfToday },
      }).lean(),
      ScheduleEvent.find({ userId, date: todayStr }).sort({ startMinutes: 1 }).lean(),
      Timetable.findOne({ userId, isActive: { $ne: false } }).lean(),
      WorkoutLog.findOne({ userId, date: todayStr }).lean(),
      FocusLog.find({ userId, date: todayStr, status: "completed" }).lean(),
      JournalEntry.findOne({ userId, date: todayStr }).lean(),
      UserGamification.findOne({ userId }).lean(),
    ]);

    // 2. Habit metrics & streak calculation
    const totalHabits = habits.length;
    let currentStreak = 0;
    let bestStreak = gamification?.allTimeMaxStreak || 0;

    habits.forEach((h) => {
      if ((h.streak || 0) > currentStreak) currentStreak = h.streak || 0;
      if ((h.bestStreak || h.longestStreak || 0) > bestStreak) {
        bestStreak = Math.max(h.bestStreak || 0, h.longestStreak || 0, bestStreak);
      }
    });

    const completedTodayCount = todayHabitLogs.filter(
      (l) => l.status === "done" || l.status === "completed"
    ).length;

    const todaysHabits = habits.map((h) => {
      const log = todayHabitLogs.find((l) => l.habitId && l.habitId.toString() === h._id.toString());
      return {
        _id: h._id,
        title: h.title,
        frequency: h.frequency,
        category: h.category,
        streak: h.streak || 0,
        isCompletedToday: log ? log.status === "done" || log.status === "completed" : false,
      };
    });

    // 3. Schedule & Task metrics
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activeScheduleEvent = null;
    let nextUpcomingScheduleEvent = null;

    const todayTasks = todayScheduleEvents.filter((e) => e.isTask);
    const todayTimedEvents = todayScheduleEvents.filter((e) => !e.isTask);

    const completedTasksCount = todayTasks.filter((t) => t.status === "completed").length;

    for (const ev of todayTimedEvents) {
      if (
        ev.status !== "completed" &&
        ev.status !== "cancelled" &&
        currentMinutes >= ev.startMinutes &&
        currentMinutes < ev.endMinutes
      ) {
        if (!activeScheduleEvent) activeScheduleEvent = ev;
      }
      if (
        ev.status !== "completed" &&
        ev.status !== "cancelled" &&
        ev.startMinutes > currentMinutes
      ) {
        if (!nextUpcomingScheduleEvent || ev.startMinutes < nextUpcomingScheduleEvent.startMinutes) {
          nextUpcomingScheduleEvent = ev;
        }
      }
    }

    // 4. Workout metrics
    const daySchedule = (activeTimetable?.days || []).find((ds) => ds.day === dayOfWeek);
    const hasWorkoutToday = !!(daySchedule && !daySchedule.isRestDay && daySchedule.exercises?.length > 0);
    const isRestDay = !!(daySchedule && daySchedule.isRestDay);
    const isWorkoutCompleted = todayWorkoutLog?.status === "completed";

    // 5. Focus metrics
    const totalFocusMinutes = todayFocusLogs.reduce((acc, curr) => acc + (curr.durationMin || 0), 0);

    // 6. Growth Score calculation (0 - 100)
    let scoreTotal = 0;
    let weightSum = 0;

    // Habits component (40%)
    if (totalHabits > 0) {
      scoreTotal += (completedTodayCount / totalHabits) * 40;
      weightSum += 40;
    } else {
      scoreTotal += 35; // neutral baseline if no habits created
      weightSum += 40;
    }

    // Tasks component (30%)
    if (todayTasks.length > 0) {
      scoreTotal += (completedTasksCount / todayTasks.length) * 30;
      weightSum += 30;
    } else {
      scoreTotal += 25;
      weightSum += 30;
    }

    // Workout component (15%)
    if (hasWorkoutToday) {
      scoreTotal += isWorkoutCompleted ? 15 : 0;
      weightSum += 15;
    } else if (isRestDay) {
      scoreTotal += 15;
      weightSum += 15;
    } else {
      scoreTotal += 12;
      weightSum += 15;
    }

    // Journal component (15%)
    scoreTotal += todayJournal ? 15 : 0;
    weightSum += 15;

    const growthScore = Math.min(100, Math.round((scoreTotal / weightSum) * 100));

    // 7. Weekly Progress Breakdown (Past 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const userHabitIds = habits.map((h) => h._id);
    const [weeklyLogs, weeklyFocus, weeklyTasks] = await Promise.all([
      userHabitIds.length
        ? HabitLog.find({
            habitId: { $in: userHabitIds },
            date: { $gte: sevenDaysAgo },
            status: { $in: ["done", "completed"] },
          }).lean()
        : [],
      FocusLog.find({
        userId,
        date: { $gte: sevenDaysAgo.toISOString().split("T")[0] },
        status: "completed",
      }).lean(),
      ScheduleEvent.find({
        userId,
        isTask: true,
        date: { $gte: sevenDaysAgo.toISOString().split("T")[0] },
      }).lean(),
    ]);

    // Build 7-day chart series
    const daysArr = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const iso = dt.toISOString().split("T")[0];
      const dName = dt.toLocaleDateString("en-US", { weekday: "short" });

      const dayHabitsDone = weeklyLogs.filter((l) => {
        const ld = typeof l.date === "string" ? l.date.split("T")[0] : l.date.toISOString().split("T")[0];
        return ld === iso;
      }).length;

      const dayTasksDone = weeklyTasks.filter((t) => t.date === iso && t.status === "completed").length;
      const dayFocusMin = weeklyFocus
        .filter((f) => f.date === iso)
        .reduce((sum, item) => sum + (item.durationMin || 0), 0);

      daysArr.push({
        date: iso,
        day: dName,
        tasks: dayTasksDone,
        habits: dayHabitsDone,
        focusMinutes: dayFocusMin,
      });
    }

    const weeklyProgress = {
      completedCount: weeklyLogs.length,
      targetCount: totalHabits * 7,
      completionRate: totalHabits > 0 ? Math.round((weeklyLogs.length / (totalHabits * 7)) * 100) : 0,
      days: daysArr,
    };

    // 8. 30-day activity heatmap
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const heatmap = await HabitLog.aggregate([
      {
        $match: {
          $or: [{ userId }, { habitId: { $in: userHabitIds } }],
          date: { $gte: thirtyDaysAgo },
          status: { $in: ["done", "completed"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "+05:30",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: "$_id", count: 1 } },
      { $sort: { date: 1 } },
    ]);

    // 9. Contextual AI Insights based on real metrics
    const aiBullets = [];
    if (totalFocusMinutes > 60) {
      aiBullets.push(`Your focus time is strong today at ${totalFocusMinutes} min. Great momentum!`);
    } else {
      aiBullets.push("Plan a 25-minute deep focus sprint to accelerate your priority tasks.");
    }

    if (hasWorkoutToday) {
      if (isWorkoutCompleted) {
        aiBullets.push(`Workout completed: ${daySchedule?.focusArea || "Training session"} logged.`);
      } else {
        aiBullets.push(`Workout scheduled for today: ${daySchedule?.focusArea || "Session"} (${daySchedule?.exercises?.length || 0} exercises).`);
      }
    } else if (isRestDay) {
      aiBullets.push("Today is marked as an active recovery day. Focus on light stretching and hydration.");
    }

    if (todayJournal) {
      aiBullets.push(`Journal logged (Mood: ${todayJournal.mood || "Good"}). Great self-reflection.`);
    } else {
      aiBullets.push("You haven't logged your growth reflection yet. A 2-minute check-in keeps mental clarity high.");
    }

    const aiRecommendation =
      currentStreak > 3
        ? `🔥 Great consistency! You're on a ${currentStreak}-day streak. Keep pushing!`
        : `💡 Pro-tip: Complete your daily habits in the morning to increase compliance by 40%.`;

    res.json({
      // Unified Command Center structure (matching Image D)
      overview: {
        tasksToday: {
          completed: completedTasksCount,
          total: todayTasks.length,
          rate: todayTasks.length > 0 ? Math.round((completedTasksCount / todayTasks.length) * 100) : 100,
        },
        focusTime: {
          minutes: totalFocusMinutes,
          sessions: todayFocusLogs.length,
        },
        habitsToday: {
          completed: completedTodayCount,
          total: totalHabits,
          rate: totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0,
        },
        workout: {
          hasWorkout: hasWorkoutToday,
          isRestDay,
          isCompleted: isWorkoutCompleted,
          focusArea: daySchedule?.focusArea || "Rest & Recovery",
          exercisesCount: daySchedule?.exercises?.length || 0,
        },
        journal: {
          hasLogged: !!todayJournal,
          mood: todayJournal?.mood || "unlogged",
          moodScore: todayJournal?.moodScore || 0,
        },
        growthScore,
      },
      todaySchedule: {
        events: todayTimedEvents,
        activeEvent: activeScheduleEvent,
        nextUpcomingEvent: nextUpcomingScheduleEvent,
      },
      priorityTasks: todayTasks,
      aiInsights: {
        bullets: aiBullets,
        summary: aiRecommendation,
      },
      // Backward compatibility fields
      myStreak: {
        current: currentStreak,
        best: bestStreak,
      },
      todaysHabits,
      summary: {
        totalHabits,
        completedToday: completedTodayCount,
      },
      weeklyProgress,
      aiRecommendation,
      heatmap,
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);
    res.status(500).json({ message: "Failed to load dashboard data", error: error.message });
  }
};
