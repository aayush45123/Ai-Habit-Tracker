// server/src/seeds/gamificationSeed.js
import Achievement from "../models/Achievement.js";
import Reward from "../models/Reward.js";
import GamificationChallenge from "../models/GamificationChallenge.js";

const DEFAULT_ACHIEVEMENTS = [
  {
    key: "first_habit",
    name: "First Step",
    description: "Completed your first habit.",
    icon: "target",
    rarity: "common",
    category: "consistency",
    xpReward: 25,
    coinReward: 5,
    criteria: { type: "first_habit", threshold: 1 },
    order: 1,
  },
  {
    key: "streak_3",
    name: "Getting Started",
    description: "Achieved a 3-day habit streak.",
    icon: "flame",
    rarity: "common",
    category: "streak",
    xpReward: 50,
    coinReward: 10,
    criteria: { type: "streak", threshold: 3 },
    order: 2,
  },
  {
    key: "streak_7",
    name: "One Week Warrior",
    description: "Maintained habits for 7 consecutive days.",
    icon: "zap",
    rarity: "uncommon",
    category: "streak",
    xpReward: 100,
    coinReward: 20,
    criteria: { type: "streak", threshold: 7 },
    order: 3,
  },
  {
    key: "streak_14",
    name: "Momentum Builder",
    description: "Crushed habits for 14 straight days.",
    icon: "rocket",
    rarity: "uncommon",
    category: "streak",
    xpReward: 200,
    coinReward: 40,
    criteria: { type: "streak", threshold: 14 },
    order: 4,
  },
  {
    key: "streak_30",
    name: "Habit Master",
    description: "Built unbreakable discipline with a 30-day streak.",
    icon: "diamond",
    rarity: "rare",
    category: "streak",
    xpReward: 500,
    coinReward: 100,
    criteria: { type: "streak", threshold: 30 },
    order: 5,
  },
  {
    key: "streak_60",
    name: "Consistency Champion",
    description: "60 days of absolute relentless consistency.",
    icon: "crown",
    rarity: "epic",
    category: "streak",
    xpReward: 750,
    coinReward: 150,
    criteria: { type: "streak", threshold: 60 },
    order: 6,
  },
  {
    key: "streak_100",
    name: "Unstoppable Force",
    description: "Triple digits! 100 consecutive days of mastery.",
    icon: "sparkles",
    rarity: "legendary",
    category: "streak",
    xpReward: 1500,
    coinReward: 300,
    criteria: { type: "streak", threshold: 100 },
    order: 7,
  },
  {
    key: "perfect_week",
    name: "Perfectionist",
    description: "Completed every single scheduled habit for 7 days in a row.",
    icon: "award",
    rarity: "rare",
    category: "consistency",
    xpReward: 150,
    coinReward: 30,
    criteria: { type: "perfect_week", threshold: 7 },
    order: 8,
  },
  {
    key: "level_5",
    name: "Consistent Contender",
    description: "Reached progression Level 5.",
    icon: "star",
    rarity: "common",
    category: "mastery",
    xpReward: 100,
    coinReward: 20,
    criteria: { type: "level", threshold: 5 },
    order: 9,
  },
  {
    key: "level_10",
    name: "Rising Star",
    description: "Reached progression Level 10.",
    icon: "trophy",
    rarity: "uncommon",
    category: "mastery",
    xpReward: 250,
    coinReward: 50,
    criteria: { type: "level", threshold: 10 },
    order: 10,
  },
  {
    key: "level_20",
    name: "Habit Strategist",
    description: "Ascended to progression Level 20.",
    icon: "compass",
    rarity: "rare",
    category: "mastery",
    xpReward: 500,
    coinReward: 100,
    criteria: { type: "level", threshold: 20 },
    order: 11,
  },
  {
    key: "level_30",
    name: "Zenith Master",
    description: "Reached the pinnacle at progression Level 30.",
    icon: "crown",
    rarity: "legendary",
    category: "mastery",
    xpReward: 1000,
    coinReward: 250,
    criteria: { type: "level", threshold: 30 },
    order: 12,
  },
];

const DEFAULT_REWARDS = [
  {
    key: "streak_freeze_pack",
    name: "Streak Shield (+1 Freeze)",
    description: "Add 1 streak freeze protection to your inventory (max 5).",
    icon: "shield",
    category: "functional",
    coinCost: 60,
    rarity: "common",
    isRepeatable: true,
  },
  {
    key: "custom_title_focus",
    name: "'Focus Architect' Title",
    description: "Unlock and equip the exclusive 'Focus Architect' profile status title.",
    icon: "target",
    category: "recognition",
    coinCost: 150,
    rarity: "uncommon",
    isRepeatable: false,
  },
  {
    key: "cyber_dark_theme",
    name: "Cyber Onyx Theme",
    description: "Unlock high-contrast neon accents and ultra-dark glassmorphism styling.",
    icon: "sparkles",
    category: "cosmetic",
    coinCost: 350,
    rarity: "rare",
    isRepeatable: false,
  },
  {
    key: "golden_badge_frame",
    name: "Golden Aura Profile Ring",
    description: "Prestige animated golden border highlighting your avatar in challenges.",
    icon: "crown",
    category: "cosmetic",
    coinCost: 500,
    rarity: "epic",
    isRepeatable: false,
  },
  {
    key: "deep_ai_analysis",
    name: "Executive AI Performance Audit",
    description: "Unlock an in-depth Groq-powered audit of habit drop-offs and optimal routines.",
    icon: "zap",
    category: "functional",
    coinCost: 750,
    rarity: "epic",
    isRepeatable: true,
  },
  {
    key: "titan_title",
    name: "'Disciplined Titan' Hall of Fame Title",
    description: "Legendary title commemorating highest habit adherence tier.",
    icon: "award",
    category: "recognition",
    coinCost: 1200,
    rarity: "legendary",
    isRepeatable: false,
  },
];

const DEFAULT_CHALLENGES = [
  {
    type: "weekly",
    title: "7-Day Sprint of Discipline",
    description: "Log at least 1 habit each day for 7 consecutive days.",
    difficulty: "medium",
    category: "streak",
    requirements: { daysRequired: 7, targetCount: 7 },
    xpReward: 150,
    coinReward: 30,
    badgeKey: "sprint_7",
    isActive: true,
  },
  {
    type: "weekly",
    title: "Hydration & Energy Baseline",
    description: "Maintain a health & wellness habit consistently throughout the week.",
    difficulty: "easy",
    category: "health",
    requirements: { daysRequired: 5, targetCount: 5 },
    xpReward: 100,
    coinReward: 20,
    badgeKey: "hydration_hero",
    isActive: true,
  },
  {
    type: "monthly",
    title: "30-Day Master Habit Transformation",
    description: "Complete 25 days of habit tracking within a single month.",
    difficulty: "hard",
    category: "mastery",
    requirements: { daysRequired: 25, targetCount: 25 },
    xpReward: 600,
    coinReward: 120,
    badgeKey: "titan_month",
    isActive: true,
  },
];

export async function seedGamificationData() {
  try {
    // Seed achievements using $set to update existing icons cleanly
    for (const ach of DEFAULT_ACHIEVEMENTS) {
      await Achievement.updateOne(
        { key: ach.key },
        { $set: ach },
        { upsert: true }
      );
    }

    // Seed rewards using $set to update existing icons cleanly
    for (const rew of DEFAULT_REWARDS) {
      await Reward.updateOne(
        { key: rew.key },
        { $set: rew },
        { upsert: true }
      );
    }

    // Seed starter global challenges
    for (const chal of DEFAULT_CHALLENGES) {
      await GamificationChallenge.updateOne(
        { title: chal.title },
        { $set: chal },
        { upsert: true }
      );
    }

    console.log("Gamification catalog seeded and updated with icon identifiers successfully.");
  } catch (err) {
    console.error("Error seeding gamification data:", err);
  }
}