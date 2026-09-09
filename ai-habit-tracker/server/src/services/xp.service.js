// server/src/services/xp.service.js
// Centralized XP engine — level calc, XP awards, idempotency

import UserGamification from "../models/UserGamification.js";
import XPTransaction from "../models/XPTransaction.js";

// --- Level Configuration -------------------------------------------------------
// Formula: totalXPForLevel(n) = floor(100 * n^1.65)
const LEVEL_TITLES = {
  1:  "Novice",
  2:  "Beginner",
  3:  "Starter",
  5:  "Consistent",
  8:  "Dedicated",
  10: "Habit Builder",
  12: "Streak Keeper",
  15: "Momentum Master",
  18: "Habit Shaper",
  20: "Habit Strategist",
  25: "Discipline Expert",
  30: "Habit Master",
  35: "Elite Achiever",
  40: "Elite",
  50: "Legend",
};

export function getLevelTitle(level) {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => a - b);
  let title = "Novice";
  for (const k of keys) {
    if (level >= k) title = LEVEL_TITLES[k];
  }
  return title;
}

export function totalXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.65));
}

export function levelFromXP(xp) {
  let level = 1;
  while (totalXPForLevel(level + 1) <= xp) {
    level++;
    if (level >= 100) break;
  }
  return level;
}

export function getLevelInfo(totalXP) {
  const level = levelFromXP(totalXP);
  const currentLevelXP = totalXPForLevel(level);
  const nextLevelXP = totalXPForLevel(level + 1);
  const xpIntoLevel = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpNeededForNext) * 100));

  return {
    level,
    title: getLevelTitle(level),
    totalXP,
    currentLevelXP,
    nextLevelXP,
    xpIntoLevel,
    xpNeededForNext,
    xpToNextLevel: nextLevelXP - totalXP,
    progressPercent,
    };
}

export function xpProgressInLevel(totalXP) {
  const info = getLevelInfo(totalXP);
  return {
    currentXPInLevel: info.xpIntoLevel,
    xpForNextLevel: info.xpNeededForNext,
    progressPercent: info.progressPercent,
    currentLevelXP: info.currentLevelXP,
    nextLevelXP: info.nextLevelXP,
    totalXP: info.totalXP,
  };
}

// --- XP Award Values ----------------------------------------------------------
export const XP_VALUES = {
  habit_complete:      { xp: 10,   coins: 2  },
  perfect_day:         { xp: 30,   coins: 8  },
  first_habit:         { xp: 25,   coins: 5  },
  perfect_week:        { xp: 150,  coins: 30 },
  perfect_month:       { xp: 500,  coins: 100 },
  streak_3:            { xp: 50,   coins: 10 },
  streak_7:            { xp: 100,  coins: 20 },
  streak_14:           { xp: 200,  coins: 40 },
  streak_30:           { xp: 500,  coins: 100 },
  streak_60:           { xp: 750,  coins: 150 },
  streak_100:          { xp: 1000, coins: 200 },
  streak_365:          { xp: 2000, coins: 400 },
  challenge_complete:  { xp: 100,  coins: 25 }, // default; overridden by challenge.xpReward
  achievement_unlock:  { xp: 50,   coins: 10 }, // default; overridden by achievement.xpReward
};

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

// --- Core Award Function ------------------------------------------------------
/**
 * Award XP and coins to a user.
 * Returns null silently if idempotencyKey already exists (duplicate).
 */
export async function awardXP({
  userId,
  xp,
  amount,
  coins = 0,
  source,
  refId = null,
  idempotencyKey = null,
  metadata = {},
}) {
  try {
    const actualXP = xp !== undefined ? xp : (amount !== undefined ? amount : 0);

    // Attempt idempotent insert
    if (idempotencyKey) {
      const exists = await XPTransaction.findOne({ idempotencyKey });
      if (exists) return null; // already granted
    }

    // Create transaction record
    const tx = await XPTransaction.create({
      userId,
      amount: actualXP,
      coinAmount: coins,
      source,
      refId: refId ? refId.toString() : null,
      idempotencyKey,
      metadata,
    });

    // Update UserGamification atomically
    const prevGam = await UserGamification.findOne({ userId });
    const prevXP = prevGam?.totalXP ?? 0;
    const prevLevel = prevGam?.level ?? 1;

    const gam = await UserGamification.findOneAndUpdate(
      { userId },
      {
        $inc: { totalXP: actualXP, habitCoins: coins },
        $setOnInsert: { userId },
      },
      { upsert: true, new: true }
    );

    // Sync level
    const newLevel = levelFromXP(gam.totalXP);
    if (newLevel !== gam.level) {
      await UserGamification.updateOne({ userId }, { $set: { level: newLevel } });
      gam.level = newLevel;
    }

    return {
      tx,
      xp: actualXP,
      coins,
      newTotalXP: gam.totalXP,
      newCoins: gam.habitCoins,
      newLevel: gam.level,
      leveledUp: gam.level > prevLevel,
    };
  } catch (err) {
    // Unique key violation = duplicate — swallow silently
    if (err.code === 11000) return null;
    throw err;
  }
}

// --- Get or Create UserGamification -----------------------------------------
export async function getOrCreateGamification(userId) {
  let gam = await UserGamification.findOne({ userId });
  if (!gam) {
    gam = await UserGamification.create({ userId });
  }
  return gam;
}
