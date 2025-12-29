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

// Main migration function
const recalculateAllStreaks = async () => {
  try {
    console.log("🔄 Starting streak recalculation for all habits...\n");

    const habits = await Habit.find({});
    console.log(`📊 Found ${habits.length} habits to process\n`);

    let updated = 0;
    let failed = 0;

    for (const habit of habits) {
      try {
        console.log(`\n⏳ Processing: ${habit.title} (ID: ${habit._id})`);

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

        console.log(`   ✅ Updated successfully`);
        console.log(`   📈 Current Streak: ${currentStreak}`);
        console.log(`   🏆 Longest Streak: ${longestStreak}`);

        updated++;
      } catch (error) {
        console.error(`   ❌ Failed to update ${habit.title}:`, error.message);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully updated: ${updated} habits`);
    console.log(`❌ Failed: ${failed} habits`);
    console.log(`📝 Total processed: ${habits.length} habits`);
    console.log("=".repeat(60) + "\n");

    console.log("✨ Streak recalculation completed!");
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

    console.log("\n🎉 Migration completed successfully!");
    console.log("💡 You can now restart your server.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

// Execute migration
runMigration();
