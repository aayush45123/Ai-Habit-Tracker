// server/src/controllers/aiController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";
import { completeWithGroq, extractAndParseJSON } from "../utils/aiClient.js";

/* ─────────────────────────────────────────
   PRE-COMPUTE STATS
   Build a rich summary so Groq has structured
   input rather than raw log arrays — reduces
   token usage and improves output quality.
───────────────────────────────────────── */

function buildHabitSummary(habits, logs) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

  return habits.map((habit) => {
    const habitLogs = logs.filter(
      (l) => l.habitId?.toString() === habit._id?.toString(),
    );
    const doneCount = habitLogs.filter((l) => l.status === "done").length;
    const totalLogs = habitLogs.length;
    const completionRate =
      totalLogs === 0 ? 0 : Math.round((doneCount / totalLogs) * 100);

    const recentLogs = habitLogs.filter(
      (l) => new Date(l.date) >= sevenDaysAgo,
    );
    const recentDone = recentLogs.filter((l) => l.status === "done").length;
    const recentRate =
      recentLogs.length === 0
        ? 0
        : Math.round((recentDone / recentLogs.length) * 100);

    return {
      title: habit.title,
      category: habit.category || "General",
      streak: habit.streak || 0,
      completionRate,
      recentRate,
      totalDays: totalLogs,
      trend:
        recentRate > completionRate + 10
          ? "improving"
          : recentRate < completionRate - 10
            ? "declining"
            : "stable",
    };
  });
}

/* ─────────────────────────────────────────
   SMART LOCAL FALLBACK RESPONSE
───────────────────────────────────────── */

function buildHeuristicInsights(habitSummary, reason = "offline") {
  if (!habitSummary || habitSummary.length === 0) {
    return {
      summary: "Start tracking and completing habits daily to unlock personalized insights.",
      strongest: "",
      weakest: "",
      bestDay: "Consistent Daily",
      recommendations: [
        {
          action: "Log your habit completions every evening",
          because: "Daily consistency helps build long-term routines",
          dataPoint: "Initial setup phase",
          priority: "high",
        },
      ],
      motivation: "Every journey begins with a single consistent step.",
      shortSummary: "Track habits daily to build momentum.",
      explainability: {
        strongestReason: "Data is accumulating.",
        weakestReason: "Keep tracking to identify areas of improvement.",
        bestDayReason: "Building baseline schedule.",
        overallHealthScore: 70,
        keyInsight: "Building initial momentum.",
        riskFactors: ["Inconsistent logging"],
        positiveFactors: ["Actively tracking"],
      },
    };
  }

  // Find strongest and weakest
  const sorted = [...habitSummary].sort((a, b) => b.completionRate - a.completionRate);
  const strongest = sorted[0]?.title || "";
  const weakest = sorted[sorted.length - 1]?.title || "";
  const avgRate = Math.round(sorted.reduce((acc, h) => acc + h.completionRate, 0) / sorted.length) || 0;

  const recommendations = [];
  if (weakest && weakest !== strongest) {
    recommendations.push({
      action: `Set a specific time anchor for "${weakest}"`,
      because: `This habit has the lowest completion rate (${sorted[sorted.length - 1]?.completionRate || 0}%)`,
      dataPoint: `${sorted[sorted.length - 1]?.completionRate || 0}% completion`,
      priority: "high",
    });
  }
  if (strongest) {
    recommendations.push({
      action: `Protect your streak on "${strongest}"`,
      because: `It is your top performing habit with a ${sorted[0]?.streak || 0}-day streak`,
      dataPoint: `${sorted[0]?.streak || 0} day streak`,
      priority: "medium",
    });
  }

  return {
    summary: `You are maintaining an average habit completion rate of ${avgRate}%. Your strongest habit is "${strongest}". Keep pushing consistency on "${weakest || strongest}".`,
    strongest,
    weakest,
    bestDay: "Consistent Daily",
    recommendations,
    motivation: "Consistency is what transforms average into excellence.",
    shortSummary: `Average completion is ${avgRate}%. Strongest: ${strongest || "None"}.`,
    explainability: {
      strongestReason: `${strongest} has your highest completion rate (${sorted[0]?.completionRate || 0}%).`,
      weakestReason: `${weakest} has your lowest completion rate (${sorted[sorted.length - 1]?.completionRate || 0}%).`,
      bestDayReason: "Aggregated from recent completion trends.",
      overallHealthScore: Math.min(100, Math.max(20, avgRate)),
      keyInsight: `Maintaining ${sorted[0]?.streak || 0}-day momentum on top habits.`,
      riskFactors: sorted.filter((h) => h.trend === "declining").map((h) => `${h.title} is trending downwards`),
      positiveFactors: sorted.filter((h) => h.trend === "improving").map((h) => `${h.title} is improving`),
    },
  };
}

/* ─────────────────────────────────────────
   MAIN CONTROLLER
───────────────────────────────────────── */

export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user;

    /* ── Fetch data ── */
    const habits = await Habit.find({ userId });
    const habitIds = habits.map((h) => h._id);
    const logs = await HabitLog.find({
      habitId: { $in: habitIds },
    }).sort({ date: 1 });

    const profile = await CalorieProfile.findOne({ userId });
    let profileContext = "";
    if (profile) {
      profileContext = `\nUser Profile context:\n- Age: ${profile.age}\n- Height: ${profile.height} cm\n- Weight: ${profile.weight} kg\n- Gender: ${profile.gender}\n- Activity Level: ${profile.activityLevel}\n- Fitness Goal: ${profile.goal}`;
    }

    if (!logs.length) {
      return res.json({
        ai: {
          summary:
            "You don't have enough data yet. Start completing habits to unlock AI insights.",
          strongest: "",
          weakest: "",
          bestDay: "",
          recommendations: [],
          motivation: "Every journey starts with a single step.",
          shortSummary: "Not enough data yet — consistency unlocks insights.",
          explainability: null,
        },
      });
    }

    /* ── Normalize dates to IST ── */
    const normalizedLogs = logs.map((l) => ({
      ...l._doc,
      date: normalizeDateIST(l.date),
    }));

    /* ── Build compact summary instead of sending raw data ── */
    const habitSummary = buildHabitSummary(habits, normalizedLogs);

    /* ── Groq prompt ── */
    const systemPrompt = `
You are an expert habit coach AI. Analyze the habit data and return ONLY a valid JSON object.

CRITICAL RULES:
- Return raw JSON only. No markdown, no code fences, no explanation.
- Every "recommendations" item MUST include "action", "because", and "dataPoint".
- "because" must reference specific numbers from the data, not generic advice.
- "explainability" must be filled with real reasoning derived from the data.

Required JSON schema:
{
  "summary": "2-3 sentence narrative summary of the user's overall habit health",
  "strongest": "name of the single strongest habit",
  "weakest": "name of the single weakest habit",
  "bestDay": "day of week (e.g. Monday) with historically best performance",
  "recommendations": [
    {
      "action": "specific actionable recommendation string",
      "because": "data-driven reason referencing actual numbers",
      "dataPoint": "the key metric that triggered this recommendation",
      "priority": "high | medium | low"
    }
  ],
  "motivation": "one powerful motivational sentence personalized to their data",
  "explainability": {
    "strongestReason": "why this habit was identified as strongest (reference completion % and streak)",
    "weakestReason": "why this habit was identified as weakest (reference specific numbers)",
    "bestDayReason": "what data pattern revealed this best day",
    "overallHealthScore": 85,
    "keyInsight": "the single most important pattern in this user's data",
    "riskFactors": ["list of data-supported risk factors"],
    "positiveFactors": ["list of data-supported positive signals"]
  }
}
    `.trim();

    let parsed = null;

    try {
      const { content } = await completeWithGroq({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze these habits:\n${JSON.stringify(habitSummary, null, 2)}${profileContext ? `\n\nAlso consider the user's profile details when formulating habit recommendations:\n${profileContext}` : ""}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1200,
        jsonMode: true,
      });

      parsed = extractAndParseJSON(content);
    } catch (apiErr) {
      console.warn("AI generation failed, generating heuristic insights:", apiErr.message);
    }

    if (!parsed || !parsed.summary) {
      parsed = buildHeuristicInsights(habitSummary);
    }

    /* ── Ensure recommendations is always an array of objects ── */
    if (Array.isArray(parsed.recommendations)) {
      parsed.recommendations = parsed.recommendations.map((r) => {
        if (typeof r === "string") {
          return { action: r, because: "", dataPoint: "", priority: "medium" };
        }
        return r;
      });
    } else {
      parsed.recommendations = [];
    }

    /* ── Build shortSummary ── */
    if (!parsed.shortSummary) {
      parsed.shortSummary = [
        parsed.summary || "",
        parsed.strongest ? `Strongest: ${parsed.strongest}.` : "",
        parsed.weakest ? `Weakest: ${parsed.weakest}.` : "",
        "Keep going — small wins compound!",
      ]
        .filter(Boolean)
        .join(" ");
    }

    return res.json({ ai: parsed });
  } catch (err) {
    console.error("AI INSIGHTS CONTROLLER ERROR:", err);
    // Never send 500 - fallback gracefully to ensure UI renders
    return res.json({
      ai: buildHeuristicInsights([], "error"),
    });
  }
};
