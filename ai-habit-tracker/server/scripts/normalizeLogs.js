import mongoose from "mongoose";
import dotenv from "dotenv";
import HabitLog from "../src/models/HabitLog.js";

dotenv.config();

async function normalizeLogs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");
    console.log("Normalizing dates...");

    const logs = await HabitLog.find({});

    for (const log of logs) {
      if (!log.date) continue;

      // Convert "2025-12-02T00:00:00.000Z" → "2025-12-02"
      const cleanDate = new Date(log.date).toISOString().split("T")[0];

      // Only update if different
      if (log.date !== cleanDate) {
        log.date = cleanDate;
        await log.save();
        console.log(`Updated log ${log._id} → ${cleanDate}`);
      }
    }

    console.log("\nNormalization complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

normalizeLogs();
