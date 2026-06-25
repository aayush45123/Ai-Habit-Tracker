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

      const totalLogs = logs.length;

      if (totalLogs === 0) continue;

      const doneLogs = logs.filter((log) => log.status === "done").length;

      const missedLogs = logs.filter((log) => log.status === "missed").length;

      const completion = Math.round((doneLogs / totalLogs) * 100);

      const successRate = completion;

      const habitAge = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(habit.startDate)) / (1000 * 60 * 60 * 24),
        ),
      );

      let currentStreak = 0;

      for (const log of logs) {
        if (log.status === "done") {
          currentStreak++;
        } else {
          currentStreak = 0;
        }

        const target = log.status === "done" ? 1 : 0;

        csv +=
          `${currentStreak},` +
          `${completion},` +
          `${habit.longestStreak},` +
          `${totalLogs},` +
          `${missedLogs},` +
          `${successRate},` +
          `${habitAge},` +
          `${target}\n`;
      }
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
