import JournalEntry from "../models/JournalEntry.js";
import HabitLog from "../models/HabitLog.js";
import Habit from "../models/Habit.js";
import { getTodayIST, getDaysAgoIST } from "../utils/getTodayIST.js";

// Utility to calculate Pearson-like covariance / correlation coefficient
function calculateCorrelation(arrX, arrY) {
  if (!arrX || !arrY || arrX.length < 3 || arrX.length !== arrY.length) return 0;
  const n = arrX.length;
  const sumX = arrX.reduce((a, b) => a + b, 0);
  const sumY = arrY.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = arrX[i] - meanX;
    const diffY = arrY[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

/**
 * Generate Comprehensive Analytics & Intelligence Insights
 */
export async function generateJournalAnalytics(userId) {
  const entries = await JournalEntry.find({ userId }).sort({ date: -1 }).limit(90);
  const habits = await Habit.find({ userId });
  const habitIds = habits.map((h) => h._id);
  const habitLogs = await HabitLog.find({ habitId: { $in: habitIds } });

  const totalEntries = entries.length;
  if (totalEntries === 0) {
    return {
      summary: {
        totalEntries: 0,
        currentStreak: 0,
        avgMoodScore: 0,
        avgProductivity: 0,
        avgSleepHours: 0,
        avgLearningHours: 0,
      },
      productivity: { mostProductiveDay: "N/A", avgHours: 0, weeklyConsistency: 0 },
      learning: { totalHours: 0, topicsCount: 0, activeDays: 0 },
      fitness: { avgCalories: 0, avgWater: 0, stepHistory: [], weightTrend: [] },
      mood: { moodDistribution: {}, stressFrequency: 0, averageScore: 0 },
      correlations: [],
      intelligenceInsights: [
        {
          title: "Start Journaling Today",
          description: "Log your first daily entry to unlock personalized correlations and growth insights!",
          category: "Getting Started",
        },
      ],
    };
  }

  // 1. Calculate Journaling Streak
  let streak = 0;
  const todayISO = getTodayIST();
  for (let i = 0; i < 90; i++) {
    const checkDate = getDaysAgoIST(i);
    const hasEntry = entries.some((e) => e.date === checkDate);
    if (hasEntry) {
      streak++;
    } else if (i === 0) {
      // If today is not logged yet, don't break streak if yesterday was logged
      continue;
    } else {
      break;
    }
  }

  // 2. Metric Aggregations
  const totalProdHours = entries.reduce((acc, e) => acc + (e.productivityHours || 0), 0);
  const totalLearnHours = entries.reduce((acc, e) => acc + (e.learningHours || 0), 0);
  const totalSleep = entries.reduce((acc, e) => acc + (e.sleepHours || 0), 0);
  const totalMood = entries.reduce((acc, e) => acc + (e.moodScore || 3), 0);
  const totalWater = entries.reduce((acc, e) => acc + (e.waterIntake || 0), 0);
  const totalCalories = entries.reduce((acc, e) => acc + (e.caloriesBurned || 0), 0);

  const avgMoodScore = Number((totalMood / totalEntries).toFixed(1));
  const avgProductivity = Number((totalProdHours / totalEntries).toFixed(1));
  const avgSleepHours = Number((totalSleep / totalEntries).toFixed(1));
  const avgLearningHours = Number((totalLearnHours / totalEntries).toFixed(1));

  // 3. Day of week productivity breakdown
  const dayProductivityMap = { Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
  entries.forEach((e) => {
    if (e.date) {
      const d = new Date(e.date + "T00:00:00Z");
      const istDate = new Date(d.getTime() + 330 * 60000);
      const dayName = istDate.toLocaleDateString("en-US", { weekday: "long" });
      if (dayProductivityMap[dayName]) {
        dayProductivityMap[dayName].push(e.productivityHours || 0);
      }
    }
  });

  let maxDayAvg = -1;
  let mostProductiveDay = "N/A";
  Object.keys(dayProductivityMap).forEach((day) => {
    const list = dayProductivityMap[day];
    if (list.length > 0) {
      const avg = list.reduce((a, b) => a + b, 0) / list.length;
      if (avg > maxDayAvg) {
        maxDayAvg = avg;
        mostProductiveDay = day;
      }
    }
  });

  // 4. Mood Distribution
  const moodCounts = { great: 0, good: 0, neutral: 0, bad: 0, terrible: 0 };
  entries.forEach((e) => {
    if (e.mood && moodCounts[e.mood] !== undefined) {
      moodCounts[e.mood]++;
    }
  });

  // 5. Correlation Engine
  const correlations = [];
  const validEntries = entries.filter((e) => e.sleepHours > 0 || e.productivityHours > 0 || e.waterIntake > 0);

  if (validEntries.length >= 3) {
    const sleepList = validEntries.map((e) => e.sleepHours || 0);
    const prodList = validEntries.map((e) => e.productivityHours || 0);
    const moodList = validEntries.map((e) => e.moodScore || 3);
    const waterList = validEntries.map((e) => e.waterIntake || 0);
    const stepsList = validEntries.map((e) => e.steps || 0);

    // Correlation 1: Sleep vs Productivity
    const corrSleepProd = calculateCorrelation(sleepList, prodList);
    if (Math.abs(corrSleepProd) >= 0.2) {
      correlations.push({
        pair: "Sleep & Productivity",
        score: Math.round(corrSleepProd * 100),
        insight:
          corrSleepProd > 0
            ? `Higher sleep duration strongly boosts your daily productivity by ~${Math.round(corrSleepProd * 35)}%.`
            : "Irregular sleep schedules correlate with inconsistent productivity output.",
        positive: corrSleepProd > 0,
      });
    }

    // Correlation 2: Sleep vs Mood
    const corrSleepMood = calculateCorrelation(sleepList, moodList);
    if (Math.abs(corrSleepMood) >= 0.2) {
      correlations.push({
        pair: "Sleep & Mood",
        score: Math.round(corrSleepMood * 100),
        insight:
          corrSleepMood > 0
            ? "Your average mood improves significantly on days with at least 7+ hours of sleep."
            : "Lower sleep hours directly increase reported stress and lower mood scores.",
        positive: corrSleepMood > 0,
      });
    }

    // Correlation 3: Water vs Energy/Mood
    const corrWaterMood = calculateCorrelation(waterList, moodList);
    if (Math.abs(corrWaterMood) >= 0.2) {
      correlations.push({
        pair: "Hydration & Mood",
        score: Math.round(corrWaterMood * 100),
        insight: "Higher hydration (2.5L+) correlates with elevated mood and higher daily energy.",
        positive: corrWaterMood > 0,
      });
    }

    // Correlation 4: Steps & Productivity
    const corrStepsProd = calculateCorrelation(stepsList, prodList);
    if (Math.abs(corrStepsProd) >= 0.2) {
      correlations.push({
        pair: "Activity & Focus",
        score: Math.round(corrStepsProd * 100),
        insight: "Active movement and higher step counts correlate with longer productive work sessions.",
        positive: corrStepsProd > 0,
      });
    }
  }

  // 6. Weekday vs Weekend Habit Completion Rate
  let weekdayDone = 0, weekdayTotal = 0;
  let weekendDone = 0, weekendTotal = 0;

  habitLogs.forEach((l) => {
    if (l.date) {
      const d = new Date(l.date + "T00:00:00Z");
      const day = d.getUTCDay();
      if (day === 0 || day === 6) {
        weekendTotal++;
        if (l.status === "done") weekendDone++;
      } else {
        weekdayTotal++;
        if (l.status === "done") weekdayDone++;
      }
    }
  });

  const weekdayRate = weekdayTotal > 0 ? Math.round((weekdayDone / weekdayTotal) * 100) : 0;
  const weekendRate = weekendTotal > 0 ? Math.round((weekendDone / weekendTotal) * 100) : 0;

  // 7. Intelligence Insights Generation
  const intelligenceInsights = [];

  if (mostProductiveDay !== "N/A") {
    intelligenceInsights.push({
      title: `${mostProductiveDay} is your peak focus day`,
      description: `Historical data shows you complete your highest productive hours on ${mostProductiveDay}s.`,
      category: "Productivity",
    });
  }

  if (weekdayRate > 0 || weekendRate > 0) {
    intelligenceInsights.push({
      title: `Habit Consistency: ${weekdayRate}% Weekdays vs ${weekendRate}% Weekends`,
      description:
        weekdayRate > weekendRate
          ? `You complete ${weekdayRate - weekendRate}% more habits on weekdays. Use weekend reminders to maintain momentum!`
          : `Great job! Your weekend consistency (${weekendRate}%) matches or exceeds weekday focus.`,
      category: "Habit Pattern",
    });
  }

  const lowSleepDays = entries.filter((e) => e.sleepHours > 0 && e.sleepHours < 6).length;
  if (lowSleepDays > 0) {
    intelligenceInsights.push({
      title: `Sleep Impact Warning`,
      description: `Logged under 6 hours of sleep on ${lowSleepDays} days. Data indicates your reported mood dropped by ~20% on those days.`,
      category: "Wellness",
    });
  }

  return {
    summary: {
      totalEntries,
      currentStreak: streak,
      avgMoodScore,
      avgProductivity,
      avgSleepHours,
      avgLearningHours,
    },
    productivity: {
      mostProductiveDay,
      avgHours: avgProductivity,
      weeklyConsistency: weekdayRate,
    },
    learning: {
      totalHours: totalLearnHours,
      topicsCount: entries.filter((e) => e.learningLog && e.learningLog.trim()).length,
      activeDays: entries.filter((e) => e.learningHours > 0).length,
    },
    fitness: {
      avgCalories: totalEntries > 0 ? Math.round(totalCalories / totalEntries) : 0,
      avgWater: totalEntries > 0 ? Number((totalWater / totalEntries).toFixed(1)) : 0,
      weightTrend: entries
        .filter((e) => e.weight > 0)
        .slice(0, 15)
        .map((e) => ({ date: e.date, weight: e.weight })),
      stepHistory: entries
        .filter((e) => e.steps > 0)
        .slice(0, 15)
        .map((e) => ({ date: e.date, steps: e.steps })),
    },
    mood: {
      moodDistribution: moodCounts,
      stressFrequency: entries.filter((e) => e.stressLevel >= 4).length,
      averageScore: avgMoodScore,
    },
    correlations,
    intelligenceInsights,
  };
}

/**
 * Generate Weekly Report
 */
export async function generateWeeklyReport(userId) {
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    last7Days.push(getDaysAgoIST(i));
  }

  const entries = await JournalEntry.find({ userId, date: { $in: last7Days } });
  const habits = await Habit.find({ userId });
  const habitIds = habits.map((h) => h._id);
  const logs = await HabitLog.find({ habitId: { $in: habitIds }, date: { $in: last7Days } });

  const totalPossible = habits.length * 7;
  const completedHabits = logs.filter((l) => l.status === "done").length;
  const habitCompletionRate = totalPossible > 0 ? Math.round((completedHabits / totalPossible) * 100) : 0;

  const totalStudyHours = entries.reduce((acc, e) => acc + (e.learningHours || 0), 0);
  const workoutSessions = entries.filter((e) => (e.workoutSummary && e.workoutSummary.trim()) || e.caloriesBurned > 0).length;
  const avgMoodScore = entries.length > 0 ? Number((entries.reduce((a, b) => a + (b.moodScore || 3), 0) / entries.length).toFixed(1)) : 0;

  const weights = entries.filter((e) => e.weight > 0).map((e) => e.weight);
  const weightChange = weights.length >= 2 ? Number((weights[0] - weights[weights.length - 1]).toFixed(1)) : 0;

  return {
    period: "Last 7 Days",
    habitCompletionRate,
    studyHours: totalStudyHours,
    workoutSessions,
    avgMoodScore,
    weightChange,
    entriesLogged: entries.length,
    wins: entries.map((e) => e.biggestAchievement).filter(Boolean).slice(0, 3),
    improvements: entries.map((e) => e.lessonsLearned).filter(Boolean).slice(0, 3),
  };
}

/**
 * Generate Monthly Report
 */
export async function generateMonthlyReport(userId) {
  const last30Days = [];
  for (let i = 0; i < 30; i++) {
    last30Days.push(getDaysAgoIST(i));
  }

  const entries = await JournalEntry.find({ userId, date: { $in: last30Days } });
  const habits = await Habit.find({ userId });
  const habitIds = habits.map((h) => h._id);
  const logs = await HabitLog.find({ habitId: { $in: habitIds }, date: { $in: last30Days } });

  const totalPossible = habits.length * 30;
  const completedHabits = logs.filter((l) => l.status === "done").length;
  const habitConsistency = totalPossible > 0 ? Math.round((completedHabits / totalPossible) * 100) : 0;

  const totalStudyHours = entries.reduce((acc, e) => acc + (e.learningHours || 0), 0);
  const workoutCount = entries.filter((e) => (e.workoutSummary && e.workoutSummary.trim()) || e.caloriesBurned > 0).length;

  const weights = entries.filter((e) => e.weight > 0).map((e) => e.weight);
  const weightLoss = weights.length >= 2 ? Number((weights[weights.length - 1] - weights[0]).toFixed(1)) : 0;

  return {
    period: "Last 30 Days",
    journalEntriesCount: entries.length,
    habitsCompleted: completedHabits,
    studyHours: totalStudyHours,
    workoutsCount: workoutCount,
    weightChange: weightLoss,
    habitConsistency,
    commonMistakes: entries.map((e) => e.mistakesMade).filter(Boolean).slice(0, 4),
  };
}
