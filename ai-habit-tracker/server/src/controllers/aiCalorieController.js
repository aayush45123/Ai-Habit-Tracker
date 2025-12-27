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

    const groq = createGroqClient();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
Return ONLY JSON.
Format:
{ "calories": number }
          `.trim(),
        },
        {
          role: "user",
          content: `Estimate calories for: ${foodName}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: "Calorie estimation failed" });
  }
};

/* ============================
   DAILY CALORIE INSIGHTS
============================ */
export const getDailyCalorieSummary = async (req, res) => {
  const userId = req.user;
  const today = normalizeDateIST(new Date());

  const logs = await FoodLog.find({ userId, date: today });

  const total = logs.reduce((sum, f) => sum + f.calories, 0);

  res.json({
    totalCalories: total,
    items: logs,
  });
};
