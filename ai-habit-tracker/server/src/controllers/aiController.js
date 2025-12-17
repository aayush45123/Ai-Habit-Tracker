import OpenAI from "openai";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user;

    const habits = await Habit.find({ userId });
    const habitIds = habits.map((h) => h._id);

    const logs = await HabitLog.find({
      habitId: { $in: habitIds },
    }).sort({ date: 1 });

    if (logs.length === 0) {
      return res.json({
        ai: {
          summary: "You don’t have enough data yet. Start completing habits!",
          strongest: "",
          weakest: "",
          bestDay: "",
          recommendations: [],
          motivation: "",
          shortSummary:
            "Not enough data yet — complete some habits to unlock insights!",
        },
      });
    }

    const openai = createOpenAIClient();
    if (!openai) {
      return res.status(500).json({
        message: "OPENAI_API_KEY not set. Add it to enable AI insights.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ✅ free-tier friendly & fast
      messages: [
        {
          role: "system",
          content: `
You MUST return ONLY valid JSON. No markdown. No explanations.

JSON STRUCTURE:
{
  "summary": "string",
  "strongest": "string",
  "weakest": "string",
  "bestDay": "string",
  "recommendations": ["string", "string", "string"],
  "motivation": "string"
}
          `,
        },
        {
          role: "user",
          content: JSON.stringify({ habits, logs }),
        },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content.trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn("Invalid JSON from OpenAI, attempting fix…");

      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");

      try {
        parsed = JSON.parse(cleaned);
      } catch (err2) {
        parsed = {
          summary: raw,
          strongest: "",
          weakest: "",
          bestDay: "",
          recommendations: [],
          motivation: "",
        };
      }
    }

    const shortSummary = `
${parsed.summary || ""}
Strongest habit: ${parsed.strongest || "None"}.
Weakest habit: ${parsed.weakest || "None"}.
Keep going — small wins add up!
    `.trim();

    parsed.shortSummary = shortSummary;

    return res.json({ ai: parsed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "AI insights error",
      error: err.message,
    });
  }
};
