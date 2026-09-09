// server/src/services/gamification.service.js
import UserGamification from "../models/UserGamification.js";
import XPTransaction from "../models/XPTransaction.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import Reward from "../models/Reward.js";
import UserReward from "../models/UserReward.js";
import GamificationChallenge from "../models/GamificationChallenge.js";
import UserChallenge from "../models/UserChallenge.js";
import {
  awardXP,
  getOrCreateGamification,
  getLevelTitle,
  totalXPForLevel,
  xpProgressInLevel,
} from "./xp.service.js";
import { evaluateAchievements } from "./achievement.service.js";
import { emitNotification } from "./socket.service.js";

const STREAK_MILESTONES = {
  3: { xp: 50, coins: 10 },
  7: { xp: 100, coins: 20 },
  14: { xp: 200, coins: 40 },
  30: { xp: 500, coins: 100 },
  60: { xp: 750, coins: 150 },
  100: { xp: 1000, coins: 200 },
};

/**
 * Hook called when a habit is logged
 */
export async function processHabitCompletion({ userId, habitId, status, currentStreak }) {
  try {
    if (status !== "completed") return;

    const todayStr = new Date().toISOString().split("T")[0];
    const gam = await getOrCreateGamification(userId);

    // 1. Award base XP for habit completion (+10 XP, +2 coins)
    const baseTx = await awardXP({
      userId,
      amount: 10,
      coins: 2,
      source: "habit_complete",
      refId: habitId.toString(),
      idempotencyKey: `habit_${habitId}_${todayStr}`,
      metadata: { habitId, date: todayStr },
    });

    // 2. Check if first habit ever
    const totalLogsCount = await HabitLog.countDocuments({
      userId,
      status: "completed",
    });

    if (totalLogsCount === 1) {
      await awardXP({
        userId,
        amount: 25,
        coins: 5,
        source: "first_habit",
        refId: habitId.toString(),
        idempotencyKey: `first_habit_${userId}`,
        metadata: { habitId },
      });
    }

    // 3. Check for Perfect Day (all active habits completed today)
    const activeHabits = await Habit.find({ userId, isActive: { $ne: false } }).select("_id").lean();
    if (activeHabits.length > 0) {
      const todayLogs = await HabitLog.find({
        userId,
        date: {
          $gte: new Date(todayStr + "T00:00:00.000Z"),
          $lte: new Date(todayStr + "T23:59:59.999Z"),
        },
        status: "completed",
      }).select("habitId").lean();

      const completedIds = new Set(todayLogs.map((l) => l.habitId.toString()));
      const allDone = activeHabits.every((h) => completedIds.has(h._id.toString()));

      if (allDone) {
        await awardXP({
          userId,
          amount: 30,
          coins: 8,
          source: "perfect_day",
          refId: todayStr,
          idempotencyKey: `perfect_day_${userId}_${todayStr}`,
          metadata: { date: todayStr, habitsCount: activeHabits.length },
        });
      }
    }

    // 4. Streak milestone reward
    if (currentStreak && STREAK_MILESTONES[currentStreak]) {
      const ms = STREAK_MILESTONES[currentStreak];
      await awardXP({
        userId,
        amount: ms.xp,
        coins: ms.coins,
        source: "streak_milestone",
        refId: `${currentStreak}`,
        idempotencyKey: `streak_${userId}_${currentStreak}_${todayStr}`,
        metadata: { milestoneStreak: currentStreak },
      });
    }

    // 5. Streak Freeze accrual (1 freeze earned every 5 days of streak, max 5)
    if (currentStreak && currentStreak % 5 === 0) {
      await UserGamification.updateOne(
        { userId, streakFreezes: { $lt: 5 } },
        { $inc: { streakFreezes: 1 }, $set: { lastFreezeEarnedAt: new Date() } }
      );
    }

    // 6. Update user active challenges progress
    await updateChallengeProgress(userId, habitId);

    // 7. Evaluate achievements
    const freshGam = await UserGamification.findOne({ userId }).lean();
    await evaluateAchievements(userId, {
      streak: currentStreak || 0,
      totalCompleted: totalLogsCount,
      level: freshGam ? freshGam.level : 1,
    });

  } catch (error) {
    console.error("Error processing habit gamification:", error);
  }
}

/**
 * Increment progress for active user challenges matching this habit
 */
async function updateChallengeProgress(userId, habitId) {
  try {
    const activeChallenges = await UserChallenge.find({
      userId,
      status: "active",
    }).populate("challengeId");

    for (const uc of activeChallenges) {
      const chal = uc.challengeId;
      if (!chal) continue;

      // Increment progress
      const targetCount = chal.requirements?.daysRequired || chal.requirements?.targetCount || 7;
      const newProgress = Math.min(100, Math.round(((uc.progressCount || 0) + 1) / targetCount * 100));
      const newCount = (uc.progressCount || 0) + 1;

      uc.progress = newProgress;
      uc.progressCount = newCount;

      if (newCount >= targetCount && uc.status !== "completed") {
        uc.status = "completed";
        uc.completedAt = new Date();

        // Award challenge XP + coins
        if (chal.xpReward > 0 || chal.coinReward > 0) {
          await awardXP({
            userId,
            amount: chal.xpReward || 0,
            coins: chal.coinReward || 0,
            source: "challenge_complete",
            refId: chal._id.toString(),
            idempotencyKey: `chal_${userId}_${chal._id}`,
            metadata: { challengeTitle: chal.title },
          });
        }

        emitNotification(userId, {
          type: "challenge_completed",
          title: `?? Challenge Completed: ${chal.title}!`,
          message: `You earned ${chal.xpReward} XP and ${chal.coinReward} Coins!`,
          data: { challenge: chal },
        });
      }

      await uc.save();
    }
  } catch (err) {
    console.error("Error updating challenge progress:", err);
  }
}

/**
 * Get comprehensive gamification overview for dashboard & progression page
 */
export async function getGamificationOverview(userId) {
  const gam = await getOrCreateGamification(userId);
  const title = getLevelTitle(gam.level);
  const progressInfo = xpProgressInLevel(gam.totalXP);

  // Fetch recent XP transactions (last 10)
  const recentTransactions = await XPTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Fetch active user challenges
  const userChallenges = await UserChallenge.find({ userId, status: "active" })
    .populate("challengeId")
    .lean();

  // Fetch user redeemed rewards
  const userRewards = await UserReward.find({ userId }).lean();

  return {
    profile: {
      userId: gam.userId,
      totalXP: gam.totalXP,
      level: gam.level,
      levelTitle: title,
      habitCoins: gam.habitCoins,
      streakFreezes: gam.streakFreezes,
      featuredBadges: gam.featuredBadges || [],
      ...progressInfo,
    },
    recentTransactions,
    activeChallenges: userChallenges.map((uc) => ({
      ...uc,
      challenge: uc.challengeId,
    })),
    redeemedRewardKeys: userRewards.map((ur) => ur.rewardKey),
  };
}

/**
 * Redeem a reward from catalog
 */
export async function redeemReward(userId, rewardKey) {
  const reward = await Reward.findOne({ key: rewardKey, isAvailable: { $ne: false } });
  if (!reward) throw new Error("Reward not found or unavailable");

  const gam = await getOrCreateGamification(userId);
  if (gam.habitCoins < reward.coinCost) {
    throw new Error("Insufficient habit coins");
  }

  // Check if non-repeatable and already redeemed
  if (!reward.isRepeatable) {
    const existing = await UserReward.findOne({ userId, rewardKey });
    if (existing) throw new Error("You have already redeemed this reward");
  }

  // Deduct coins
  await UserGamification.updateOne(
    { userId },
    { $inc: { habitCoins: -reward.coinCost } }
  );

  // Record redemption
  const userReward = await UserReward.create({
    userId,
    rewardKey,
    redeemedAt: new Date(),
  });

  return { reward, userReward, remainingCoins: gam.habitCoins - reward.coinCost };
}
