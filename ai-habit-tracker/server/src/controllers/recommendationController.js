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
───────────────────────────────────────── */

function buildHabitStats(habits, logs) {
  const sevenDaysAgo = daysAgo(7);
  const fourteenDaysAgo = daysAgo(14);

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

    const previousWeekLogs = habitLogs.filter(
      (l) => new Date(l.date) >= fourteenDaysAgo && new Date(l.date) < sevenDaysAgo,
    );
    const previousWeekDone = previousWeekLogs.filter((l) => l.status === "done").length;
    const previousWeekCompletion =
      previousWeekLogs.length === 0
        ? 0
        : Math.round((previousWeekDone / previousWeekLogs.length) * 100);

    let trend = "stable";
    if (lastWeekCompletion > completionRate + 10) trend = "improving";
    else if (lastWeekCompletion < completionRate - 10) trend = "declining";

    return {
      id: habit._id,
      title: habit.title,
      category: habit.category || "General",
      completionRate,
      lastWeekCompletion,
      previousWeekCompletion,
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
───────────────────────────────────────── */

function generateRecommendations(habitStats, habits) {
  const recommendations = [];

  /* ── Category gap analysis ── */
  const categories = {};
  habitStats.forEach((s) => {
    if (!categories[s.category]) categories[s.category] = [];
    categories[s.category].push(s);
  });

  const allCategories = ["Health", "Learning", "Fitness", "Productivity", "Mindfulness", "Social", "Creative"];
  const missingCategories = allCategories.filter((c) => !categories[c]);
  const coveredCount = allCategories.length - missingCategories.length;

  missingCategories.slice(0, 1).forEach((cat) => {
    recommendations.push({
      type: "missing_category",
      title: `Strategic Expansion: ${cat}`,
      priority: "MEDIUM",
      estimatedTime: "5 mins/day",
      expectedBenefit: "Improve lifestyle balance by 14%",
      difficulty: "Easy",
      icon: "FaPuzzlePiece",
      why: {
        text: `You currently track habits in ${coveredCount} of ${allCategories.length} categories.`,
        metric: `Users who track habits in 4+ categories show a 14% higher overall retention rate.`
      },
      actionPlan: [
        `Select a 5-minute activity related to ${cat}`,
        `Link it immediately after an existing anchor habit`,
        `Set a daily alarm for the first 7 days`
      ],
      buttonLabel: "Create Habit",
    });
  });

  /* ── Low performer ── */
  const lowPerformers = habitStats
    .filter((s) => s.completionRate < 50)
    .sort((a, b) => a.completionRate - b.completionRate);

  if (lowPerformers.length > 0) {
    const worst = lowPerformers[0];
    const missedLastWeek = 7 - worst.lastWeekDone;
    
    recommendations.push({
      type: "boost_low_performer",
      title: `Re-evaluate: ${worst.title}`,
      priority: "HIGH",
      estimatedTime: "2 mins/day",
      expectedBenefit: `Improve consistency by 22%`,
      difficulty: "Medium",
      icon: "FaExclamationTriangle",
      why: {
        text: `You skipped "${worst.title}" ${missedLastWeek} times this week.`,
        metric: `Scaling down a habit to 2 minutes improves re-engagement success by 22%.`
      },
      actionPlan: [
        `Reduce the scope of "${worst.title}" to a 2-minute micro-version`,
        `Remove any physical friction (e.g., prepare environment tonight)`,
        `Log completion immediately after executing the micro-version`
      ],
      buttonLabel: "Optimize Habit",
    });
  }

  /* ── Habit stacking ── */
  const highPerformers = habitStats
    .filter((s) => s.completionRate >= 80)
    .sort((a, b) => b.completionRate - a.completionRate);

  if (highPerformers.length >= 1) {
    const anchor = highPerformers[0];
    recommendations.push({
      type: "stack_habits",
      title: "Leverage Momentum (Habit Stacking)",
      priority: "MEDIUM",
      estimatedTime: "10 mins/day",
      expectedBenefit: "Boost new habit success by 70%",
      difficulty: "Easy",
      icon: "FaLink",
      why: {
        text: `"${anchor.title}" is your strongest anchor with an ${anchor.completionRate}% success rate.`,
        metric: `Attaching a new behavior to an established anchor increases success probability by 70%.`
      },
      actionPlan: [
        `Identify a new goal you've been putting off`,
        `Commit to executing it immediately after "${anchor.title}"`,
        `Track both habits together for the next 14 days`
      ],
      buttonLabel: "Create Stack",
    });
  }

  /* ── Declining trend warning ── */
  const decliningHabits = habitStats.filter((s) => s.trend === "declining");
  if (decliningHabits.length > 0) {
    const declining = decliningHabits[0];
    recommendations.push({
      type: "trend_warning",
      title: `Trend Alert: ${declining.title}`,
      priority: "HIGH",
      estimatedTime: "0 mins (Schedule Change)",
      expectedBenefit: "Prevent streak decay",
      difficulty: "Medium",
      icon: "FaArrowDown",
      why: {
        text: `"${declining.title}" dropped to ${declining.lastWeekCompletion}% this week from your historical average of ${declining.completionRate}%.`,
        metric: `Intervening within 7 days of a decline prevents permanent habit decay.`
      },
      actionPlan: [
        `Identify the specific obstacle that caused this week's drop`,
        `Schedule a protected 10-minute block on your calendar for this habit tomorrow`,
        `Set a non-negotiable "Never Miss Twice" rule`
      ],
      buttonLabel: "Protect Habit",
    });
  }

  return recommendations.slice(0, 4);
}

/* ─────────────────────────────────────────
   CHALLENGES GENERATOR
───────────────────────────────────────── */

function generateChallengeSuggestions(habitStats) {
  const challenges = [];
  const avgStreak = Math.round(
    habitStats.reduce((sum, s) => sum + s.streak, 0) / (habitStats.length || 1),
  );

  challenges.push({
    type: "consistency",
    title: "7-Day Foundation Challenge",
    priority: "HIGH",
    estimatedTime: "Depends on habits",
    expectedBenefit: "Establish behavioral baseline",
    difficulty: "Medium",
    icon: "FaCalendarCheck",
    why: {
      text: `Your current system-wide average streak is ${avgStreak} days.`,
      metric: `Achieving a strict 7-day baseline validates operational consistency and builds neural pathways.`
    },
    actionPlan: [
      `Configure a daily recurring alarm at 8:00 PM for review`,
      `Commit to logging every active habit, even failures`,
      `Secure 7 consecutive days of 100% adherence`
    ],
    buttonLabel: "Start Challenge",
  });

  const bestStreak = Math.max(...habitStats.map((s) => s.streak), 0);
  if (bestStreak < 30 && habitStats.length > 0) {
    challenges.push({
      type: "streak",
      title: "Attain Automaticity (30 Days)",
      priority: "MEDIUM",
      estimatedTime: "Daily effort",
      expectedBenefit: "Lock in habit neural pathway",
      difficulty: "Hard",
      icon: "FaFire",
      why: {
        text: `Your maximum active streak is currently ${bestStreak} days.`,
        metric: `Behavioral psychology indicates robust automaticity begins forming around the 30-day mark.`
      },
      actionPlan: [
        `Isolate your highest-leverage keystone habit`,
        `Prioritize its execution above all secondary goals`,
        `Maintain an unbroken streak for 30 consecutive days`
      ],
      buttonLabel: "Start Challenge",
    });
  }

  return challenges.slice(0, 3);
}

/* ─────────────────────────────────────────
   COACHING SUMMARY GENERATOR
───────────────────────────────────────── */

function generateCoachingSummary(habitStats) {
  if (habitStats.length === 0) {
    return {
      strongestArea: "N/A (Add Habits)",
      biggestWeakness: "N/A (Add Habits)",
      highestPriority: "Establish first habit",
      bestAchievement: "Started Tracking",
      overallProgress: "0%",
    };
  }

  const bestHabit = habitStats.reduce((best, cur) => cur.completionRate > best.completionRate ? cur : best, habitStats[0]);
  const worstHabit = habitStats.reduce((worst, cur) => cur.completionRate < worst.completionRate ? cur : worst, habitStats[0]);
  
  const avgCompletion = Math.round(habitStats.reduce((sum, s) => sum + s.completionRate, 0) / habitStats.length);
  const prevAvgCompletion = Math.round(habitStats.reduce((sum, s) => sum + s.previousWeekCompletion, 0) / habitStats.length);
  const diff = avgCompletion - prevAvgCompletion;
  const progressString = diff > 0 ? `+${diff}% compared to last week` : diff < 0 ? `${diff}% compared to last week` : "Stable compared to last week";

  const longestStreak = Math.max(...habitStats.map(s => s.streak));

  return {
    strongestArea: bestHabit.title || "Habit Consistency",
    biggestWeakness: worstHabit.completionRate < 60 ? worstHabit.title : "None (All >60%)",
    highestPriority: worstHabit.completionRate < 60 ? `Improve ${worstHabit.title}` : "Maintain consistency",
    bestAchievement: `${longestStreak}-day streak`,
    overallProgress: progressString,
  };
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
        coachingSummary: {
          strongestArea: "Ready to Start",
          biggestWeakness: "Action Required",
          highestPriority: "Establish Keystone Habit",
          bestAchievement: "Joined App",
          overallProgress: "Ready for input",
        },
        recommendations: [
          {
            type: "starter",
            title: "Phase 1: Keystone Habit",
            priority: "HIGH",
            estimatedTime: "5 mins/day",
            expectedBenefit: "Establish momentum baseline",
            difficulty: "Easy",
            icon: "FaKey",
            why: {
              text: `You have 0 active habits registered.`,
              metric: `Starting with a single 'keystone' habit prevents cognitive overwhelm and reliably establishes momentum.`
            },
            actionPlan: [
              `Select one low-effort habit (e.g., Drink water upon waking)`,
              `Configure it in the tracker immediately`,
              `Log it today to activate your system`
            ],
            buttonLabel: "Create Habit",
          },
          {
            type: "starter",
            title: "Phase 2: Optimize Environment",
            priority: "MEDIUM",
            estimatedTime: "10 mins setup",
            expectedBenefit: "Reduce friction by 80%",
            difficulty: "Easy",
            icon: "FaTools",
            why: {
              text: `Willpower depletes throughout the day.`,
              metric: `Environmental design is 80% more effective than motivation for early-stage habit formation.`
            },
            actionPlan: [
              `Identify the most prominent point of friction for your intended habit`,
              `Modify your physical environment tonight to eliminate it`,
              `Place visual cues where they cannot be ignored`
            ],
            buttonLabel: "Acknowledge",
          }
        ],
        challenges: [
           {
            type: "onboarding",
            title: "System Activation: First Log",
            priority: "HIGH",
            estimatedTime: "< 1 min",
            expectedBenefit: "Initiate progress tracking",
            difficulty: "Easy",
            icon: "FaRocket",
            why: {
              text: `The system is awaiting initial data input.`,
              metric: `Taking immediate, quantifiable action drastically increases long-term retention probability.`
            },
            actionPlan: [
              `Navigate to the dashboard`,
              `Mark your newly created habit as 'done' for today`
            ],
            buttonLabel: "Start Challenge",
          }
        ],
        meta: { totalHabits: 0, avgCompletion: 0 },
      });
    }

    const habitStats = buildHabitStats(habits, logs);
    const recommendations = generateRecommendations(habitStats, habits);
    const coachingSummary = generateCoachingSummary(habitStats);
    const challenges = generateChallengeSuggestions(habitStats);

    const avgCompletion = Math.round(
      habitStats.reduce((sum, s) => sum + s.completionRate, 0) /
        habitStats.length,
    );

    res.json({
      coachingSummary,
      recommendations,
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

export const getRecommendationDetails = async (req, res) => {
  res.json({ message: "Deprecated - detailed reasons now inline." });
};
