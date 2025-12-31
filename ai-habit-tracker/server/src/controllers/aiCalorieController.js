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
   ESTIMATE FOOD CALORIES & PROTEIN
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
          content: `You are a nutrition expert. Estimate the calories and protein for the given food item.
Return ONLY valid JSON in this exact format:
{ "calories": number, "protein": number }

Guidelines:
- Provide realistic estimates for a typical serving
- Calories should be between 10 and 3000
- Protein should be in grams (0-200g)
- For vague items, estimate a standard portion
- Consider common preparation methods`,
        },
        {
          role: "user",
          content: `Estimate calories and protein for: ${foodName.trim()}`,
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
      // Fallback: try to extract numbers from response
      const calorieMatch = cleanContent.match(/"calories"\s*:\s*(\d+)/);
      const proteinMatch = cleanContent.match(/"protein"\s*:\s*(\d+)/);

      if (calorieMatch && proteinMatch) {
        parsed = {
          calories: parseInt(calorieMatch[1]),
          protein: parseInt(proteinMatch[1]),
        };
      } else {
        throw new Error("Could not parse nutrition estimate");
      }
    }

    // Validate the response
    if (
      typeof parsed.calories !== "number" ||
      typeof parsed.protein !== "number"
    ) {
      return res.status(500).json({
        message: "Invalid nutrition estimate received",
        calories: 200,
        protein: 10,
      });
    }

    res.json({
      calories: Math.round(parsed.calories),
      protein: Math.round(parsed.protein),
    });
  } catch (err) {
    console.error("Nutrition estimation error:", err);
    res.status(500).json({
      message: "Nutrition estimation failed",
      calories: 200,
      protein: 10,
    });
  }
};

/* ============================
   DAILY NUTRITION SUMMARY
============================ */
export const getDailyCalorieSummary = async (req, res) => {
  try {
    const userId = req.user?._id;
    const today = normalizeDateIST(new Date());

    const logs = await FoodLog.find({ userId, date: today }).sort({
      createdAt: -1,
    });

    const totalCalories = logs.reduce((sum, f) => sum + (f.calories || 0), 0);
    const totalProtein = logs.reduce((sum, f) => sum + (f.protein || 0), 0);

    res.json({
      totalCalories,
      totalProtein,
      items: logs,
    });
  } catch (err) {
    console.error("Error getting summary:", err);
    res.status(500).json({
      message: "Failed to get nutrition summary",
      totalCalories: 0,
      totalProtein: 0,
      items: [],
    });
  }
};
