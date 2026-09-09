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
    if (status !== "completed" && status !== "done") return;

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

    // 2. Fetch all user habits
    const userHabits = await Habit.find({ userId, isActive: { $ne: false } }).select("_id streak longestStreak").lean();
    const habitIds = userHabits.map((h) => h._id);

    // Count all completions for this user
    const totalLogsCount = await HabitLog.countDocuments({
      habitId: { $in: habitIds },
      status: "done",
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
    if (userHabits.length > 0) {
      const todayLogs = await HabitLog.find({
        habitId: { $in: habitIds },
        date: {
          $gte: new Date(todayStr + "T00:00:00.000Z"),
          $lte: new Date(todayStr + "T23:59:59.999Z"),
        },
        status: "done",
      }).select("habitId").lean();

      const completedIds = new Set(todayLogs.map((l) => l.habitId.toString()));
      const allDone = userHabits.every((h) => completedIds.has(h._id.toString()));

      if (allDone) {
        await awardXP({
          userId,
          amount: 30,
          coins: 8,
          source: "perfect_day",
          refId: todayStr,
          idempotencyKey: `perfect_day_${userId}_${todayStr}`,
          metadata: { date: todayStr, habitsCount: userHabits.length },
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
    });

    for (const uc of activeChallenges) {
      const chal = await GamificationChallenge.findById(uc.challengeId);
      if (!chal || !chal.isActive) continue;

      // Increment progress count
      uc.progressCount = (uc.progressCount || 0) + 1;
      uc.progress = Math.min(100, Math.round((uc.progressCount / chal.targetCount) * 100));

      if (uc.progress >= 100) {
        uc.status = "completed";
        uc.completedAt = new Date();

        // Award challenge rewards
        await awardXP({
          userId,
          amount: chal.xpReward || 100,
          coins: chal.coinReward || 25,
          source: "challenge_complete",
          refId: chal._id.toString(),
          idempotencyKey: `challenge_${userId}_${chal._id}`,
          metadata: { challengeTitle: chal.title },
        });

        // Grant badge if specified
        if (chal.badgeKey) {
          await UserGamification.updateOne(
            { userId, featuredBadges: { $ne: chal.badgeKey } },
            { $push: { featuredBadges: { $each: [chal.badgeKey], $slice: -3 } } }
          );
        }

        emitNotification(userId, {
          type: "challenge_completed",
          title: `🏆 Challenge Completed: ${chal.title}!`,
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
 * Get comprehensive gamification overview for dashboard & profile page
 */
export async function getGamificationOverview(userId) {
  let gam = await getOrCreateGamification(userId);

  // Retroactive check: ensure user gets First Step and appropriate XP if they already completed habits
  const userHabits = await Habit.find({ userId }).select("_id title category streak longestStreak").lean();
  const habitIds = userHabits.map((h) => h._id);

  const totalLogsCount = await HabitLog.countDocuments({
    habitId: { $in: habitIds },
    status: "done",
  });

  const maxStreak = userHabits.reduce(
    (max, h) => Math.max(max, h.streak || 0, h.longestStreak || 0),
    0
  );

  // If user completed at least 1 habit, evaluate achievements (e.g. first_habit, streak_3, etc.)
  if (totalLogsCount > 0) {
    // If totalXP is 0 despite completions, award first_habit + base completion XP catchup!
    if (gam.totalXP === 0) {
      await awardXP({
        userId,
        amount: 35, // 10 base + 25 first habit
        coins: 7,
        source: "habit_complete",
        idempotencyKey: `init_habit_catchup_${userId}`,
        metadata: { note: "Catchup XP for previous completion" },
      });
    }

    await evaluateAchievements(userId, {
      streak: maxStreak,
      totalCompleted: totalLogsCount,
      level: gam.level,
    });

    // Re-fetch fresh gamification document
    gam = await UserGamification.findOne({ userId });
  }

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

  // Fetch recent habit completions (last 10 done logs) for LeetCode recent activity tab
  const recentDoneLogs = await HabitLog.find({
    habitId: { $in: habitIds },
    status: "done",
  })
    .sort({ date: -1, createdAt: -1 })
    .limit(10)
    .lean();

  const habitMap = new Map();
  userHabits.forEach((h) => habitMap.set(h._id.toString(), h));

  const recentActivity = recentDoneLogs.map((log) => {
    const habit = habitMap.get(log.habitId.toString());
    return {
      _id: log._id,
      habitId: log.habitId,
      habitTitle: habit?.title || "Habit",
      category: habit?.category || "general",
      date: log.date,
      createdAt: log.createdAt || log.date,
      status: log.status,
    };
  });

  // Fetch year-round heatmap data (all completed logs in past 365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const yearLogs = await HabitLog.find({
    habitId: { $in: habitIds },
    status: "done",
    date: { $gte: oneYearAgo },
  }).select("date").lean();

  const activityHeatmap = {};
  yearLogs.forEach((l) => {
    const dStr = typeof l.date === "string" ? l.date.split("T")[0] : l.date.toISOString().split("T")[0];
    activityHeatmap[dStr] = (activityHeatmap[dStr] || 0) + 1;
  });

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
      stats: {
        totalHabits: userHabits.length,
        totalCompletedLogs: totalLogsCount,
        maxStreak,
        activeDaysCount: Object.keys(activityHeatmap).length,
      },
    },
    recentTransactions,
    recentActivity,
    activityHeatmap,
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
