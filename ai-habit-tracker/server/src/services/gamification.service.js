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
  levelFromXP,
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

// ─────────────────────────────────────────────────────────────────────────────
// Streak milestone XP table (mirrors the live processHabitCompletion table)
// ─────────────────────────────────────────────────────────────────────────────
const RETRO_STREAK_MILESTONES = [
  { days: 3,   xp: 50,   coins: 10  },
  { days: 7,   xp: 100,  coins: 20  },
  { days: 14,  xp: 200,  coins: 40  },
  { days: 30,  xp: 500,  coins: 100 },
  { days: 60,  xp: 750,  coins: 150 },
  { days: 100, xp: 1000, coins: 200 },
];

/**
 * Retroactively award all XP / coins a user should have earned from
 * past habit completions, streak milestones, and perfect-day bonuses.
 *
 * Safe to call multiple times – every award uses an idempotency key so
 * nothing is ever double-granted.
 *
 * @param {string|ObjectId} userId
 * @param {Object}          opts
 * @param {Array}           opts.userHabits     – lean Habit docs
 * @param {Array}           opts.habitIds       – array of _id
 * @param {number}          opts.totalLogsCount – pre-counted completed logs
 * @param {number}          opts.maxStreak      – max streak across all habits
 */
export async function runRetroactiveBackfill(userId, { userHabits, habitIds, totalLogsCount, maxStreak } = {}) {
  try {
    // ── 1. Per-completion XP ────────────────────────────────────────────────
    // Award 10 XP + 2 coins per completion that hasn't been counted yet.
    // We use a single bulk idempotency key per user so we only run this once.
    const completionKey = `retro_completions_v2_${userId}`;
    const alreadyRan = await XPTransaction.findOne({ idempotencyKey: completionKey });
    if (!alreadyRan && totalLogsCount > 0) {
      const totalXpForCompletions = totalLogsCount * 10;
      const totalCoinsForCompletions = totalLogsCount * 2;
      await awardXP({
        userId,
        amount: totalXpForCompletions,
        coins: totalCoinsForCompletions,
        source: "retro_completions",
        idempotencyKey: completionKey,
        metadata: { totalLogsCount, note: "Retroactive backfill for all past habit completions" },
      });
    }

    // ── 2. First-habit bonus ─────────────────────────────────────────────────
    if (totalLogsCount > 0) {
      await awardXP({
        userId,
        amount: 25,
        coins: 5,
        source: "first_habit",
        idempotencyKey: `first_habit_${userId}`,
        metadata: { note: "Retroactive first-habit bonus" },
      });
    }

    // ── 3. Streak milestone bonuses ──────────────────────────────────────────
    // Award every milestone the user's all-time best streak qualifies for.
    for (const ms of RETRO_STREAK_MILESTONES) {
      if (maxStreak >= ms.days) {
        await awardXP({
          userId,
          amount: ms.xp,
          coins: ms.coins,
          source: "retro_streak_milestone",
          refId: `${ms.days}`,
          idempotencyKey: `retro_streak_${userId}_${ms.days}`,
          metadata: { milestoneStreak: ms.days, note: "Retroactive streak milestone backfill" },
        });
      }
    }

    // ── 4. Perfect-day bonuses ───────────────────────────────────────────────
    // For each calendar date where all active habits were completed, award
    // 30 XP + 8 coins. We use per-date idempotency keys so live awards are
    // never re-granted.
    if (habitIds.length > 0 && userHabits.length > 0) {
      // Fetch all done logs to find perfect days
      const allDoneLogs = await HabitLog.find({
        habitId: { $in: habitIds },
        status: "done",
      }).select("habitId date").lean();

      // Group by date
      const byDate = {};
      for (const log of allDoneLogs) {
        const dStr = typeof log.date === "string"
          ? log.date.split("T")[0]
          : new Date(log.date).toISOString().split("T")[0];
        if (!byDate[dStr]) byDate[dStr] = new Set();
        byDate[dStr].add(log.habitId.toString());
      }

      const allHabitIds = new Set(habitIds.map((id) => id.toString()));

      for (const [dateStr, completedSet] of Object.entries(byDate)) {
        // On that date, were ALL of the user's habits completed?
        const allDone = [...allHabitIds].every((id) => completedSet.has(id));
        if (allDone) {
          await awardXP({
            userId,
            amount: 30,
            coins: 8,
            source: "perfect_day",
            refId: dateStr,
            idempotencyKey: `perfect_day_${userId}_${dateStr}`,
            metadata: { date: dateStr, note: "Retroactive perfect-day backfill" },
          });
        }
      }
    }

    // ── 5. Challenge completion XP ───────────────────────────────────────────
    // Award XP for challenges the user has already completed but may not
    // have received rewards for (e.g., if challenge was seeded after completion).
    const completedChallenges = await UserChallenge.find({
      userId,
      status: "completed",
    }).populate("challengeId").lean();

    for (const uc of completedChallenges) {
      const chal = uc.challengeId;
      if (!chal) continue;
      await awardXP({
        userId,
        amount: chal.xpReward || 100,
        coins: chal.coinReward || 25,
        source: "challenge_complete",
        refId: chal._id ? chal._id.toString() : String(uc.challengeId),
        idempotencyKey: `challenge_${userId}_${chal._id || uc.challengeId}`,
        metadata: { challengeTitle: chal.title || "Challenge", note: "Retroactive challenge reward" },
      });
    }

  } catch (err) {
    console.error("runRetroactiveBackfill error:", err);
  }
}

/**
 * Get comprehensive gamification overview for dashboard & profile page
 */
export async function getGamificationOverview(userId) {
  let gam = await getOrCreateGamification(userId);

  // ── Gather core stats ──────────────────────────────────────────────────────
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

  // ── Retroactive backfill ───────────────────────────────────────────────────
  // Run whenever the stored XP is below the minimum expected for completions.
  // All awards are idempotent – safe to run on every overview load.
  if (totalLogsCount > 0) {
    const expectedMinXP = totalLogsCount * 10; // floor: 10 XP per completion
    if (gam.totalXP < expectedMinXP) {
      await runRetroactiveBackfill(userId, { userHabits, habitIds, totalLogsCount, maxStreak });
    }

    // Count completed challenges for badge evaluation
    const completedChallengesCount = await UserChallenge.countDocuments({
      userId,
      status: "completed",
    });

    // Re-fetch after potential backfill to get accurate level
    gam = await UserGamification.findOne({ userId });

    await evaluateAchievements(userId, {
      streak: maxStreak,
      totalCompleted: totalLogsCount,
      level: gam ? gam.level : 1,
      challengesCompleted: completedChallengesCount,
    });

    // Re-fetch after achievement evaluation (achievements may award XP → level up)
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
