// server/src/controllers/gamificationController.js
import {
  getGamificationOverview,
  redeemReward as redeemRewardService,
} from "../services/gamification.service.js";
import { getUserAchievementsWithStatus } from "../services/achievement.service.js";
import GamificationChallenge from "../models/GamificationChallenge.js";
import UserChallenge from "../models/UserChallenge.js";
import Reward from "../models/Reward.js";
import UserReward from "../models/UserReward.js";
import XPTransaction from "../models/XPTransaction.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import UserGamification from "../models/UserGamification.js";
import { completeWithGroq, extractAndParseJSON } from "../utils/aiClient.js";

/**
 * GET /api/gamification/overview
 */
export async function getOverview(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const overview = await getGamificationOverview(userId);
    return res.status(200).json({ success: true, data: overview });
  } catch (error) {
    console.error("getOverview error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/gamification/achievements
 */
export async function getAchievements(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const achievements = await getUserAchievementsWithStatus(userId);
    return res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    console.error("getAchievements error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/gamification/challenges
 */
export async function getChallenges(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    // Get public challenges and personal AI challenges for this user
    const challenges = await GamificationChallenge.find({
      isActive: true,
      $or: [{ targetUserId: null }, { targetUserId: userId }],
    }).sort({ createdAt: -1 }).lean();

    // Get user progress
    const userChallenges = await UserChallenge.find({ userId }).lean();
    const userMap = new Map();
    userChallenges.forEach((uc) => userMap.set(uc.challengeId.toString(), uc));

    const result = challenges.map((ch) => {
      const userState = userMap.get(ch._id.toString());
      return {
        ...ch,
        isJoined: !!userState,
        status: userState ? userState.status : "not_joined",
        progress: userState ? userState.progress : 0,
        progressCount: userState ? userState.progressCount : 0,
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("getChallenges error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/gamification/challenges/:id/join
 */
export async function joinChallenge(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const challengeId = req.params.id;

    const challenge = await GamificationChallenge.findById(challengeId);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    const existing = await UserChallenge.findOne({ userId, challengeId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already joined this challenge" });
    }

    const userChallenge = await UserChallenge.create({
      userId,
      challengeId,
      status: "active",
      progress: 0,
      progressCount: 0,
    });

    return res.status(201).json({ success: true, data: userChallenge });
  } catch (error) {
    console.error("joinChallenge error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/gamification/challenges/ai-generate
 * Groq-powered personalized AI challenges
 */
export async function generateAIChallenges(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    // Fetch user habits & completion rate
    const habits = await Habit.find({ userId, isActive: { $ne: false } }).lean();
    const habitTitles = habits.map((h) => h.title).join(", ") || "General health, focus, and reading";

    const gam = await UserGamification.findOne({ userId }).lean();
    const userLevel = gam?.level || 1;

    const prompt = `You are an elite habit and gamification coach. Generate 2 personalized, achievable productivity/habit challenges for a user at Level ${userLevel}.
User's current habits: ${habitTitles}.

Return ONLY valid JSON matching this exact structure:
[
  {
    "title": "Title of Challenge (Punchy & Motivating)",
    "description": "Clear single-sentence instruction on what to accomplish",
    "difficulty": "easy" | "medium" | "hard",
    "category": "streak" | "health" | "productivity" | "mastery",
    "requirements": {
      "daysRequired": 5,
      "targetCount": 5
    },
    "xpReward": 150,
    "coinReward": 30
  }
]`;

    let generatedChallenges = [];
    try {
      const aiResponse = await completeWithGroq({
        prompt,
        temperature: 0.6,
        maxTokens: 500,
      });
      generatedChallenges = extractAndParseJSON(aiResponse);
    } catch (aiErr) {
      console.warn("Groq AI challenge gen failed, falling back to heuristic:", aiErr.message);
      // Fallback challenges
      generatedChallenges = [
        {
          title: "Focus Momentum Surge",
          description: "Complete your key productivity habit consistently for the next 5 days.",
          difficulty: "medium",
          category: "productivity",
          requirements: { daysRequired: 5, targetCount: 5 },
          xpReward: 150,
          coinReward: 30,
        },
        {
          title: "Weekend Adherence Shield",
          description: "Maintain habit execution over the upcoming weekend.",
          difficulty: "easy",
          category: "streak",
          requirements: { daysRequired: 3, targetCount: 3 },
          xpReward: 100,
          coinReward: 20,
        },
      ];
    }

    const savedChallenges = [];
    for (const item of generatedChallenges) {
      const doc = await GamificationChallenge.create({
        type: "ai_generated",
        title: item.title,
        description: item.description,
        difficulty: item.difficulty || "medium",
        category: item.category || "productivity",
        requirements: item.requirements || { daysRequired: 5, targetCount: 5 },
        xpReward: item.xpReward || 150,
        coinReward: item.coinReward || 30,
        isAIGenerated: true,
        targetUserId: userId,
        isActive: true,
      });

      // Automatically enroll user in the AI challenge
      await UserChallenge.create({
        userId,
        challengeId: doc._id,
        status: "active",
        progress: 0,
        progressCount: 0,
      });

      savedChallenges.push(doc);
    }

    return res.status(200).json({ success: true, data: savedChallenges });
  } catch (error) {
    console.error("generateAIChallenges error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/gamification/rewards
 */
export async function getRewards(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    const [rewards, userRedemptions, gam] = await Promise.all([
      Reward.find({ isAvailable: { $ne: false } }).sort({ coinCost: 1 }).lean(),
      UserReward.find({ userId }).lean(),
      UserGamification.findOne({ userId }).lean(),
    ]);

    const redeemedKeys = new Set(userRedemptions.map((r) => r.rewardKey));

    const catalog = rewards.map((rew) => ({
      ...rew,
      isRedeemed: redeemedKeys.has(rew.key),
      canAfford: (gam?.habitCoins || 0) >= rew.coinCost,
    }));

    return res.status(200).json({
      success: true,
      data: {
        habitCoins: gam?.habitCoins || 0,
        streakFreezes: gam?.streakFreezes || 0,
        rewards: catalog,
      },
    });
  } catch (error) {
    console.error("getRewards error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/gamification/rewards/:key/redeem
 */
export async function redeemReward(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { key } = req.params;

    // Special logic if redeeming streak freeze pack
    if (key === "streak_freeze_pack") {
      const gam = await UserGamification.findOne({ userId });
      if (gam && gam.streakFreezes >= 5) {
        return res.status(400).json({
          success: false,
          message: "Streak freeze inventory is already full (max 5)",
        });
      }
    }

    const result = await redeemRewardService(userId, key);

    // If streak freeze pack, increment freezes
    if (key === "streak_freeze_pack") {
      await UserGamification.updateOne(
        { userId, streakFreezes: { $lt: 5 } },
        { $inc: { streakFreezes: 1 } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Reward redeemed successfully!",
      data: result,
    });
  } catch (error) {
    console.error("redeemReward error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/gamification/history
 */
export async function getXPHistory(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [transactions, total] = await Promise.all([
      XPTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      XPTransaction.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getXPHistory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
