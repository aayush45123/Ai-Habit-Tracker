import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import fs from "fs";
import path from "path";

export const generateDataset = async (req, res) => {
  try {
    const habits = await Habit.find();

    let csv =
      "streak,completion,longestStreak,totalLogs,missedLogs,successRate,habitAge,target\n";

    for (const habit of habits) {
      const logs = await HabitLog.find({
        habitId: habit._id,
      }).sort({
        date: 1,
      });

      if (logs.length === 0) continue;

      const habitStartDate = new Date(habit.startDate);

      let currentStreak = 0;
      let longestStreak = 0;
      let doneCount = 0;
      let missedCount = 0;

      logs.forEach((log, i) => {
        if (log.status === "done") {
          currentStreak++;
          doneCount++;
        } else {
          currentStreak = 0;
          missedCount++;
        }

        longestStreak = Math.max(longestStreak, currentStreak);

        const totalLogsSoFar = i + 1;
        const completion = Math.round((doneCount / totalLogsSoFar) * 100);
        const successRate = completion;

        const habitAge = Math.max(
          1,
          Math.floor(
            (new Date(log.date) - habitStartDate) / (1000 * 60 * 60 * 24),
          ) + 1,
        );

        const target = log.status === "done" ? 1 : 0;

        csv +=
          `${currentStreak},` +
          `${completion},` +
          `${longestStreak},` +
          `${totalLogsSoFar},` +
          `${missedCount},` +
          `${successRate},` +
          `${habitAge},` +
          `${target}\n`;
      });
    }

    const pythonFolder = path.join(process.cwd(), "python");

    if (!fs.existsSync(pythonFolder)) {
      fs.mkdirSync(pythonFolder);
    }

    const filePath = path.join(pythonFolder, "habits.csv");

    fs.writeFileSync(filePath, csv);

    return res.json({
      success: true,
      message: "Dataset Generated Successfully",
      rows: csv.split("\n").length - 2,
      path: filePath,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
