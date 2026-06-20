import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import { spawn } from "child_process";

function predictRisk(streak, completion) {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [
      "./python/predict.py",
      streak.toString(),
      completion.toString(),
    ]);

    let result = "";
    let error = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", () => {
      if (error) {
        reject(error);
      } else {
        resolve(result.trim());
      }
    });
  });
}

export const getRiskAnalysis = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
    });

    console.log("USER ID:", req.user._id);
    console.log("HABITS:", habits.length);
    console.log(habits);

    const report = [];

    for (const habit of habits) {
      const logs = await HabitLog.find({
        habitId: habit._id,
      });

      const doneCount = logs.filter((log) => log.status === "done").length;

      const completionRate =
        logs.length === 0 ? 0 : Math.round((doneCount / logs.length) * 100);

      let risk = "LOW";

      if (completionRate < 40) {
        risk = "HIGH";
      } else if (completionRate < 70) {
        risk = "MEDIUM";
      }

      const prediction = await predictRisk(habit.streak || 0, completionRate);

      report.push({
        habit: habit.title,
        streak: habit.streak,
        completionRate,
        risk,
        prediction: prediction === "1" ? "LIKELY_SUCCESS" : "LIKELY_FAILURE",
      });
    }

    report.sort((a, b) => a.completionRate - b.completionRate);

    res.json(report);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
