// server/src/controllers/aiCalorieController.js
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
   ✅ IMPROVED: Better prompts for accurate estimates
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
      temperature: 0.1, // Lower temperature for more consistent estimates
      messages: [
        {
          role: "system",
          content: `You are an expert nutritionist specializing in Indian and international cuisine. Provide accurate calorie and protein estimates for food items.

IMPORTANT GUIDELINES:
1. Consider TYPICAL PORTION SIZES for the food mentioned
2. If "half plate" or "full plate" is mentioned, estimate accordingly:
   - Half plate = 200-250g for rice/noodles
   - Full plate = 400-500g
   - Bowl = 250-300ml
3. Account for cooking methods (fried foods have more calories)
4. Include all ingredients (oil, ghee, cheese, etc.)
5. Be realistic about protein content

PROTEIN GUIDELINES (per 100g):
- Rice/noodles: 2-4g
- Chicken/fish: 20-30g
- Paneer/cheese: 18-25g
- Dal/lentils: 7-9g
- Vegetables: 1-3g
- Egg: ~13g per egg

CALORIE GUIDELINES (per 100g):
- Plain rice: 130 kcal
- Fried rice: 150-180 kcal
- Noodles: 130-160 kcal
- Roti/chapati: ~70 kcal per piece
- Dal: 90-110 kcal

Return ONLY valid JSON in this exact format:
{ "calories": number, "protein": number }

Example outputs:
- "half plate shezwan fried rice" → {"calories": 550, "protein": 15}
- "2 eggs" → {"calories": 155, "protein": 26}
- "chicken tikka 6 pieces" → {"calories": 280, "protein": 35}`,
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
      typeof parsed.protein !== "number" ||
      parsed.calories < 10 ||
      parsed.calories > 5000 ||
      parsed.protein < 0 ||
      parsed.protein > 300
    ) {
      console.warn("Invalid nutrition estimate:", parsed);
      return res.status(500).json({
        message: "Invalid nutrition estimate received",
        calories: 250,
        protein: 12,
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
      calories: 250,
      protein: 12,
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
