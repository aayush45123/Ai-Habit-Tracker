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

// Calculate streak for a single habit
const calculateStreakForHabit = async (habitId) => {
  const allLogs = await HabitLog.find({ habitId }).sort({ date: 1 });

  if (allLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Normalize all log dates
  const normalizedLogs = allLogs.map((log) => ({
    ...log._doc,
    date: normalizeDateIST(log.date),
  }));

  // Calculate streaks
  for (let i = 0; i < normalizedLogs.length; i++) {
    const log = normalizedLogs[i];
    const logDate = new Date(log.date + "T00:00:00Z");

    if (log.status === "done") {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevLog = normalizedLogs[i - 1];
        const prevDate = new Date(prevLog.date + "T00:00:00Z");

        const diffDays = Math.round(
          (logDate - prevDate) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1 && prevLog.status === "done") {
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

  // Calculate current streak (from most recent log backwards)
  const lastLog = normalizedLogs[normalizedLogs.length - 1];
  const today = new Date();
  const todayIST = new Date(today.getTime() + 330 * 60000);
  const todayISO = todayIST.toISOString().split("T")[0];

  if (lastLog.status === "done") {
    currentStreak = 1;

    for (let i = normalizedLogs.length - 2; i >= 0; i--) {
      const currentLog = normalizedLogs[i];
      const nextLog = normalizedLogs[i + 1];

      const currentDate = new Date(currentLog.date + "T00:00:00Z");
      const nextDate = new Date(nextLog.date + "T00:00:00Z");

      const diffDays = Math.round(
        (nextDate - currentDate) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1 && currentLog.status === "done") {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
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
    console.log("   ✓ Streaks recalculated from all logs");
    console.log("   ✓ Longest streaks updated");
    console.log("   ✓ Missing startDate fields filled");
    console.log("   ✓ Missing frequency fields set to 'daily'");
    console.log("   ✓ Completion rates now calculated correctly");
    console.log("\n💡 Next steps:");
    console.log("   1. Restart your server");
    console.log("   2. Check the Analytics page");
    console.log("   3. Leaderboard should now show accurate percentages\n");
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
