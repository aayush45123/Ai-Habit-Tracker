// server/src/controllers/aiCalorieController.js
import FoodLog from "../models/FoodLog.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";
import { completeWithGroq, extractAndParseJSON } from "../utils/aiClient.js";

/* Heuristic fallback nutrition estimator when AI is offline */
function estimateNutritionHeuristic(foodName) {
  const text = (foodName || "").toLowerCase();
  let calories = 250;
  let protein = 10;

  if (text.includes("egg")) {
    const count = parseInt(text.match(/(\d+)\s*egg/)?.[1] || "1", 10);
    calories = count * 78;
    protein = count * 6;
  } else if (text.includes("roti") || text.includes("chapati")) {
    const count = parseInt(text.match(/(\d+)\s*(?:roti|chapati)/)?.[1] || "1", 10);
    calories = count * 80;
    protein = count * 3;
  } else if (text.includes("fried rice") || text.includes("schezwan") || text.includes("shezwan") || text.includes("biryani")) {
    const isHalf = text.includes("half");
    calories = isHalf ? 280 : 550;
    protein = isHalf ? 8 : 16;
  } else if (text.includes("rice")) {
    calories = text.includes("half") ? 130 : 260;
    protein = text.includes("half") ? 3 : 6;
  } else if (text.includes("chicken")) {
    calories = 300;
    protein = 32;
  } else if (text.includes("paneer")) {
    calories = 320;
    protein = 18;
  } else if (text.includes("dal") || text.includes("dhal")) {
    calories = 180;
    protein = 9;
  } else if (text.includes("salad")) {
    calories = 120;
    protein = 4;
  } else if (text.includes("pizza") || text.includes("burger")) {
    calories = 450;
    protein = 14;
  } else if (text.includes("oat") || text.includes("oatmeal")) {
    calories = 200;
    protein = 7;
  } else if (text.includes("milk") || text.includes("shake")) {
    calories = 180;
    protein = 8;
  }

  return { calories, protein };
}

/* ============================
   ESTIMATE FOOD CALORIES & PROTEIN
   ✅ IMPROVED: Robust AI with auto model fallback & heuristic resilience
============================ */
export const estimateFoodCalories = async (req, res) => {
  const { foodName } = req.body;

  if (!foodName || !foodName.trim()) {
    return res.status(400).json({
      message: "foodName is required",
    });
  }

  const trimmedFood = foodName.trim();

  try {
    const systemPrompt = `You are an expert nutritionist. Provide accurate calorie and protein estimates for food items.
Return ONLY a valid JSON object in this exact format:
{ "calories": number, "protein": number }`;

    const { content } = await completeWithGroq({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Estimate calories and protein for: ${trimmedFood}` },
      ],
      temperature: 0.1,
      max_tokens: 200,
      jsonMode: true,
    });

    const parsed = extractAndParseJSON(content);

    if (
      parsed &&
      typeof parsed.calories === "number" &&
      typeof parsed.protein === "number" &&
      parsed.calories >= 10 &&
      parsed.calories <= 5000 &&
      parsed.protein >= 0 &&
      parsed.protein <= 300
    ) {
      return res.json({
        calories: Math.round(parsed.calories),
        protein: Math.round(parsed.protein),
      });
    }

    // Heuristic fallback if JSON parsed was out of bounds
    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
    return res.json(fallbackEstimate);
  } catch (err) {
    console.warn("AI nutrition estimation failed, using heuristic estimation:", err.message);
    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
    // Return 200 so user can proceed seamlessly
    return res.json(fallbackEstimate);
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
