import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

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

      // Rule-based prediction logic
      let prediction = "LIKELY_FAILURE";

      if (habit.streak >= 6) {
        prediction = "LIKELY_SUCCESS";
      } else if (habit.streak >= 3 && completionRate >= 70) {
        prediction = "LIKELY_SUCCESS";
      } else if (habit.streak < 3 && completionRate >= 80) {
        prediction = "LIKELY_SUCCESS";
      }

      report.push({
        habit: habit.title,
        streak: habit.streak,
        completionRate,
        risk,
        prediction,
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
