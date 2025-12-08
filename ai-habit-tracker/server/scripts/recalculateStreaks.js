import mongoose from "mongoose";
import Habit from "../src/models/Habit.js";
import HabitLog from "../src/models/HabitLog.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(MONGO);
  console.log("Connected!");

  const habits = await Habit.find();

  for (const h of habits) {
    const logs = await HabitLog.find({ habitId: h._id, status: "done" }).sort({
      date: 1,
    });

    let best = 0;
    let streak = 0;
    let prev = null;

    logs.forEach((l) => {
      const d = new Date(l.date);

      if (prev) {
        const diff = (d - prev) / (1000 * 60 * 60 * 24);

        if (diff === 1) streak++;
        else streak = 1;
      } else streak = 1;

      best = Math.max(best, streak);
      prev = d;
    });

    await Habit.findByIdAndUpdate(h._id, { streak: best });
    console.log(`Updated ${h.title}: streak = ${best}`);
  }

  console.log("Streak recalculation done!");
  process.exit();
}

run();
