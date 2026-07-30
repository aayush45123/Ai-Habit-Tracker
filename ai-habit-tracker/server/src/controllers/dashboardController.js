import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

/**
 * Get Comprehensive User Dashboard Data
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. User Habits & Current Streaks
    const habits = await Habit.find({ userId, isArchived: { $ne: true } });
    const totalHabits = habits.length;

    let currentStreak = 0;
    let bestStreak = 0;
    habits.forEach((h) => {
      if (h.streak > currentStreak) currentStreak = h.streak || 0;
      if (h.bestStreak > bestStreak || h.longestStreak > bestStreak) {
        bestStreak = Math.max(h.bestStreak || 0, h.longestStreak || 0);
      }
    });

    const userHabitIds = habits.map((h) => h._id);

    // 2. Today's Habit Status
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLogs = userHabitIds.length
      ? await HabitLog.find({
          habitId: { $in: userHabitIds },
          date: { $gte: startOfToday, $lte: endOfToday },
        })
      : [];

    const completedTodayCount = todayLogs.filter(
      (l) => l.status === "done" || l.status === "completed"
    ).length;

    const todaysHabits = habits.map((h) => {
      const log = todayLogs.find((l) => l.habitId.toString() === h._id.toString());
      return {
        _id: h._id,
        title: h.title,
        frequency: h.frequency,
        category: h.category,
        streak: h.streak || 0,
        isCompletedToday: log ? log.status === "done" || log.status === "completed" : false,
      };
    });

    // 3. Weekly Progress (Past 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyLogs = userHabitIds.length
      ? await HabitLog.find({
          habitId: { $in: userHabitIds },
          date: { $gte: sevenDaysAgo },
          status: { $in: ["done", "completed"] },
        })
      : [];

    const weeklyProgress = {
      completedCount: weeklyLogs.length,
      targetCount: totalHabits * 7,
      completionRate: totalHabits > 0 ? Math.round((weeklyLogs.length / (totalHabits * 7)) * 100) : 0,
    };

    // 4. Activity Heatmap (Past 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const heatmapLogs = userHabitIds.length
      ? await HabitLog.find({
          habitId: { $in: userHabitIds },
          date: { $gte: thirtyDaysAgo },
          status: { $in: ["done", "completed"] },
        })
      : [];

    const heatmapMap = {};
    heatmapLogs.forEach((log) => {
      const dateKey = new Date(log.date || log.createdAt).toISOString().split("T")[0];
      heatmapMap[dateKey] = (heatmapMap[dateKey] || 0) + 1;
    });

    const heatmap = Object.keys(heatmapMap).map((date) => ({
      date,
      count: heatmapMap[date],
    }));

    // 5. AI Recommendation Snippet
    const aiRecommendation =
      currentStreak > 3
        ? `🔥 Great consistency! You're on a ${currentStreak}-day streak. Keep pushing!`
        : `💡 Pro-tip: Complete your daily habits in the morning to increase compliance by 40%.`;

    res.json({
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
