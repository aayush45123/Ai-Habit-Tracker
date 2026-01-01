// server/src/scripts/recalculateStreaks.js
import mongoose from "mongoose";
import Habit from "../src/models/Habit.js";
import HabitLog from "../src/models/HabitLog.js";
import { normalizeDateIST } from "../src/utils/getTodayIST.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected for migration");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Helper: Check if two dates are consecutive
const areConsecutiveDays = (date1String, date2String) => {
  const date1 = new Date(date1String + "T00:00:00Z");
  const date2 = new Date(date2String + "T00:00:00Z");

  const diffMs = Math.abs(date2 - date1);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
};

// Helper: Get date N days ago in IST
const getDaysAgo = (n) => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 330 * 60000);
  istDate.setDate(istDate.getDate() - n);
  return istDate.toISOString().split("T")[0];
};

// Helper: Get today in IST
const getTodayIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 330 * 60000);
  return istDate.toISOString().split("T")[0];
};

// Calculate streak for a single habit (FIXED VERSION)
const calculateStreakForHabit = async (habitId) => {
  const allLogs = await HabitLog.find({ habitId }).sort({ date: 1 });

  if (allLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Normalize all log dates
  const normalizedLogs = allLogs.map((log) => ({
    ...log._doc,
    date: normalizeDateIST(log.date),
  }));

  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate LONGEST streak
  for (let i = 0; i < normalizedLogs.length; i++) {
    const log = normalizedLogs[i];

    if (log.status === "done") {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevLog = normalizedLogs[i - 1];

        // Check if consecutive days
        if (
          areConsecutiveDays(prevLog.date, log.date) &&
          prevLog.status === "done"
        ) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate CURRENT streak - must include today
  const todayISO = getTodayIST();
  const todayLog = normalizedLogs.find((log) => log.date === todayISO);

  let currentStreak = 0;

  if (todayLog && todayLog.status === "done") {
    currentStreak = 1;

    // Count backwards from today by calendar date
    let checkDate = getDaysAgo(1); // Yesterday

    for (let daysBack = 1; daysBack <= normalizedLogs.length; daysBack++) {
      const logForDate = normalizedLogs.find((log) => log.date === checkDate);

      if (logForDate && logForDate.status === "done") {
        currentStreak++;
        checkDate = getDaysAgo(daysBack + 1);
      } else {
        // Streak broken
        break;
      }
    }
  } else {
    // Today is not done, so current streak is 0
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
};

// Fix missing startDate and frequency for habits
const fixHabitMetadata = async () => {
  try {
    console.log(
      "\n🔧 Fixing missing habit metadata (startDate, frequency)...\n"
    );

    const habits = await Habit.find({});
    let fixed = 0;

    for (const habit of habits) {
      let needsUpdate = false;
      const updateData = {};

      // Fix missing startDate
      if (!habit.startDate) {
        // Use createdAt or first log date as startDate
        const firstLog = await HabitLog.findOne({ habitId: habit._id }).sort({
          date: 1,
        });

        if (firstLog) {
          updateData.startDate = normalizeDateIST(firstLog.date);
        } else {
          // Use createdAt if no logs exist
          const createdDate = new Date(habit.createdAt);
          const createdIST = new Date(createdDate.getTime() + 330 * 60000);
          updateData.startDate = createdIST.toISOString().split("T")[0];
        }
        needsUpdate = true;
        console.log(
          `   📅 Setting startDate for "${habit.title}": ${updateData.startDate}`
        );
      }

      // Fix missing frequency
      if (!habit.frequency) {
        updateData.frequency = "daily"; // Default to daily
        needsUpdate = true;
        console.log(`   🔄 Setting frequency for "${habit.title}": daily`);
      }

      if (needsUpdate) {
        await Habit.findByIdAndUpdate(habit._id, updateData);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed metadata for ${fixed} habits\n`);
  } catch (error) {
    console.error("❌ Error fixing habit metadata:", error);
  }
};

// Main migration function
const recalculateAllStreaks = async () => {
  try {
    console.log("🔄 Starting full migration for all habits...\n");
    console.log("=".repeat(60));

    // Step 1: Fix missing metadata
    await fixHabitMetadata();

    console.log("=".repeat(60));
    console.log("\n🔄 Recalculating streaks for all habits...\n");

    const habits = await Habit.find({});
    console.log(`📊 Found ${habits.length} habits to process\n`);

    let updated = 0;
    let failed = 0;

    for (const habit of habits) {
      try {
        console.log(`⏳ Processing: ${habit.title} (ID: ${habit._id})`);

        const { currentStreak, longestStreak } = await calculateStreakForHabit(
          habit._id
        );

        // Get the last log for this habit
        const lastLog = await HabitLog.findOne({ habitId: habit._id }).sort({
          date: -1,
        });

        const updateData = {
          streak: currentStreak,
          longestStreak: longestStreak,
        };

        if (lastLog) {
          updateData.lastDate = normalizeDateIST(lastLog.date);
          updateData.lastStatus = lastLog.status;
        }

        await Habit.findByIdAndUpdate(habit._id, updateData);

        // Calculate completion stats
        const allLogs = await HabitLog.find({ habitId: habit._id });
        const doneCount = allLogs.filter((l) => l.status === "done").length;
        const totalLogs = allLogs.length;

        const startDate = habit.startDate
          ? new Date(habit.startDate + "T00:00:00Z")
          : new Date(habit.createdAt);
        const today = new Date();
        const todayIST = new Date(today.getTime() + 330 * 60000);
        const daysSinceStart =
          Math.floor((todayIST - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const completionRate =
          daysSinceStart > 0
            ? Math.round((doneCount / daysSinceStart) * 100)
            : 0;

        console.log(`   ✅ Updated successfully`);
        console.log(`   📈 Current Streak: ${currentStreak}`);
        console.log(`   🏆 Longest Streak: ${longestStreak}`);
        console.log(
          `   📊 Completion Rate: ${completionRate}% (${doneCount}/${daysSinceStart} days)`
        );
        console.log(`   📝 Total Logs: ${totalLogs}\n`);

        updated++;
      } catch (error) {
        console.error(`   ❌ Failed to update ${habit.title}:`, error.message);
        failed++;
      }
    }

    console.log("=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${updated} habits`);
    console.log(`❌ Failed: ${failed} habits`);
    console.log(`📝 Total processed: ${habits.length} habits`);
    console.log("=".repeat(60) + "\n");

    console.log("✨ Migration completed!");
    console.log("\n📋 What was fixed:");
    console.log("   ✓ Streaks recalculated with FIXED logic");
    console.log("   ✓ Current streaks now check if today is done");
    console.log("   ✓ Longest streaks updated correctly");
    console.log("   ✓ Missing startDate fields filled");
    console.log("   ✓ Missing frequency fields set to 'daily'");
    console.log("   ✓ Completion rates now calculated correctly");
    console.log("\n💡 Next steps:");
    console.log("   1. Restart your server");
    console.log("   2. Check the Dashboard to see your streaks");
    console.log("   3. Check Analytics page for leaderboard");
    console.log("   4. Log a new habit to test real-time updates\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Run the migration
const runMigration = async () => {
  try {
    await connectDB();
    await recalculateAllStreaks();

    console.log("🎉 Migration completed successfully!");
    console.log("💡 You can now restart your server.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

// Execute migration
runMigration();
