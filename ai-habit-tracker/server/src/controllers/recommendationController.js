import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import User from "../models/User.js";
import Challenge from "../models/Challenge.js";

/**
 * Analyze habit patterns and generate personalized recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    const habits = await Habit.find({ userId });
    const logs = await HabitLog.find({
      habitId: { $in: habits.map((h) => h._id) },
    });

    if (habits.length === 0) {
      return res.json({
        recommendations: [
          {
            type: "starter",
            title: "Start with Movement",
            description: "Begin with a daily 10-minute walk or stretch",
            reason: "Low friction, high consistency habit",
            difficulty: "Easy",
          },
          {
            type: "starter",
            title: "Morning Hydration",
            description: "Drink a glass of water first thing in the morning",
            reason: "Foundational habit that supports all others",
            difficulty: "Easy",
          },
        ],
        insights: [],
        challenges: [],
      });
    }

    // Calculate habit performance
    const habitStats = habits.map((habit) => {
      const habitLogs = logs.filter(
        (log) => log.habitId.toString() === habit._id.toString(),
      );
      const doneCount = habitLogs.filter((log) => log.status === "done").length;
      const completionRate =
        habitLogs.length === 0
          ? 0
          : Math.round((doneCount / habitLogs.length) * 100);

      const lastWeekLogs = habitLogs.filter(
        (log) =>
          new Date(log.date) >
          new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
      );
      const lastWeekCompletion =
        lastWeekLogs.length === 0
          ? 0
          : Math.round(
              (lastWeekLogs.filter((l) => l.status === "done").length /
                lastWeekLogs.length) *
                100,
            );

      return {
        id: habit._id,
        title: habit.title,
        category: habit.category,
        completionRate,
        lastWeekCompletion,
        streak: habit.streak || 0,
        totalLogs: habitLogs.length,
      };
    });

    // Generate recommendations based on patterns
    const recommendations = generateRecommendations(habitStats, habits);

    // Generate weekly insights
    const insights = generateWeeklyInsights(habitStats);

    // Generate challenge suggestions
    const challenges = generateChallengeSuggestions(habitStats, habits);

    res.json({
      recommendations,
      insights,
      challenges,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Generate habit recommendations based on current habits
 */
function generateRecommendations(habitStats, habits) {
  const recommendations = [];

  // Analyze habit categories
  const categories = {};
  habitStats.forEach((stat) => {
    if (!categories[stat.category]) categories[stat.category] = [];
    categories[stat.category].push(stat);
  });

  // Recommend missing categories
  const allCategories = [
    "Health",
    "Learning",
    "Fitness",
    "Productivity",
    "Mindfulness",
    "Social",
    "Creative",
  ];
  const missingCategories = allCategories.filter((c) => !categories[c]);

  const categoryRecommendations = {
    Health: {
      title: "Add a Health Habit",
      description: "Track water intake, sleep, or meditation",
      reason: "Complements your current routine",
      difficulty: "Easy",
    },
    Learning: {
      title: "Learn Something New",
      description: "Dedicate 15 minutes daily to reading or skill development",
      reason: "Boosts cognitive abilities and personal growth",
      difficulty: "Medium",
    },
    Fitness: {
      title: "Add Cardio",
      description: "30 minutes of walking, running, or cycling",
      reason: "Enhances physical health and energy levels",
      difficulty: "Medium",
    },
    Productivity: {
      title: "Focus Block",
      description: "2 hour deep work sessions without distractions",
      reason: "Increase output quality and professional growth",
      difficulty: "Hard",
    },
    Mindfulness: {
      title: "Daily Meditation",
      description: "10 minutes of meditation or breathing exercises",
      reason: "Reduces stress and improves mental clarity",
      difficulty: "Medium",
    },
    Social: {
      title: "Connection Time",
      description: "Call or meet a friend or family member",
      reason: "Maintains relationships and improves wellbeing",
      difficulty: "Easy",
    },
    Creative: {
      title: "Creative Expression",
      description: "Write, draw, or create something artistic",
      reason: "Unlocks creativity and self-expression",
      difficulty: "Medium",
    },
  };

  // Add top 3 missing category recommendations
  missingCategories.slice(0, 3).forEach((cat) => {
    recommendations.push({
      type: "missing_category",
      category: cat,
      ...categoryRecommendations[cat],
    });
  });

  // Recommend boosting low-performing habits
  const lowPerformers = habitStats.filter((stat) => stat.completionRate < 50);
  if (lowPerformers.length > 0) {
    recommendations.push({
      type: "boost_low_performers",
      title: "Focus on Consistency",
      description: `Your "${lowPerformers[0].title}" habit is struggling. Try breaking it into smaller steps.`,
      reason: "Consistency over intensity builds lasting habits",
      difficulty: "Medium",
    });
  }

  // Recommend leveraging high performers
  const highPerformers = habitStats.filter((stat) => stat.completionRate >= 80);
  if (highPerformers.length >= 2) {
    recommendations.push({
      type: "stack_habits",
      title: "Stack Your Best Habits",
      description: `You're crushing "${highPerformers[0].title}". Consider pairing it with a new habit.`,
      reason: "Build on your momentum and existing routines",
      difficulty: "Easy",
    });
  }

  return recommendations.slice(0, 4);
}

/**
 * Generate weekly insights
 */
function generateWeeklyInsights(habitStats) {
  const insights = [];

  const avgCompletion =
    habitStats.length > 0
      ? Math.round(
          habitStats.reduce((sum, s) => sum + s.completionRate, 0) /
            habitStats.length,
        )
      : 0;

  const weekTrend = habitStats.map((s) => s.lastWeekCompletion);
  const avgWeekCompletion =
    weekTrend.length > 0
      ? Math.round(weekTrend.reduce((a, b) => a + b, 0) / weekTrend.length)
      : 0;

  if (avgCompletion >= 80) {
    insights.push({
      type: "excellent",
      title: "🔥 On Fire!",
      message: `You're maintaining ${avgCompletion}% consistency. That's excellent!`,
      icon: "flame",
    });
  } else if (avgCompletion >= 60) {
    insights.push({
      type: "good",
      title: "📈 Good Progress",
      message: `You're at ${avgCompletion}% completion. Keep pushing!`,
      icon: "trend",
    });
  } else if (avgCompletion >= 40) {
    insights.push({
      type: "moderate",
      title: "⚠️ Room to Improve",
      message: `Your completion rate is ${avgCompletion}%. Small improvements will help!`,
      icon: "alert",
    });
  }

  // Identify best performing habit
  const bestHabit = habitStats.reduce((best, current) =>
    current.completionRate > best.completionRate ? current : best,
  );
  if (bestHabit) {
    insights.push({
      type: "best_habit",
      title: "⭐ Star Habit",
      message: `"${bestHabit.title}" is your strongest habit at ${bestHabit.completionRate}%!`,
      icon: "star",
    });
  }

  // Streak milestone
  const longestStreak = Math.max(...habitStats.map((s) => s.streak), 0);
  if (longestStreak >= 30) {
    insights.push({
      type: "milestone",
      title: "🎯 Milestone!",
      message: `You've reached a ${longestStreak}-day streak! That's dedication.`,
      icon: "milestone",
    });
  }

  return insights;
}

/**
 * Generate personalized challenge suggestions
 */
function generateChallengeSuggestions(habitStats, habits) {
  const challenges = [];

  const avgStreak =
    habitStats.length > 0
      ? Math.round(
          habitStats.reduce((sum, s) => sum + s.streak, 0) / habitStats.length,
        )
      : 0;

  // 7-day consistency challenge
  challenges.push({
    type: "consistency",
    title: "7-Day Consistency Challenge",
    description: "Complete all habits for 7 consecutive days",
    reward: 100,
    difficulty: "Medium",
    icon: "📅",
    target: 7,
  });

  // 30-day streak challenge
  if (avgStreak < 30) {
    challenges.push({
      type: "streak",
      title: "30-Day Streak Challenge",
      description: "Maintain a 30-day streak on any single habit",
      reward: 250,
      difficulty: "Hard",
      icon: "🔥",
      target: 30,
    });
  }

  // Perfect week challenge
  challenges.push({
    type: "perfect_week",
    title: "Perfect Week",
    description: "Achieve 100% completion rate for one full week",
    reward: 200,
    difficulty: "Hard",
    icon: "✨",
    target: 7,
  });

  // Category mastery challenge
  const lowPerformers = habitStats.filter((s) => s.completionRate < 50);
  if (lowPerformers.length > 0) {
    challenges.push({
      type: "category_mastery",
      title: `Master: ${lowPerformers[0].title}`,
      description: `Boost "${lowPerformers[0].title}" completion to 80%`,
      reward: 150,
      difficulty: "Medium",
      icon: "🎓",
      target: 80,
    });
  }

  // Habit stacking challenge
  challenges.push({
    type: "habit_stacking",
    title: "Habit Stack Pro",
    description: "Link 3 habits into one daily routine",
    reward: 175,
    difficulty: "Medium",
    icon: "🔗",
    target: 3,
  });

  return challenges.slice(0, 4);
}

/**
 * Get detailed recommendation explanation
 */
export const getRecommendationDetails = async (req, res) => {
  try {
    const { type } = req.query;

    const details = {
      missing_category: {
        title: "Expand Your Routine",
        description:
          "Adding habits from different categories creates a balanced lifestyle",
        tips: [
          "Start small with one new habit",
          "Link it to an existing habit for consistency",
          "Give yourself 2 weeks to adjust",
        ],
      },
      boost_low_performers: {
        title: "Turn Around Struggling Habits",
        description: "Some habits need adjustment, not abandonment",
        tips: [
          "Break into smaller, easier steps",
          "Move to a different time of day",
          "Find an accountability partner",
        ],
      },
      stack_habits: {
        title: "Leverage Your Momentum",
        description: "Use habits you're already doing to build new ones",
        tips: [
          "Add new habit right after a strong one",
          "Keep them related for better flow",
          "Start with just 5 minutes",
        ],
      },
    };

    res.json(details[type] || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
