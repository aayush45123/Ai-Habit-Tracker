// server/src/services/achievement.service.js
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
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

      switch (crit.type) {
        case "first_habit":
          if (context.totalCompleted >= 1) qualified = true;
          break;
        case "streak":
          if (context.streak >= crit.threshold) qualified = true;
          break;
        case "perfect_week":
          if (context.perfectDaysStreak >= 7) qualified = true;
          break;
        case "perfect_month":
          if (context.perfectDaysStreak >= 30) qualified = true;
          break;
        case "level":
          if (context.level >= crit.threshold) qualified = true;
          break;
        case "challenges_completed":
          if (context.challengesCompleted >= crit.threshold) qualified = true;
          break;
        default:
          break;
      }

      if (qualified) {
        try {
          const userAch = await UserAchievement.create({
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
              title: `?? Achievement Unlocked: ${ach.name}!`,
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
 */
export async function getUserAchievementsWithStatus(userId) {
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
