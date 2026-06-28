// server/src/controllers/recommendationController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/* ─────────────────────────────────────────
   HABIT STATS BUILDER
   Returns per-habit stats used by all
   downstream generators.
───────────────────────────────────────── */

function buildHabitStats(habits, logs) {
  const sevenDaysAgo = daysAgo(7);

  return habits.map((habit) => {
    const habitLogs = logs.filter(
      (log) => log.habitId.toString() === habit._id.toString(),
    );
    const doneCount = habitLogs.filter((l) => l.status === "done").length;
    const totalLogs = habitLogs.length;
    const completionRate =
      totalLogs === 0 ? 0 : Math.round((doneCount / totalLogs) * 100);

    const lastWeekLogs = habitLogs.filter(
      (l) => new Date(l.date) >= sevenDaysAgo,
    );
    const lastWeekDone = lastWeekLogs.filter((l) => l.status === "done").length;
    const lastWeekCompletion =
      lastWeekLogs.length === 0
        ? 0
        : Math.round((lastWeekDone / lastWeekLogs.length) * 100);

    // Trend vs overall
    let trend = "stable";
    if (lastWeekCompletion > completionRate + 10) trend = "improving";
    else if (lastWeekCompletion < completionRate - 10) trend = "declining";

    return {
      id: habit._id,
      title: habit.title,
      category: habit.category || "General",
      completionRate,
      lastWeekCompletion,
      lastWeekDone,
      totalLogs,
      streak: habit.streak || 0,
      longestStreak: habit.longestStreak || habit.streak || 0,
      trend,
    };
  });
}

/* ─────────────────────────────────────────
   RECOMMENDATIONS GENERATOR
   Every recommendation now includes:
   • reason  — derived from actual user data
   • dataPoint — the raw number that triggered it
   • confidence — how strongly the data supports this rec
───────────────────────────────────────── */

function generateRecommendations(habitStats, habits) {
  const recommendations = [];

  /* ── Category gap analysis ── */
  const categories = {};
  habitStats.forEach((s) => {
    if (!categories[s.category]) categories[s.category] = [];
    categories[s.category].push(s);
  });

  const allCategories = [
    "Health",
    "Learning",
    "Fitness",
    "Productivity",
    "Mindfulness",
    "Social",
    "Creative",
  ];

  const categoryMeta = {
    Health: {
      title: "Add a Health Habit",
      description: "Track water intake, sleep, or daily meditation.",
      difficulty: "Easy",
      icon: "🩺",
    },
    Learning: {
      title: "Learn Something New",
      description: "Dedicate 15 minutes daily to reading or skill development.",
      difficulty: "Medium",
      icon: "📚",
    },
    Fitness: {
      title: "Add a Fitness Habit",
      description: "30 minutes of walking, running, or strength training.",
      difficulty: "Medium",
      icon: "💪",
    },
    Productivity: {
      title: "Add a Focus Block",
      description: "Schedule 2 hours of deep work without distractions.",
      difficulty: "Hard",
      icon: "🎯",
    },
    Mindfulness: {
      title: "Daily Mindfulness",
      description: "10 minutes of meditation or breathing exercises.",
      difficulty: "Medium",
      icon: "🧘",
    },
    Social: {
      title: "Connection Time",
      description: "Reach out to a friend or family member.",
      difficulty: "Easy",
      icon: "🤝",
    },
    Creative: {
      title: "Creative Expression",
      description: "Write, draw, or create something you enjoy.",
      difficulty: "Medium",
      icon: "🎨",
    },
  };

  const missingCategories = allCategories.filter((c) => !categories[c]);
  const coveredCount = allCategories.length - missingCategories.length;

  missingCategories.slice(0, 2).forEach((cat) => {
    recommendations.push({
      type: "missing_category",
      category: cat,
      ...categoryMeta[cat],
      // XAI fields
      reason: `You currently cover ${coveredCount} of ${allCategories.length} habit categories. Adding ${cat} improves balance and reduces burnout risk.`,
      dataPoint: `${coveredCount}/${allCategories.length} categories tracked`,
      confidence: 80,
      evidenceTags: ["category_gap", "lifestyle_balance"],
    });
  });

  /* ── Low performer — needs attention ── */
  const lowPerformers = habitStats
    .filter((s) => s.completionRate < 50)
    .sort((a, b) => a.completionRate - b.completionRate);

  if (lowPerformers.length > 0) {
    const worst = lowPerformers[0];
    const trend =
      worst.trend === "declining"
        ? " and trending downward this week"
        : worst.trend === "improving"
          ? " but showing some recent improvement"
          : "";

    recommendations.push({
      type: "boost_low_performer",
      title: `Revive: "${worst.title}"`,
      description: `Break "${worst.title}" into a smaller daily action to reduce friction.`,
      difficulty: "Medium",
      icon: "⚠️",
      // XAI fields
      reason: `"${worst.title}" has a ${worst.completionRate}% completion rate across ${worst.totalLogs} logged days${trend}. Habits below 50% rarely become automatic.`,
      dataPoint: `${worst.completionRate}% completion, ${worst.lastWeekDone}/7 days last week`,
      confidence: 90,
      evidenceTags: ["low_completion", worst.trend],
    });
  }

  /* ── Habit stacking — leverage high performers ── */
  const highPerformers = habitStats
    .filter((s) => s.completionRate >= 80)
    .sort((a, b) => b.completionRate - a.completionRate);

  if (highPerformers.length >= 1) {
    const anchor = highPerformers[0];
    recommendations.push({
      type: "stack_habits",
      title: "Stack a New Habit",
      description: `Attach a new 5-minute habit immediately after "${anchor.title}".`,
      difficulty: "Easy",
      icon: "🔗",
      // XAI fields
      reason: `"${anchor.title}" is your most reliable habit at ${anchor.completionRate}% completion with a ${anchor.streak}-day streak — the ideal anchor for habit stacking.`,
      dataPoint: `${anchor.completionRate}% completion, ${anchor.streak}-day streak`,
      confidence: 85,
      evidenceTags: ["high_performer", "habit_stacking"],
    });
  }

  /* ── Declining trend warning ── */
  const decliningHabits = habitStats.filter((s) => s.trend === "declining");
  if (decliningHabits.length > 0) {
    const declining = decliningHabits[0];
    recommendations.push({
      type: "trend_warning",
      title: `Trend Alert: "${declining.title}"`,
      description: `Schedule "${declining.title}" at a protected time to reverse the recent dip.`,
      difficulty: "Medium",
      icon: "📉",
      // XAI fields
      reason: `"${declining.title}" had ${declining.lastWeekCompletion}% last week vs ${declining.completionRate}% overall — a ${declining.completionRate - declining.lastWeekCompletion}% drop in recent performance.`,
      dataPoint: `Last 7 days: ${declining.lastWeekCompletion}% vs all-time: ${declining.completionRate}%`,
      confidence: 88,
      evidenceTags: ["declining_trend"],
    });
  }

  /* ── Streak at risk ── */
  const streakRisk = habitStats.filter(
    (s) => s.streak >= 5 && s.lastWeekCompletion < 60,
  );
  if (streakRisk.length > 0) {
    const atRisk = streakRisk[0];
    recommendations.push({
      type: "protect_streak",
      title: `Protect Your ${atRisk.streak}-Day Streak`,
      description: `Your streak on "${atRisk.title}" is at risk. Complete it today to keep it alive.`,
      difficulty: "Easy",
      icon: "🔥",
      // XAI fields
      reason: `"${atRisk.title}" has a ${atRisk.streak}-day streak but only ${atRisk.lastWeekCompletion}% completion this week — streak loss is imminent without action.`,
      dataPoint: `${atRisk.streak}-day streak, ${atRisk.lastWeekCompletion}% last 7 days`,
      confidence: 92,
      evidenceTags: ["streak_at_risk"],
    });
  }

  return recommendations.slice(0, 5);
}

/* ─────────────────────────────────────────
   INSIGHTS GENERATOR
───────────────────────────────────────── */

function generateWeeklyInsights(habitStats) {
  const insights = [];
  if (habitStats.length === 0) return insights;

  const avgCompletion = Math.round(
    habitStats.reduce((sum, s) => sum + s.completionRate, 0) /
      habitStats.length,
  );
  const avgWeekCompletion = Math.round(
    habitStats.reduce((sum, s) => sum + s.lastWeekCompletion, 0) /
      habitStats.length,
  );

  /* ── Overall completion insight ── */
  if (avgCompletion >= 80) {
    insights.push({
      type: "excellent",
      title: "On Fire! 🔥",
      message: `You're maintaining ${avgCompletion}% consistency across all habits — top 10% territory.`,
      icon: "flame",
      dataPoint: `${avgCompletion}% avg completion`,
    });
  } else if (avgCompletion >= 60) {
    insights.push({
      type: "good",
      title: "Good Progress",
      message: `${avgCompletion}% average completion. You need ${80 - avgCompletion}% more to hit the "excellent" zone.`,
      icon: "trend",
      dataPoint: `${80 - avgCompletion}% gap to excellent`,
    });
  } else {
    insights.push({
      type: "moderate",
      title: "Room to Improve",
      message: `Your completion rate is ${avgCompletion}%. Focus on just 1–2 habits this week to build momentum.`,
      icon: "alert",
      dataPoint: `${avgCompletion}% avg completion`,
    });
  }

  /* ── Week-over-week trend ── */
  if (avgWeekCompletion > avgCompletion + 5) {
    insights.push({
      type: "trend_up",
      title: "Weekly Momentum ↑",
      message: `Your last 7 days (${avgWeekCompletion}%) are outperforming your all-time average (${avgCompletion}%). Keep this up!`,
      icon: "trend",
      dataPoint: `+${avgWeekCompletion - avgCompletion}% vs all-time average`,
    });
  } else if (avgWeekCompletion < avgCompletion - 5) {
    insights.push({
      type: "trend_down",
      title: "Weekly Dip ↓",
      message: `Last 7 days (${avgWeekCompletion}%) are below your all-time average (${avgCompletion}%). Time to re-engage.`,
      icon: "alert",
      dataPoint: `-${avgCompletion - avgWeekCompletion}% vs all-time average`,
    });
  }

  /* ── Best habit spotlight ── */
  const bestHabit = habitStats.reduce((best, cur) =>
    cur.completionRate > best.completionRate ? cur : best,
  );
  if (bestHabit) {
    insights.push({
      type: "best_habit",
      title: "Star Habit ⭐",
      message: `"${bestHabit.title}" is your strongest habit at ${bestHabit.completionRate}% with a ${bestHabit.streak}-day streak.`,
      icon: "star",
      dataPoint: `${bestHabit.completionRate}% completion, ${bestHabit.streak}-day streak`,
    });
  }

  /* ── Streak milestone ── */
  const longestStreak = Math.max(...habitStats.map((s) => s.streak), 0);
  if (longestStreak >= 7) {
    insights.push({
      type: "milestone",
      title: `${longestStreak}-Day Streak 🚀`,
      message: `You've hit a ${longestStreak}-day streak. Research shows habits become automatic around day 21.`,
      icon: "milestone",
      dataPoint: `${longestStreak} consecutive days`,
    });
  }

  /* ── Consistency across habits ── */
  const consistentHabits = habitStats.filter(
    (s) => s.completionRate >= 70,
  ).length;
  if (consistentHabits > 0 && habitStats.length > 1) {
    insights.push({
      type: "consistency",
      title: "Consistency Score",
      message: `${consistentHabits} of ${habitStats.length} habits are at or above the 70% healthy threshold.`,
      icon: "trend",
      dataPoint: `${consistentHabits}/${habitStats.length} habits ≥ 70%`,
    });
  }

  return insights.slice(0, 5);
}

/* ─────────────────────────────────────────
   CHALLENGE SUGGESTIONS GENERATOR
───────────────────────────────────────── */

function generateChallengeSuggestions(habitStats) {
  const challenges = [];
  const avgStreak = Math.round(
    habitStats.reduce((sum, s) => sum + s.streak, 0) / (habitStats.length || 1),
  );
  const avgCompletion = Math.round(
    habitStats.reduce((sum, s) => sum + s.completionRate, 0) /
      (habitStats.length || 1),
  );

  challenges.push({
    type: "consistency",
    title: "7-Day Consistency Challenge",
    description: "Complete all habits for 7 consecutive days.",
    reward: 100,
    difficulty: "Medium",
    icon: "📅",
    target: 7,
    reason: `Your current average streak is ${avgStreak} day${avgStreak !== 1 ? "s" : ""}. A 7-day streak proves consistency.`,
    dataPoint: `Avg streak: ${avgStreak} days`,
  });

  if (avgStreak < 30) {
    challenges.push({
      type: "streak",
      title: "30-Day Streak Challenge",
      description: "Maintain a 30-day streak on any single habit.",
      reward: 250,
      difficulty: "Hard",
      icon: "🔥",
      target: 30,
      reason: `Your longest current streak is ${Math.max(...habitStats.map((s) => s.streak), 0)} days. 30 days is where habits become truly automatic.`,
      dataPoint: `Best streak: ${Math.max(...habitStats.map((s) => s.streak), 0)} days`,
    });
  }

  challenges.push({
    type: "perfect_week",
    title: "Perfect Week",
    description: "Achieve 100% completion across all habits for one full week.",
    reward: 200,
    difficulty: "Hard",
    icon: "✨",
    target: 7,
    reason: `Your best recent week hit ${Math.max(...habitStats.map((s) => s.lastWeekCompletion), 0)}%. A perfect week is your next benchmark.`,
    dataPoint: `Best recent week: ${Math.max(...habitStats.map((s) => s.lastWeekCompletion), 0)}%`,
  });

  const lowPerformers = habitStats.filter((s) => s.completionRate < 50);
  if (lowPerformers.length > 0) {
    const target = lowPerformers[0];
    challenges.push({
      type: "rescue_mission",
      title: `Rescue: "${target.title}"`,
      description: `Bring "${target.title}" from ${target.completionRate}% to 80% completion.`,
      reward: 150,
      difficulty: "Medium",
      icon: "🆘",
      target: 80,
      reason: `"${target.title}" is your lowest-performing habit at ${target.completionRate}%. Targeted focus will break the pattern.`,
      dataPoint: `Current: ${target.completionRate}%, Target: 80%`,
    });
  }

  if (avgCompletion >= 70) {
    challenges.push({
      type: "habit_stacking",
      title: "Add a New Habit",
      description: "Add 1 new habit and keep it for 14 days.",
      reward: 175,
      difficulty: "Medium",
      icon: "➕",
      target: 14,
      reason: `With ${avgCompletion}% average completion, you have the capacity to absorb a new habit without disrupting existing ones.`,
      dataPoint: `Avg completion: ${avgCompletion}%`,
    });
  }

  return challenges.slice(0, 4);
}

/* ─────────────────────────────────────────
   MAIN CONTROLLER
───────────────────────────────────────── */

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
            description: "Begin with a daily 10-minute walk or stretch.",
            reason:
              "Movement habits have the highest long-term adherence rate for beginners — low friction, high reward.",
            dataPoint: "0 habits tracked",
            difficulty: "Easy",
            icon: "🚶",
            confidence: 95,
            evidenceTags: ["starter"],
          },
          {
            type: "starter",
            title: "Morning Hydration",
            description: "Drink a glass of water first thing every morning.",
            reason:
              "This is the #1 keystone habit — it signals your brain that your day has started with intention.",
            dataPoint: "0 habits tracked",
            difficulty: "Easy",
            icon: "💧",
            confidence: 95,
            evidenceTags: ["starter"],
          },
        ],
        insights: [],
        challenges: [],
        meta: { totalHabits: 0, avgCompletion: 0 },
      });
    }

    const habitStats = buildHabitStats(habits, logs);
    const recommendations = generateRecommendations(habitStats, habits);
    const insights = generateWeeklyInsights(habitStats);
    const challenges = generateChallengeSuggestions(habitStats);

    const avgCompletion = Math.round(
      habitStats.reduce((sum, s) => sum + s.completionRate, 0) /
        habitStats.length,
    );

    res.json({
      recommendations,
      insights,
      challenges,
      meta: {
        totalHabits: habits.length,
        avgCompletion,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("RECOMMENDATIONS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Detailed explanation for a recommendation type
 */
export const getRecommendationDetails = async (req, res) => {
  try {
    const { type } = req.query;

    const details = {
      missing_category: {
        title: "Expand Your Routine",
        description:
          "Adding habits from different life areas creates resilience — if one habit slips, others maintain your momentum.",
        tips: [
          "Start with just 2 minutes per day — lower the bar to guarantee success",
          "Link the new habit immediately after an existing strong one (habit stacking)",
          "Give yourself 2 weeks before judging if it fits",
        ],
        science:
          "Research by Wendy Wood (USC) shows that environmental variety in habits improves long-term adherence.",
      },
      boost_low_performer: {
        title: "Turn Around Struggling Habits",
        description:
          "Low-performing habits usually fail because of friction, not willpower. Reduce the commitment size.",
        tips: [
          "Make it ridiculously small: '2 push-ups' instead of '30-minute workout'",
          "Move it to a different time of day — mornings have 40% higher adherence",
          "Remove friction: lay out equipment the night before",
        ],
        science:
          "B.J. Fogg's Tiny Habits research shows that making a behavior easier is more effective than increasing motivation.",
      },
      stack_habits: {
        title: "Leverage Your Strongest Habits",
        description:
          "Your high-performing habits are anchors — use them to build new behaviors with zero extra willpower.",
        tips: [
          "State your habit stack as: 'After I [existing habit], I will [new habit]'",
          "Keep the new habit under 5 minutes initially",
          "Celebrate immediately after — a fist pump is enough",
        ],
        science:
          "Charles Duhigg's research on habit loops shows that cue-routine-reward chains are 70% more likely to stick.",
      },
      trend_warning: {
        title: "Reverse a Declining Trend",
        description:
          "A declining habit is not a failed habit — it's a signal to adjust context, not give up.",
        tips: [
          "Schedule it at a fixed protected time on your calendar",
          "Find an accountability partner or public commitment",
          "Identify and remove the obstacle that appeared this week",
        ],
        science:
          "Studies on habit recovery show that people who re-engage within 2 weeks of a lapse fully recover their streak.",
      },
      protect_streak: {
        title: "Protect Your Streak",
        description:
          "Long streaks create psychological momentum. Losing them is more demotivating than never starting.",
        tips: [
          "Use a 'never miss twice' rule — one miss is human, two is a new pattern",
          "Set a 9pm reminder as your streak safety net",
          "Keep a minimal version of the habit for busy days",
        ],
        science:
          "Loss aversion research shows protecting a streak feels 2.5x more motivating than building a new one.",
      },
    };

    res.json(
      details[type] || {
        title: "General Advice",
        description:
          "Consistency over perfection is the foundation of every lasting habit.",
        tips: [
          "Start with the easiest possible version of this habit",
          "Track it daily even on bad days",
          "Review and adjust every 2 weeks",
        ],
      },
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
