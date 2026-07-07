// server/src/controllers/aiController.js
import OpenAI from "openai";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";

/* ─────────────────────────────────────────
   GROQ CLIENT
───────────────────────────────────────── */

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

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
   FALLBACK RESPONSE
───────────────────────────────────────── */

function buildFallback(reason = "rate_limit") {
  return {
    summary:
      reason === "rate_limit"
        ? "AI usage limit reached. Insights will be available again shortly."
        : "Could not generate insights at this time. Your data is safe.",
    strongest: "",
    weakest: "",
    bestDay: "",
    recommendations: [],
    motivation:
      "You're doing great — even without AI, consistency is what matters.",
    shortSummary:
      reason === "rate_limit"
        ? "AI limit reached. Core habit tracking still works perfectly."
        : "AI temporarily unavailable.",
    explainability: null,
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

    /* ── Init Groq ── */
    const groq = createGroqClient();
    if (!groq) {
      return res.status(500).json({ message: "GROQ_API_KEY not configured." });
    }

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
    "overallHealthScore": "a number 0-100 representing overall habit health",
    "keyInsight": "the single most important pattern in this user's data",
    "riskFactors": ["list of data-supported risk factors"],
    "positiveFactors": ["list of data-supported positive signals"]
  }
}
    `.trim();

    /* ── Call Groq ── */
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze these habits:\n${JSON.stringify(habitSummary, null, 2)}${profileContext ? `\n\nAlso consider the user's profile details when formulating habit recommendations:\n${profileContext}` : ""}`,
          },
        ],
      });
    } catch (apiErr) {
      if (apiErr?.status === 429) {
        console.error(
          "GROQ RATE LIMIT:",
          apiErr?.error?.message || apiErr.message,
        );
        return res.json({ ai: buildFallback("rate_limit") });
      }
      console.error("GROQ API ERROR:", apiErr);
      throw apiErr;
    }

    /* ── Parse response ── */
    let raw = completion.choices[0].message.content.trim();

    // Strip markdown fences if present
    raw = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);

      // Guard: summary accidentally contains entire JSON
      if (
        typeof parsed.summary === "string" &&
        parsed.summary.trim().startsWith("{")
      ) {
        parsed = JSON.parse(parsed.summary);
      }
    } catch (parseErr) {
      console.error("GROQ JSON PARSE FAILED:", parseErr, "\nRaw:", raw);
      parsed = {
        summary: raw,
        strongest: "",
        weakest: "",
        bestDay: "",
        recommendations: [],
        motivation: "",
        explainability: null,
      };
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
    parsed.shortSummary = [
      parsed.summary || "",
      parsed.strongest ? `Strongest: ${parsed.strongest}.` : "",
      parsed.weakest ? `Weakest: ${parsed.weakest}.` : "",
      "Keep going — small wins compound!",
    ]
      .filter(Boolean)
      .join(" ");

    return res.json({ ai: parsed });
  } catch (err) {
    console.error("AI INSIGHTS ERROR:", err);
    return res.status(500).json({
      message: "AI insights failed",
      error: err.message,
    });
  }
};
