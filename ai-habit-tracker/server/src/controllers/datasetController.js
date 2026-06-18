import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import fs from "fs";
import path from "path";

export const generateDataset = async (req, res) => {
  try {
    const habits = await Habit.find();

    let csv = "streak,target\n";

    for (const habit of habits) {
      const logs = await HabitLog.find({
        habitId: habit._id,
      }).sort({
        date: 1,
      });

      let currentStreak = 0;

      for (const log of logs) {
        const target = log.status === "done" ? 1 : 0;

        csv += `${currentStreak},${target}\n`;

        if (log.status === "done") {
          currentStreak++;
        } else {
          currentStreak = 0;
        }
      }
    }

    const filePath = path.join(process.cwd(), "python", "habits.csv");

    fs.writeFileSync(filePath, csv);

    res.json({
      message: "Dataset generated",
      path: filePath,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
