// server/src/services/achievement.service.js
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import UserGamification from "../models/UserGamification.js";
import UserChallenge from "../models/UserChallenge.js";
import { awardXP } from "./xp.service.js";
import { emitNotification } from "./socket.service.js";

/**
 * Check and unlock achievements for a user based on trigger context
 * @param {string} userId
 * @param {Object} context - { streak, totalCompleted, perfectDaysStreak, level, challengesCompleted, ... }
 * @returns {Promise<Array>} newly unlocked achievements
 */
export async function evaluateAchievements(userId, context = {}) {
  const newUnlocks = [];

  try {
    // Get all achievements
    const allAchievements = await Achievement.find({ isActive: { $ne: false } }).lean();
    if (!allAchievements.length) return [];

    // Get already unlocked keys for this user
    const existingUnlocks = await UserAchievement.find({ userId }).select("achievementKey").lean();
    const unlockedSet = new Set(existingUnlocks.map((u) => u.achievementKey));

    for (const ach of allAchievements) {
      if (unlockedSet.has(ach.key)) continue;

      let qualified = false;
      const crit = ach.criteria || {};

      // Resilient fallback criteria detection
      const critType = crit.type || (
        ach.key === "first_habit" ? "first_habit" :
        ach.key.startsWith("streak_") ? "streak" :
        ach.key.startsWith("level_") ? "level" :
        ach.key === "perfect_week" ? "perfect_week" :
        ach.key === "perfect_month" ? "perfect_month" :
        ""
      );

      const critThreshold = typeof crit.threshold === "number" ? crit.threshold : (
        ach.key.startsWith("streak_") ? parseInt(ach.key.replace("streak_", ""), 10) :
        ach.key.startsWith("level_") ? parseInt(ach.key.replace("level_", ""), 10) :
        ach.key === "perfect_week" ? 7 :
        ach.key === "perfect_month" ? 30 :
        ach.key === "first_habit" ? 1 :
        0
      );

      switch (critType) {
        case "first_habit":
          if ((context.totalCompleted || 0) >= (critThreshold || 1)) qualified = true;
          break;
        case "streak":
          if ((context.streak || 0) >= critThreshold) qualified = true;
          break;
        case "perfect_week":
          if ((context.perfectDaysStreak || 0) >= 7 || (context.streak || 0) >= 7) qualified = true;
          break;
        case "perfect_month":
          if ((context.perfectDaysStreak || 0) >= 30 || (context.streak || 0) >= 30) qualified = true;
          break;
        case "level":
          if ((context.level || 1) >= critThreshold) qualified = true;
          break;
        case "challenges_completed":
          if ((context.challengesCompleted || 0) >= critThreshold) qualified = true;
          break;
        default:
          break;
      }

      if (qualified) {
        try {
          await UserAchievement.create({
            userId,
            achievementKey: ach.key,
            unlockedAt: new Date(),
          });

          // Award XP and coins
          if (ach.xpReward > 0 || ach.coinReward > 0) {
            await awardXP({
              userId,
              amount: ach.xpReward || 0,
              coins: ach.coinReward || 0,
              source: "achievement_unlock",
              refId: ach.key,
              idempotencyKey: `ach_${userId}_${ach.key}`,
              metadata: { achievementName: ach.name, rarity: ach.rarity },
            });
          }

          newUnlocks.push(ach);
          unlockedSet.add(ach.key);

          // Emit real-time notification
          try {
            emitNotification(userId, {
              type: "achievement_unlocked",
              title: `🏆 Achievement Unlocked: ${ach.name}!`,
              message: ach.description,
              data: {
                achievement: ach,
                xpReward: ach.xpReward,
                coinReward: ach.coinReward,
              },
            });
          } catch (socketErr) {
            console.warn("Socket notification failed for achievement:", socketErr.message);
          }
        } catch (dupErr) {
          // If already unlocked concurrently (E11000), ignore
          if (dupErr.code !== 11000) console.error("Error creating UserAchievement:", dupErr);
        }
      }
    }
  } catch (error) {
    console.error("evaluateAchievements error:", error);
  }

  return newUnlocks;
}

/**
 * Get all achievements with user unlock status
 * Automatically evaluates user achievements against their existing habit history
 */
export async function getUserAchievementsWithStatus(userId) {
  try {
    // 1. Gather real user habit data to evaluate any unearned achievements
    const [userHabits, userGamification, completedChallengesCount] = await Promise.all([
      Habit.find({ userId }).select("_id streak longestStreak").lean(),
      UserGamification.findOne({ userId }).lean(),
      UserChallenge.countDocuments({ userId, status: "completed" }),
    ]);

    const habitIds = (userHabits || []).map((h) => h._id);
    const totalCompleted = await HabitLog.countDocuments({
      habitId: { $in: habitIds },
      status: "done",
    });

    const maxStreak = (userHabits || []).reduce(
      (max, h) => Math.max(max, h.streak || 0, h.longestStreak || 0),
      0
    );

    const userLevel = userGamification?.level || 1;

    // Run evaluation so any earned badges unlock automatically
    await evaluateAchievements(userId, {
      streak: maxStreak,
      totalCompleted,
      level: userLevel,
      challengesCompleted: completedChallengesCount,
    });
  } catch (evalErr) {
    console.warn("Auto-evaluating achievements in getUserAchievementsWithStatus failed:", evalErr.message);
  }

  const [allAchievements, userUnlocks] = await Promise.all([
    Achievement.find({ isActive: { $ne: false } }).sort({ order: 1, xpReward: 1 }).lean(),
    UserAchievement.find({ userId }).lean(),
  ]);

  const unlockMap = new Map();
  userUnlocks.forEach((u) => unlockMap.set(u.achievementKey, u.unlockedAt));

  return allAchievements.map((ach) => ({
    ...ach,
    isUnlocked: unlockMap.has(ach.key),
    unlockedAt: unlockMap.get(ach.key) || null,
  }));
}
