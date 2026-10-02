import mongoose from "mongoose";
import UserFoodMemory from "../models/UserFoodMemory.js";
import FoodLog from "../models/FoodLog.js";

/**
 * Normalizes a food string into a consistent lookup key.
 */
export function normalizeFoodKey(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\(\)\.-]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Trains or updates user food memory.
 * If user explicitly edited/corrected the item, isCorrection is set to true
 * so the AI prioritizes this calibration above standard defaults.
 */
export async function trainFoodMemory({
  userId,
  foodName,
  calories,
  protein = 0,
  isCorrection = false,
}) {
  if (!userId || !foodName || typeof calories !== "number") return null;
  if (mongoose.connection.readyState !== 1) return null;

  try {
    const foodKey = normalizeFoodKey(foodName);
    if (!foodKey) return null;

    const updateFields = {
      foodName: foodName.trim(),
      calories: Math.round(calories),
      protein: Math.round(Number(protein) || 0),
      lastLoggedAt: new Date(),
    };

    if (isCorrection) {
      updateFields.isCorrection = true;
    }

    const memory = await UserFoodMemory.findOneAndUpdate(
      { userId, foodKey },
      {
        $set: updateFields,
        $inc: { logCount: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return memory;
  } catch (err) {
    console.error("Error saving food memory:", err.message);
    return null;
  }
}

/**
 * Builds user-specific few-shot calibration context for AI prompts.
 * Prioritizes user corrections and frequently logged meals.
 */
export async function getUserFoodMemoryContext(userId) {
  if (!userId) return "";
  if (mongoose.connection.readyState !== 1) return "";

  try {
    // 1. Fetch trained memories for this user
    const memories = await UserFoodMemory.find({ userId })
      .sort({ isCorrection: -1, logCount: -1, lastLoggedAt: -1 })
      .limit(30)
      .lean();

    const seen = new Set();
    const lines = [];

    // Prioritize trained items
    for (const mem of memories) {
      const key = mem.foodKey;
      if (!seen.has(key)) {
        seen.add(key);
        const tag = mem.isCorrection ? " [User Confirmed / Trained]" : "";
        lines.push(`- "${mem.foodName}" = ${mem.calories} kcal, ${mem.protein}g protein${tag}`);
      }
    }

    // 2. Fetch recent FoodLog entries if memory is small
    if (lines.length < 15) {
      const recentLogs = await FoodLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      for (const log of recentLogs) {
        const key = normalizeFoodKey(log.foodName);
        if (!seen.has(key) && lines.length < 25) {
          seen.add(key);
          const tag = log.isUserEdited ? " [User Confirmed / Trained]" : "";
          lines.push(`- "${log.foodName}" = ${log.calories} kcal, ${log.protein}g protein${tag}`);
        }
      }
    }

    if (!lines.length) return "";

    return `\nUSER SPECIFIC LEARNED CALIBRATIONS & HISTORY (High Priority: Adhere to these calibrations and portion scales whenever applicable):\n${lines.join("\n")}`;
  } catch (err) {
    console.warn("Failed to build food memory context:", err.message);
    return "";
  }
}

/**
 * Checks for an exact direct match in user memory for single-item inputs.
 */
export async function findDirectMemoryMatch(userId, text) {
  if (!userId || !text) return null;
  if (mongoose.connection.readyState !== 1) return null;

  try {
    const key = normalizeFoodKey(text);
    const match = await UserFoodMemory.findOne({ userId, foodKey: key }).lean();
    if (match) {
      return {
        calories: match.calories,
        protein: match.protein,
        isTrained: true,
        items: [
          {
            foodName: match.foodName,
            calories: match.calories,
            protein: match.protein,
          },
        ],
      };
    }
    return null;
  } catch {
    return null;
  }
}
