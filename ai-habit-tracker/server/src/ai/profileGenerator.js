import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import FocusLog from "../models/FocusLog.js";
import UserProfile from "../models/UserProfile.js";

export async function generateProfile(userId) {
  const habits = await Habit.find({ userId });

  if (!habits.length) {
    return null;
  }

  let strongestHabit = "";
  let weakestHabit = "";

  let highestRate = -1;
  let lowestRate = 101;

  let totalDone = 0;
  let totalLogs = 0;

  for (const habit of habits) {
    const logs = await HabitLog.find({
      habitId: habit._id,
    });

    const doneCount = logs.filter((l) => l.status === "done").length;

    const rate =
      logs.length === 0 ? 0 : Math.round((doneCount / logs.length) * 100);

    totalDone += doneCount;
    totalLogs += logs.length;

    if (rate > highestRate) {
      highestRate = rate;
      strongestHabit = habit.title;
    }

    if (rate < lowestRate) {
      lowestRate = rate;
      weakestHabit = habit.title;
    }
  }

  const completionRate =
    totalLogs === 0 ? 0 : Math.round((totalDone / totalLogs) * 100);

  const focusLogs = await FocusLog.find({
    userId,
    status: "completed",
  });

  const totalFocusMinutes = focusLogs.reduce(
    (sum, session) => sum + session.durationMin,
    0,
  );

  const focusScore = Math.min(100, Math.round(totalFocusMinutes / 10));

  const disciplineScore = Math.round(completionRate * 0.7 + focusScore * 0.3);

  const recommendations = [];

  if (completionRate < 50) {
    recommendations.push(
      "Reduce your daily habit count and focus on consistency.",
    );
  }

  if (focusScore < 40) {
    recommendations.push("Increase focused study sessions.");
  }

  if (weakestHabit) {
    recommendations.push(`Improve consistency in ${weakestHabit}.`);
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      disciplineScore,
      completionRate,
      focusScore,
      strongestHabit,
      weakestHabit,
      totalHabits: habits.length,
      completedHabits: totalDone,
      recommendations,
    },
    {
      upsert: true,
      new: true,
    },
  );

  return profile;
}
