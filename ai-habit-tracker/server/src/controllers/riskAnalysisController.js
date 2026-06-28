// server/src/controllers/riskAnalysisController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/**
 * Returns ISO date string for N days ago (UTC midnight)
 */
function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/**
 * Compute a 0-100 confidence score for the prediction.
 * Weights: completion rate (50%), streak (30%), recent 7-day rate (20%)
 */
function computeConfidence(completionRate, streak, recentRate) {
  const streakScore = Math.min(streak * 10, 100); // cap at 100
  const raw = completionRate * 0.5 + streakScore * 0.3 + recentRate * 0.2;
  return Math.round(Math.min(Math.max(raw, 0), 100));
}

/**
 * Build human-readable explanations for why a risk level was assigned.
 */
function buildReasons(
  completionRate,
  streak,
  recentRate,
  totalLogs,
  recentDone,
) {
  const reasons = [];

  if (completionRate < 40) {
    reasons.push(
      `Only ${completionRate}% of all tracked days were completed (${totalLogs} total logs)`,
    );
  } else if (completionRate < 70) {
    reasons.push(
      `Completion rate is ${completionRate}% — below the 70% healthy threshold`,
    );
  } else {
    reasons.push(`Strong overall completion rate of ${completionRate}%`);
  }

  if (streak === 0) {
    reasons.push("No active streak — habit has not been done recently");
  } else if (streak < 3) {
    reasons.push(
      `Current streak is only ${streak} day${streak === 1 ? "" : "s"} — momentum is fragile`,
    );
  } else if (streak < 7) {
    reasons.push(`Streak of ${streak} days — building momentum`);
  } else {
    reasons.push(`Strong ${streak}-day streak — solid momentum`);
  }

  if (recentDone === 0) {
    reasons.push("Not completed a single time in the last 7 days");
  } else if (recentRate < 43) {
    reasons.push(
      `Completed only ${recentDone} out of last 7 days (${recentRate}%)`,
    );
  } else if (recentRate < 71) {
    reasons.push(
      `Completed ${recentDone} out of last 7 days — room to improve`,
    );
  } else {
    reasons.push(
      `Completed ${recentDone} out of last 7 days — good recent trend`,
    );
  }

  return reasons;
}

/**
 * Factor weights shown as progress bars in the UI.
 * Each factor has a label, a 0-100 value, and a weight (proportion of decision).
 */
function buildFactorWeights(completionRate, streak, recentRate) {
  const streakScore = Math.min(streak * 10, 100);
  return [
    {
      label: "Overall Completion",
      value: completionRate,
      weight: 50,
      description: `${completionRate}% of all logged days marked done`,
    },
    {
      label: "Streak Strength",
      value: streakScore,
      weight: 30,
      description: `${streak} day streak (10 pts per day, max 100)`,
    },
    {
      label: "Last 7 Days",
      value: recentRate,
      weight: 20,
      description: `${recentRate}% completion in the past week`,
    },
  ];
}

/**
 * Build a one-line recommended action based on the risk level and data.
 */
function buildActionSuggestion(
  risk,
  prediction,
  streak,
  completionRate,
  recentRate,
) {
  if (risk === "HIGH" && streak === 0) {
    return "Start fresh today — even a single log resets momentum.";
  }
  if (risk === "HIGH" && recentRate < 30) {
    return "Schedule this habit at a fixed time to rebuild consistency.";
  }
  if (risk === "MEDIUM" && completionRate >= 60) {
    return "You're close to the healthy zone — push for 3 more completions this week.";
  }
  if (risk === "MEDIUM") {
    return "Break this habit into smaller steps to reduce friction.";
  }
  if (prediction === "LIKELY_SUCCESS" && risk === "LOW") {
    return "Keep going! You're on track — protect your streak.";
  }
  return "Stay consistent. Small daily wins compound over time.";
}

/* ─────────────────────────────────────────
   MAIN CONTROLLER
───────────────────────────────────────── */

export const getRiskAnalysis = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });

    if (!habits.length) {
      return res.json([]);
    }

    const report = [];
    const sevenDaysAgo = daysAgo(7);
    const thirtyDaysAgo = daysAgo(30);

    for (const habit of habits) {
      /* ── Raw log data ── */
      const logs = await HabitLog.find({ habitId: habit._id }).sort({
        date: 1,
      });
      const totalLogs = logs.length;

      const doneCount = logs.filter((l) => l.status === "done").length;
      const completionRate =
        totalLogs === 0 ? 0 : Math.round((doneCount / totalLogs) * 100);

      /* ── Recent 7-day window ── */
      const recentLogs = logs.filter((l) => new Date(l.date) >= sevenDaysAgo);
      const recentDone = recentLogs.filter((l) => l.status === "done").length;
      const recentRate =
        recentLogs.length === 0
          ? 0
          : Math.round((recentDone / recentLogs.length) * 100);

      /* ── Last 30-day trend ── */
      const monthLogs = logs.filter((l) => new Date(l.date) >= thirtyDaysAgo);
      const monthDone = monthLogs.filter((l) => l.status === "done").length;
      const monthRate =
        monthLogs.length === 0
          ? 0
          : Math.round((monthDone / monthLogs.length) * 100);

      /* ── Risk level (rule-based) ── */
      let risk = "LOW";
      if (completionRate < 40) {
        risk = "HIGH";
      } else if (completionRate < 70) {
        risk = "MEDIUM";
      }

      /* ── Prediction ── */
      let prediction = "LIKELY_FAILURE";
      if (habit.streak >= 6) {
        prediction = "LIKELY_SUCCESS";
      } else if (habit.streak >= 3 && completionRate >= 70) {
        prediction = "LIKELY_SUCCESS";
      } else if (habit.streak < 3 && completionRate >= 80) {
        prediction = "LIKELY_SUCCESS";
      }

      /* ── XAI fields ── */
      const confidence = computeConfidence(
        completionRate,
        habit.streak,
        recentRate,
      );
      const reasons = buildReasons(
        completionRate,
        habit.streak,
        recentRate,
        totalLogs,
        recentDone,
      );
      const factorWeights = buildFactorWeights(
        completionRate,
        habit.streak,
        recentRate,
      );
      const actionSuggestion = buildActionSuggestion(
        risk,
        prediction,
        habit.streak,
        completionRate,
        recentRate,
      );

      /* ── Trend direction ── */
      // Compare recent 7-day rate to 30-day rate
      let trend = "stable";
      if (recentRate > monthRate + 10) trend = "improving";
      else if (recentRate < monthRate - 10) trend = "declining";

      report.push({
        habitId: habit._id,
        habit: habit.title,
        category: habit.category || "General",
        streak: habit.streak,
        longestStreak: habit.longestStreak || habit.streak,
        completionRate,
        recentRate,
        monthRate,
        totalLogs,
        risk,
        prediction,
        confidence, // 0-100 confidence in the prediction
        reasons, // WHY this risk was assigned (array of strings)
        factorWeights, // breakdown for UI progress bars
        actionSuggestion, // one actionable next step
        trend, // "improving" | "stable" | "declining"
      });
    }

    // Sort: highest risk first, then lowest completion
    report.sort((a, b) => {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[a.risk] - riskOrder[b.risk];
      }
      return a.completionRate - b.completionRate;
    });

    res.json(report);
  } catch (err) {
    console.error("RISK ANALYSIS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
