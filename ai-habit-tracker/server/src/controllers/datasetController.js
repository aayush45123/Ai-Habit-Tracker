import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import fs from "fs";
import path from "path";

export const generateDataset = async (req, res) => {
  try {
    const habits = await Habit.find();

    let csv = "streak,completion,target\n";

    for (const habit of habits) {
      const logs = await HabitLog.find({
        habitId: habit._id,
      });

      if (logs.length < 2) continue;

      const doneCount = logs.filter((l) => l.status === "done").length;

      const completion = Math.round((doneCount / logs.length) * 100);

      const target = completion >= 50 ? 1 : 0;

      csv += `${habit.streak},${completion},${target}\n`;
    }

    const csvPath = path.join(process.cwd(), "python", "habits.csv");

    fs.writeFileSync(csvPath, csv);

    res.json({
      message: "Dataset generated",
      path: csvPath,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
