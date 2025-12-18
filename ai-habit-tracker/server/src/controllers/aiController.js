import OpenAI from "openai";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

/* ===========================
   GROQ CLIENT
=========================== */
function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/* ===========================
   AI INSIGHTS CONTROLLER
=========================== */
export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user;

    /* ---------------------------
       FETCH DATA
    ---------------------------- */
    const habits = await Habit.find({ userId });
    const habitIds = habits.map((h) => h._id);

    const logs = await HabitLog.find({
      habitId: { $in: habitIds },
    }).sort({ date: 1 });

    if (!logs.length) {
      return res.json({
        ai: {
          summary:
            "You don’t have enough data yet. Start completing habits to unlock insights.",
          strongest: "",
          weakest: "",
          bestDay: "",
          recommendations: [],
          motivation: "",
          shortSummary: "Not enough data yet — consistency unlocks insights.",
        },
      });
    }

    /* ---------------------------
       INIT GROQ
    ---------------------------- */
    const groq = createGroqClient();
    if (!groq) {
      return res.status(500).json({
        message: "GROQ_API_KEY not set",
      });
    }

    /* ---------------------------
       CALL GROQ
    ---------------------------- */
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `
Return a VALID JSON OBJECT ONLY.
DO NOT wrap it in quotes.
DO NOT prefix with "json".
DO NOT explain anything.

Required JSON format:
{
  "summary": "string",
  "strongest": "string",
  "weakest": "string",
  "bestDay": "string",
  "recommendations": ["string", "string", "string"],
  "motivation": "string"
}
            `.trim(),
          },
          {
            role: "user",
            content: JSON.stringify({ habits, logs }),
          },
        ],
      });
    } catch (apiErr) {
      /* ---------------------------
         🔴 RATE LIMIT / QUOTA HANDLING
      ---------------------------- */
      if (apiErr?.status === 429) {
        console.error(
          "🚫 GROQ RATE LIMIT EXCEEDED:",
          apiErr?.error?.message || apiErr.message
        );

        return res.json({
          ai: {
            summary:
              "AI usage limit reached. Insights will be available again later.",
            strongest: "",
            weakest: "",
            bestDay: "",
            recommendations: [],
            motivation:
              "You're doing great — even without AI, consistency is what matters.",
            shortSummary:
              "AI limit reached. Core habit tracking still works perfectly.",
          },
        });
      }

      console.error("❌ GROQ API ERROR:", apiErr);
      throw apiErr;
    }

    /* ---------------------------
       CLEAN & PARSE RESPONSE
    ---------------------------- */
    let raw = completion.choices[0].message.content.trim();

    raw = raw
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(raw);

      // Safety: summary accidentally contains JSON
      if (
        typeof parsed.summary === "string" &&
        parsed.summary.trim().startsWith("{")
      ) {
        parsed = JSON.parse(parsed.summary);
      }
    } catch (err) {
      console.error("⚠️ GROQ JSON PARSE FAILED:", err);

      parsed = {
        summary: raw,
        strongest: "",
        weakest: "",
        bestDay: "",
        recommendations: [],
        motivation: "",
      };
    }

    /* ---------------------------
       SHORT SUMMARY
    ---------------------------- */
    parsed.shortSummary = `
${parsed.summary || ""}
Strongest habit: ${parsed.strongest || "N/A"}.
Weakest habit: ${parsed.weakest || "N/A"}.
Keep going — small wins add up!
    `.trim();

    return res.json({ ai: parsed });
  } catch (err) {
    console.error("🔥 AI INSIGHTS ERROR:", err);
    return res.status(500).json({
      message: "AI insights failed",
      error: err.message,
    });
  }
};
