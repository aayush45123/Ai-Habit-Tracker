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

/* ============================================================
   ADVANCED MULTI-ITEM NUTRITION HEURISTIC (Fallback when AI offline)
   - Accurately parses multiple foods (commas, 'and', '+', newlines)
   - Parses numbers, brackets like (200g), weights, counts, and units
   - Calculates and sums ALL items without capping at 250 cal
============================================================ */
export function estimateNutritionHeuristic(foodName) {
  if (!foodName || typeof foodName !== "string") {
    return { calories: 250, protein: 10, items: [] };
  }

  // Split input into individual food items
  const rawParts = foodName
    .split(/[,;+\n]|\s+and\s+|\s+&\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const parts = rawParts.length > 0 ? rawParts : [foodName.trim()];

  const foodDatabase = [
    // Eggs
    { keys: ["boiled egg", "egg white", "egg"], cal: 78, prot: 6.3, baseUnit: "piece", baseQty: 1 },
    { keys: ["omelet", "omelette", "fried egg", "bhurji"], cal: 130, prot: 8.0, baseUnit: "piece", baseQty: 1 },
    // Breads & Rotis
    { keys: ["roti", "chapati", "chapatti", "phulka", "fulka"], cal: 85, prot: 3.2, baseUnit: "piece", baseQty: 1 },
    { keys: ["paratha", "parantha", "aloo paratha", "paneer paratha"], cal: 260, prot: 6.0, baseUnit: "piece", baseQty: 1 },
    { keys: ["naan", "kulcha", "bhatura", "puri", "poori"], cal: 280, prot: 7.5, baseUnit: "piece", baseQty: 1 },
    { keys: ["bread", "toast", "slice"], cal: 75, prot: 2.8, baseUnit: "piece", baseQty: 1 },
    // Rice & Grains
    { keys: ["biryani", "fried rice", "schezwan rice", "shezwan rice", "pulao"], cal: 520, prot: 14.0, baseUnit: "plate", baseQty: 1 },
    { keys: ["rice", "steamed rice", "chawal", "white rice", "brown rice"], cal: 210, prot: 4.5, baseUnit: "bowl", baseQty: 1 },
    { keys: ["oat", "oatmeal", "oats", "porridge"], cal: 180, prot: 6.5, baseUnit: "bowl", baseQty: 1 },
    { keys: ["poha", "upma", "khichdi", "seviyan", "vermicelli"], cal: 230, prot: 5.5, baseUnit: "bowl", baseQty: 1 },
    // Dals, Legumes & Curries
    { keys: ["dal", "dhal", "daal", "sambar", "rasam", "lentil", "chana", "rajma", "choole", "chole", "moong"], cal: 180, prot: 9.5, baseUnit: "bowl", baseQty: 1 },
    { keys: ["paneer", "cottage cheese"], cal: 265, prot: 18.0, baseUnit: "g", baseQty: 100 },
    { keys: ["tofu", "soya", "soy", "soya chunks"], cal: 140, prot: 16.0, baseUnit: "g", baseQty: 100 },
    { keys: ["sabzi", "bhaji", "curry", "veg curry", "mix veg"], cal: 150, prot: 3.5, baseUnit: "bowl", baseQty: 1 },
    // Meats & Seafood
    { keys: ["chicken breast"], cal: 165, prot: 31.0, baseUnit: "g", baseQty: 100 },
    { keys: ["chicken", "murgh", "chicken curry", "tandoori chicken"], cal: 240, prot: 26.0, baseUnit: "g", baseQty: 100 },
    { keys: ["fish", "salmon", "tuna", "prawn", "prawns", "fish curry"], cal: 180, prot: 24.0, baseUnit: "g", baseQty: 100 },
    { keys: ["mutton", "lamb", "beef", "meat"], cal: 280, prot: 25.0, baseUnit: "g", baseQty: 100 },
    // Dairy & Supplements
    { keys: ["whey", "protein shake", "protein powder", "shake"], cal: 130, prot: 25.0, baseUnit: "scoop", baseQty: 1 },
    { keys: ["milk", "doodh"], cal: 130, prot: 6.8, baseUnit: "cup", baseQty: 1 },
    { keys: ["curd", "dahi", "yogurt"], cal: 120, prot: 6.0, baseUnit: "cup", baseQty: 1 },
    { keys: ["cheese", "cheddar", "mozzarella"], cal: 110, prot: 7.0, baseUnit: "slice", baseQty: 1 },
    // Fruits & Vegetables
    { keys: ["apple"], cal: 85, prot: 0.5, baseUnit: "piece", baseQty: 1 },
    { keys: ["banana"], cal: 105, prot: 1.3, baseUnit: "piece", baseQty: 1 },
    { keys: ["orange", "sweet lime", "mosambi"], cal: 65, prot: 1.2, baseUnit: "piece", baseQty: 1 },
    { keys: ["mango"], cal: 140, prot: 1.1, baseUnit: "piece", baseQty: 1 },
    { keys: ["salad", "green salad", "cucumber", "tomato"], cal: 80, prot: 2.5, baseUnit: "bowl", baseQty: 1 },
    // Snacks & Fast Food
    { keys: ["pizza"], cal: 280, prot: 11.0, baseUnit: "slice", baseQty: 1 },
    { keys: ["burger"], cal: 480, prot: 19.0, baseUnit: "piece", baseQty: 1 },
    { keys: ["sandwich"], cal: 320, prot: 10.0, baseUnit: "piece", baseQty: 1 },
    { keys: ["dosa", "masala dosa"], cal: 200, prot: 4.5, baseUnit: "piece", baseQty: 1 },
    { keys: ["idli"], cal: 65, prot: 2.2, baseUnit: "piece", baseQty: 1 },
    { keys: ["peanut butter"], cal: 95, prot: 4.0, baseUnit: "tablespoon", baseQty: 1 },
    { keys: ["almond", "almonds", "nuts", "cashew", "walnut"], cal: 160, prot: 6.0, baseUnit: "handful", baseQty: 1 },
    { keys: ["biscuit", "cookie"], cal: 65, prot: 1.0, baseUnit: "piece", baseQty: 1 },
    { keys: ["tea", "chai", "coffee"], cal: 60, prot: 1.5, baseUnit: "cup", baseQty: 1 },
  ];

  const wordNumbers = {
    half: 0.5,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  const items = [];
  let totalCalories = 0;
  let totalProtein = 0;

  for (const part of parts) {
    const text = part.toLowerCase().trim();
    if (!text) continue;

    let multiplier = 1;
    let explicitGrams = null;

    // 1. Look for brackets like (200g), (150 gm), (2 bowls), (3 slices)
    const bracketMatch = text.match(/\(([\d\.]+)\s*(g|gm|gram|grams|kg|ml|oz|piece|pieces|slice|slices|bowl|bowls|cup|cups|plate|plates|scoop|scoops)?\)/i);
    if (bracketMatch) {
      const val = parseFloat(bracketMatch[1]);
      const unit = (bracketMatch[2] || "").toLowerCase();
      if (!isNaN(val) && val > 0) {
        if (unit.startsWith("g")) {
          explicitGrams = val;
        } else if (unit === "kg") {
          explicitGrams = val * 1000;
        } else if (unit.startsWith("ml")) {
          explicitGrams = val; // roughly 1g/ml
        } else {
          multiplier = val;
        }
      }
    }

    // 2. Look for numerical prefix or quantity in the text, e.g. "4 eggs", "100g paneer", "2.5 rotis"
    if (!bracketMatch) {
      const numMatch = text.match(/\b([\d\.]+)\s*(g|gm|gram|grams|kg|ml|oz|piece|pieces|slice|slices|bowl|bowls|cup|cups|plate|plates|scoop|scoops)?\b/i);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        const unit = (numMatch[2] || "").toLowerCase();
        if (!isNaN(val) && val > 0) {
          if (unit.startsWith("g")) {
            explicitGrams = val;
          } else if (unit === "kg") {
            explicitGrams = val * 1000;
          } else if (unit.startsWith("ml")) {
            explicitGrams = val;
          } else {
            multiplier = val;
          }
        }
      } else {
        // Check for words like "half", "two", "three"
        for (const [w, n] of Object.entries(wordNumbers)) {
          if (new RegExp(`\\b${w}\\b`, "i").test(text)) {
            multiplier = n;
            break;
          }
        }
      }
    }

    // 3. Match against food database
    let matchedFood = null;
    for (const food of foodDatabase) {
      if (food.keys.some((k) => text.includes(k))) {
        matchedFood = food;
        break;
      }
    }

    let itemCal = 0;
    let itemProt = 0;

    if (matchedFood) {
      if (explicitGrams !== null) {
        if (matchedFood.baseUnit === "g") {
          const ratio = explicitGrams / matchedFood.baseQty;
          itemCal = matchedFood.cal * ratio;
          itemProt = matchedFood.prot * ratio;
        } else {
          // If food base unit is piece/bowl but grams provided (e.g. 200g rice or 150g chicken)
          const ratio = explicitGrams / 100;
          itemCal = (matchedFood.cal / 1.5) * ratio;
          itemProt = (matchedFood.prot / 1.5) * ratio;
        }
      } else {
        itemCal = matchedFood.cal * multiplier;
        itemProt = matchedFood.prot * multiplier;
      }
    } else {
      // Unrecognized food fallback: scale by grams or reasonable default
      if (explicitGrams !== null) {
        itemCal = explicitGrams * 1.5;
        itemProt = explicitGrams * 0.06;
      } else {
        itemCal = 180 * multiplier;
        itemProt = 6 * multiplier;
      }
    }

    itemCal = Math.max(10, Math.round(itemCal));
    itemProt = Math.max(0, Math.round(itemProt));

    totalCalories += itemCal;
    totalProtein += itemProt;

    items.push({
      foodName: part,
      calories: itemCal,
      protein: itemProt,
    });
  }

  return {
    calories: Math.max(10, Math.round(totalCalories)),
    protein: Math.max(0, Math.round(totalProtein)),
    items: items.length > 0 ? items : [{ foodName, calories: 250, protein: 10 }],
  };
}

/* ============================
   ESTIMATE FOOD CALORIES & PROTEIN
   - Multi-item detection and breakdown
   - Precision parsing for numbers, brackets like (200g), counts & units
   - Continuous training & few-shot memory calibration
   - Generous max_tokens to prevent JSON validation truncation
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
      return res.json(directMatch);
    }

    // 2. Build personalized learned context from user food memory
    const userMemoryContext = await getUserFoodMemoryContext(userId);

    const systemPrompt = `You are an elite nutritionist and dietitian specializing in Indian, Asian, and global cuisines.
The user enters foods to log. They may enter a single food or 2, 3, 4, or more foods separated by commas, "and", "&", "+", or newlines.
They may specify portion sizes numerically (e.g. 4 rotis, 3 eggs), in brackets (e.g. "rice (200g)", "chicken (150g)", "milk (250ml)"), or with words (e.g. "half plate", "2 bowls").

CRITICAL INSTRUCTIONS:
1. MULTIPLE ITEMS: If the user inputs 2 or more foods, calculate EVERY SINGLE FOOD item. NEVER stop at only the first food.
2. QUANTITIES & BRACKETS: Accurately parse numbers, bracketed weights e.g. (200g), counts, volumes (ml, glasses, bowls, scoops), and scale calories and protein strictly proportional to that exact quantity.
3. USER MEMORY & CALIBRATIONS:
${userMemoryContext || "No prior user calibrations recorded yet."}
If the user's learned calibrations contain the food or portion, prioritize the user's calibrated values.
4. RETURN FORMAT: Return ONLY a valid JSON object in this exact structure:
{
  "calories": <total_sum_of_calories_number>,
  "protein": <total_sum_of_protein_grams_number>,
  "items": [
    {
      "foodName": "<item name with portion e.g. 2 rotis>",
      "calories": <item_calories_number>,
      "protein": <item_protein_number>
    }
  ]
}`;

    const { content } = await completeWithGroq({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Accurately calculate calories and protein for: ${trimmedFood}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      jsonMode: true,
    });

    const parsed = extractAndParseJSON(content);

    if (
      parsed &&
      typeof parsed.calories === "number" &&
      typeof parsed.protein === "number" &&
      parsed.calories >= 10 &&
      parsed.calories <= 15000 &&
      parsed.protein >= 0 &&
      parsed.protein <= 1000
    ) {
      let items = [];
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        items = parsed.items.map((it) => ({
          foodName: (it.foodName || trimmedFood).trim(),
          calories: Math.round(Number(it.calories) || 0),
          protein: Math.round(Number(it.protein) || 0),
        }));
      } else {
        items = [
          {
            foodName: trimmedFood,
            calories: Math.round(parsed.calories),
            protein: Math.round(parsed.protein),
          },
        ];
      }

      const totalCalories = Math.round(parsed.calories);
      const totalProtein = Math.round(parsed.protein);

      return res.json({
        calories: totalCalories,
        protein: totalProtein,
        items,
      });
    }

    const fallbackEstimate = estimateNutritionHeuristic(trimmedFood);
    return res.json(fallbackEstimate);
  } catch (err) {
    console.warn("AI nutrition estimation failed, using advanced heuristic fallback:", err.message);
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
