// server/src/controllers/aiCalorieController.js
import FoodLog from "../models/FoodLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
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

/* Build a compact few-shot context from user's past logs */
async function buildUserFoodContext(userId) {
  try {
    const recentLogs = await FoodLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    if (!recentLogs.length) return "";

    // Deduplicate and build concise context string
    const seen = new Set();
    const examples = [];
    for (const log of recentLogs) {
      const key = log.foodName.toLowerCase().trim();
      if (!seen.has(key) && examples.length < 20) {
        seen.add(key);
        examples.push(`- "${log.foodName}" = ${log.calories} kcal, ${log.protein}g protein`);
      }
    }
    return examples.length
      ? `\n\nThis user's previously logged foods (use as calibration context for portion sizes):\n${examples.join("\n")}`
      : "";
  } catch {
    return "";
  }
}

/* ============================
   ESTIMATE FOOD CALORIES & PROTEIN
   ✅ IMPROVED: Personalized with user's actual food history as few-shot context
============================ */
export const estimateFoodCalories = async (req, res) => {
  const { foodName } = req.body;

  if (!foodName || !foodName.trim()) {
    return res.status(400).json({ message: "foodName is required" });
  }

  const trimmedFood = foodName.trim();
  const userId = req.user?._id;

  try {
    // Build personalized context from user's eating history
    const userContext = await buildUserFoodContext(userId);

    const systemPrompt = `You are an expert nutritionist specializing in Indian and international foods. Provide accurate calorie and protein estimates calibrated to the user's portion sizes.${userContext}

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

    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
    return res.json(fallbackEstimate);
  } catch (err) {
    console.warn("AI nutrition estimation failed, using heuristic estimation:", err.message);
    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
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

    res.json({ totalCalories, totalProtein, items: logs });
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

/* ============================
   AI-POWERED NUTRITION INSIGHTS
   Groq analyzes the user's last 14 days of eating and returns
   personalized insights, pattern analysis, and improvement tips.
============================ */
export const getAICalorieInsights = async (req, res) => {
  const userId = req.user?._id;

  try {
    // Fetch last 14 days of food logs
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const logs = await FoodLog.find({
      userId,
      createdAt: { $gte: fourteenDaysAgo },
    }).sort({ date: 1, createdAt: 1 });

    if (!logs.length) {
      return res.json({
        insights: null,
        message: "Log at least a few days of food to get AI insights.",
      });
    }

    // Fetch user profile for context
    const profile = await CalorieProfile.findOne({ userId });
    const calorieGoal = profile?.dailyGoal || 2000;
    const proteinGoal = profile?.proteinGoal || 100;
    const weight = profile?.weight;
    const goal = profile?.goal;

    // Group logs by date for a concise summary
    const byDate = {};
    logs.forEach((log) => {
      if (!byDate[log.date]) byDate[log.date] = [];
      byDate[log.date].push(`${log.foodName} (${log.calories}kcal, ${log.protein}g P)`);
    });

    const daySummaries = Object.entries(byDate)
      .map(([date, items]) => {
        const dayDate = new Date(date + "T12:00:00");
        const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return `${dayName}: ${items.join(", ")}`;
      })
      .join("\n");

    const systemPrompt = `You are a personal nutritionist AI with deep knowledge of Indian and international foods. Analyze the user's eating logs and provide highly personalized, actionable insights.

User profile:
- Calorie goal: ${calorieGoal} kcal/day
- Protein goal: ${proteinGoal}g/day
${weight ? `- Weight: ${weight}kg` : ""}
${goal ? `- Goal: ${goal === "lose" ? "Weight Loss" : goal === "gain" ? "Muscle Gain" : "Maintenance"}` : ""}

User's food logs for the past 14 days:
${daySummaries}

Provide a JSON response with the following structure:
{
  "summary": "2-3 sentence overview of their eating patterns",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "wins": ["positive habit 1", "positive habit 2"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "topTip": "One single most impactful personalized tip for this user based on their specific foods",
  "calorieInsight": "Analysis of their calorie consistency vs goal",
  "proteinInsight": "Analysis of their protein intake pattern"
}

Be specific — mention the actual foods they eat. Be encouraging but honest.`;

    const { content } = await completeWithGroq({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Analyze my nutrition logs and give me personalized insights." },
      ],
      temperature: 0.4,
      max_tokens: 1000,
      jsonMode: true,
    });

    const parsed = extractAndParseJSON(content);

    if (!parsed || !parsed.summary) {
      return res.json({
        insights: null,
        message: "Could not generate insights right now. Try again in a moment.",
      });
    }

    return res.json({ insights: parsed });
  } catch (err) {
    console.error("Error generating AI insights:", err.message);
    return res.status(500).json({
      insights: null,
      message: "AI insights temporarily unavailable. Please try again.",
    });
  }
};
