// server/src/scripts/migrateLongestStreaks.js
// Run this once to populate longestStreak for existing habits

import mongoose from "mongoose";
import Habit from "../src/models/Habit.js";
import HabitLog from "../src/models/HabitLog.js";
import dotenv from "dotenv";

dotenv.config();

async function migrateLongestStreaks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all habits
    const habits = await Habit.find({});
    console.log(`Found ${habits.length} habits to migrate`);

    for (const habit of habits) {
      console.log(`\nProcessing habit: ${habit.title} (${habit._id})`);

      // Get all logs for this habit, sorted by date
      const logs = await HabitLog.find({ habitId: habit._id }).sort({
        date: 1,
      });

      if (logs.length === 0) {
        console.log("  No logs found, setting longestStreak to 0");
        await Habit.findByIdAndUpdate(habit._id, { longestStreak: 0 });
        continue;
      }

      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate = null;

      // Calculate longest streak from all logs
      logs.forEach((log) => {
        const logDate = new Date(log.date);

        if (log.status === "done") {
          if (prevDate) {
            const diff = (logDate - prevDate) / (1000 * 60 * 60 * 24);

            if (diff === 1) {
              tempStreak++;
            } else if (diff > 1) {
              // Gap - save temp streak if longest
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          } else {
            tempStreak = 1;
          }

          longestStreak = Math.max(longestStreak, tempStreak);
          prevDate = logDate;
        } else {
          // "missed" breaks the streak
          if (tempStreak > 0) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
          }
          prevDate = logDate;
        }
      });

      // Update the habit with calculated longest streak
      console.log(`  Calculated longestStreak: ${longestStreak}`);
      console.log(`  Current streak in DB: ${habit.streak || 0}`);

      await Habit.findByIdAndUpdate(habit._id, {
        longestStreak: longestStreak,
      });

      console.log(`  ✅ Updated longestStreak to ${longestStreak}`);
    }

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateLongestStreaks();
