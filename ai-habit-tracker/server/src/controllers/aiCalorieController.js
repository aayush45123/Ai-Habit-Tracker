import OpenAI from "openai";
import FoodLog from "../models/FoodLog.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";

function createGroqClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/* ============================
   ESTIMATE FOOD CALORIES
============================ */
export const estimateFoodCalories = async (req, res) => {
  try {
    const { foodName } = req.body;

    if (!foodName || !foodName.trim()) {
      return res.status(400).json({
        message: "foodName is required",
      });
    }

    const groq = createGroqClient();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Estimate the calories for the given food item.
Return ONLY valid JSON in this exact format:
{ "calories": number }

Guidelines:
- Provide realistic calorie estimates
- For vague items, estimate a typical serving
- Always return a number between 10 and 3000`,
        },
        {
          role: "user",
          content: `Estimate calories for: ${foodName.trim()}`,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseErr) {
      console.error("JSON parse error:", cleanContent);
      // Fallback: try to extract number from response
      const match = cleanContent.match(/\d+/);
      if (match) {
        parsed = { calories: parseInt(match[0]) };
      } else {
        throw new Error("Could not parse calorie estimate");
      }
    }

    // Validate the response
    if (!parsed.calories || typeof parsed.calories !== "number") {
      return res.status(500).json({
        message: "Invalid calorie estimate received",
        calories: 200, // Fallback
      });
    }

    res.json({ calories: Math.round(parsed.calories) });
  } catch (err) {
    console.error("Calorie estimation error:", err);
    res.status(500).json({
      message: "Calorie estimation failed",
      calories: 200, // Fallback value
    });
  }
};

/* ============================
   DAILY CALORIE INSIGHTS
============================ */
export const getDailyCalorieSummary = async (req, res) => {
  try {
    const userId = req.user;
    const today = normalizeDateIST(new Date());

    const logs = await FoodLog.find({ userId, date: today }).sort({
      createdAt: -1,
    });

    const total = logs.reduce((sum, f) => sum + (f.calories || 0), 0);

    res.json({
      totalCalories: total,
      items: logs,
    });
  } catch (err) {
    console.error("Error getting summary:", err);
    res.status(500).json({
      message: "Failed to get calorie summary",
      totalCalories: 0,
      items: [],
    });
  }
};
