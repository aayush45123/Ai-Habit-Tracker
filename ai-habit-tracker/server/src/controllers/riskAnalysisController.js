import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import { spawn } from "child_process";

/*
|--------------------------------------------------------------------------
| Run Python ML Model
|--------------------------------------------------------------------------
*/

function predictRisk(
  streak,
  completion,
  longestStreak,
  totalLogs,
  missedLogs,
  successRate,
  habitAge,
) {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [
      "./python/predict.py",

      streak.toString(),
      completion.toString(),
      longestStreak.toString(),
      totalLogs.toString(),
      missedLogs.toString(),
      successRate.toString(),
      habitAge.toString(),
    ]);

    let output = "";
    let error = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", () => {
      if (error.length > 0) {
        return reject(error);
      }

      resolve(output.trim());
    });
  });
}
/*
|--------------------------------------------------------------------------
| Explainable AI
|--------------------------------------------------------------------------
*/

function buildAIExplanation(habit, completionRate, prediction) {
  const reasons = [];
  const suggestions = [];

  // STREAK

  if (habit.streak <= 2) {
    reasons.push(`Current streak is only ${habit.streak} day(s).`);
    suggestions.push("Build a streak of at least 3 consecutive days.");
  }

  if (habit.streak === 0) {
    reasons.push("No recent successful routine detected.");
    suggestions.push("Start with a smaller version of this habit.");
  }

  // COMPLETION

  if (completionRate < 40) {
    reasons.push(`Completion rate is only ${completionRate}%.`);
    suggestions.push("Reduce the difficulty of this habit.");
  } else if (completionRate < 70) {
    reasons.push(`Completion consistency is moderate (${completionRate}%).`);

    suggestions.push("Try completing this habit at the same time every day.");
  } else {
    reasons.push(`Strong completion rate of ${completionRate}%.`);
  }

  // ML RESULT

  if (prediction === "LIKELY_FAILURE") {
    reasons.push(
      "Machine learning predicts a high chance of breaking the habit.",
    );

    suggestions.push("Enable reminder notifications.");
    suggestions.push("Pair this habit with an existing routine.");
    suggestions.push("Track this habit immediately after waking up.");
  } else {
    reasons.push(
      "Machine learning predicts a high chance of maintaining this habit.",
    );

    suggestions.push("Maintain your current routine.");
    suggestions.push("Increase the challenge gradually.");
  }

  return {
    reasons,
    suggestions,
  };
}

/*
|--------------------------------------------------------------------------
| Risk Analysis API
|--------------------------------------------------------------------------
*/

export const getRiskAnalysis = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
    });

    const report = [];

    for (const habit of habits) {
      const logs = await HabitLog.find({
        habitId: habit._id,
      });

      const doneCount = logs.filter((log) => log.status === "done").length;

      const completionRate =
        logs.length === 0 ? 0 : Math.round((doneCount / logs.length) * 100);

      const totalLogs = logs.length;

      const missedLogs = logs.filter((log) => log.status === "missed").length;

      const successRate = completionRate;

      const habitAge = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(habit.startDate)) / (1000 * 60 * 60 * 24),
        ),
      );

      const longestStreak = habit.longestStreak || 0;

      //-----------------------------------------------------
      // RULE-BASED RISK
      //-----------------------------------------------------

      let risk = "LOW";

      if (completionRate < 40) {
        risk = "HIGH";
      } else if (completionRate < 70) {
        risk = "MEDIUM";
      }

      //-----------------------------------------------------
      // ML PREDICTION
      //-----------------------------------------------------

      const result = await predictRisk(
        habit.streak || 0,
        completionRate,
        longestStreak,
        totalLogs,
        missedLogs,
        successRate,
        habitAge,
      );

      const [
        predictionValue,
        confidenceValue,
        successProbability,
        failureProbability,
      ] = result.split(",");

      const prediction =
        predictionValue === "1" ? "LIKELY_SUCCESS" : "LIKELY_FAILURE";

      const confidence = Number(confidenceValue);

      const successChance = Number(successProbability);

      const failureChance = Number(failureProbability);

      //-----------------------------------------------------
      // EXPLANATION
      //-----------------------------------------------------

      const explanation = buildAIExplanation(habit, completionRate, prediction);

      //-----------------------------------------------------
      // FINAL RESPONSE
      //-----------------------------------------------------

      report.push({
        habit: habit.title,

        streak: habit.streak,

        longestStreak,

        completionRate,

        totalLogs,

        missedLogs,

        successRate,

        habitAge,

        risk,

        prediction,

        confidence,

        successChance,

        failureChance,

        reasons: explanation.reasons,

        suggestions: explanation.suggestions,
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
