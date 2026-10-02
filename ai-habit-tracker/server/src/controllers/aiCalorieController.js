// server/src/controllers/aiCalorieController.js
import FoodLog from "../models/FoodLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";
import { completeWithGroq, extractAndParseJSON } from "../utils/aiClient.js";
import {
  getUserFoodMemoryContext,
  findDirectMemoryMatch,
  trainFoodMemory,
} from "../services/foodMemoryService.js";

import {
  buildNutritionGroqPrompt,
  calculateNutritionDeterministic,
  estimateNutritionHeuristic,
} from "../services/nutritionEngine.js";

// Re-export heuristic for backwards compatibility
export { estimateNutritionHeuristic };

/* ============================
   ESTIMATE FOOD CALORIES & PROTEIN (Hybrid AI + Deterministic Pipeline)
   - Groq AI: detects every food item, portion, units, and preparation method
   - Backend: deterministically calculates calories and protein using verified database
   - Sanity checks: prevents underestimation of carbs, eggs, meat proteins, and fried items
   - Zero-crash fallback: uses deterministic multi-item heuristic if AI is offline
=========================== */
export const estimateFoodCalories = async (req, res) => {
  const { foodName } = req.body;

  if (!foodName || !foodName.trim()) {
    return res.status(400).json({ message: "foodName is required" });
  }

  const trimmedFood = foodName.trim();
  const userId = req.user?._id;

  try {
    // 1. Direct memory match check for single items that the user specifically trained
    const directMatch = await findDirectMemoryMatch(userId, trimmedFood);
    if (directMatch) {
      return res.json({
        ...directMatch,
        breakdown: directMatch.items,
        confidence: "high",
        assumptions: ["Retrieved from your personalized calibrated memory"],
      });
    }

    // 2. Build personalized learned context from user food memory
    const userMemoryContext = await getUserFoodMemoryContext(userId);

    // 3. Build high-accuracy Groq prompt
    const systemPrompt = buildNutritionGroqPrompt(userMemoryContext);

    // 4. Single structured Groq request to extract items, portions, and preparation
    const { content } = await completeWithGroq({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Accurately analyze meal and extract items: ${trimmedFood}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 800,
      jsonMode: true,
    });

    const parsed = extractAndParseJSON(content);

    // 5. If Groq returned structured items, calculate deterministically in JavaScript
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      const calculated = calculateNutritionDeterministic({
        parsedItems: parsed.items,
        assumptions: parsed.assumptions || [],
        rawQuery: trimmedFood,
      });

      return res.json({
        calories: calculated.calories,
        protein: calculated.protein,
        items: calculated.items,
        breakdown: calculated.items,
        assumptions: calculated.assumptions,
        confidence: parsed.confidence || "high",
      });
    }

    // Fallback if AI response schema is missing items
    console.warn("Groq AI output lacked valid items array, falling back to deterministic heuristic:", content);
    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
    return res.json({
      calories: fallbackEstimate.calories,
      protein: fallbackEstimate.protein,
      items: fallbackEstimate.items,
      breakdown: fallbackEstimate.items,
      assumptions: fallbackEstimate.assumptions,
      confidence: "medium",
      isFallback: true,
    });
  } catch (err) {
    console.warn("Groq AI nutrition estimation failed, using deterministic heuristic fallback:", err.message);
    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
    return res.json({
      calories: fallbackEstimate.calories,
      protein: fallbackEstimate.protein,
      items: fallbackEstimate.items,
      breakdown: fallbackEstimate.items,
      assumptions: fallbackEstimate.assumptions,
      confidence: "medium",
      isFallback: true,
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
