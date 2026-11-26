import AIChat from "../models/aiChat.js";
import CalorieProfile from "../models/CalorieProfile.js";
import FoodLog from "../models/FoodLog.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import JournalEntry from "../models/JournalEntry.js";
import ScheduleEvent from "../models/ScheduleEvent.js";
import WorkoutLog from "../models/WorkoutLog.js";
import { getDaysAgoIST, getTodayIST, normalizeDateIST } from "../utils/getTodayIST.js";
import { completeWithGroq } from "../utils/aiClient.js";

/* ---------------------------
   GET CHAT HISTORY
---------------------------- */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await AIChat.find({ userId })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ history });
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

/* ---------------------------
   SEND MESSAGE
---------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    // Save user message
    await AIChat.create({
      userId,
      role: "user",
      message,
    });

    const today = getTodayIST();
    const startDate = getDaysAgoIST(30);
    const futureDate = new Date(`${today}T00:00:00.000Z`);
    futureDate.setUTCDate(futureDate.getUTCDate() + 7);
    const recentLogsStart = getDaysAgoIST(7);
    const [profile, habits] = await Promise.all([
      CalorieProfile.findOne({ userId }).lean(),
      Habit.find({
        userId,
        isArchived: { $ne: true },
        isDeleted: { $ne: true },
      })
        .select("title category frequency streak longestStreak")
        .limit(40)
        .lean(),
    ]);
    const [habitLogs, foodLogs, journalEntries, scheduleEvents, workoutLogs] =
      await Promise.all([
        HabitLog.find({
          habitId: { $in: habits.map((habit) => habit._id) },
          date: { $gte: new Date(`${startDate}T00:00:00.000Z`) },
        })
          .select("habitId habitTitle status date")
          .sort({ date: -1 })
          .limit(500)
          .lean(),
        FoodLog.find({ userId, date: { $gte: startDate } })
          .select("calories date")
          .sort({ date: -1 })
          .limit(200)
          .lean(),
        JournalEntry.find({ userId, date: { $gte: getDaysAgoIST(14) } })
          .select("date moodScore energyLevel stressLevel sleepHours productivityHours")
          .sort({ date: -1 })
          .limit(14)
          .lean(),
        ScheduleEvent.find({
          userId,
          date: { $gte: today, $lte: futureDate.toISOString().slice(0, 10) },
          status: { $ne: "cancelled" },
        })
          .select("title date startTime category status")
          .sort({ date: 1, startTime: 1 })
          .limit(20)
          .lean(),
        WorkoutLog.find({ userId, date: { $gte: startDate } })
          .select("date focusArea status completionPercentage actualDuration")
          .sort({ date: -1 })
          .limit(30)
          .lean(),
      ]);

    const habitStats = habits.map((habit) => {
      const logs = habitLogs.filter(
        (log) => String(log.habitId) === String(habit._id),
      );
      const done = logs.filter((log) => log.status === "done").length;
      const recentLogs = logs.filter(
        (log) => normalizeDateIST(log.date) >= recentLogsStart,
      );
      const recentDone = recentLogs.filter((log) => log.status === "done").length;
      return {
        habit: habit.title,
        category: habit.category || "General",
        currentStreak: habit.streak || 0,
        longestStreak: habit.longestStreak || 0,
        completionRate30d: logs.length ? Math.round((done / logs.length) * 100) : null,
        completionRate7d: recentLogs.length
          ? Math.round((recentDone / recentLogs.length) * 100)
          : null,
      };
    });

    const foodByDate = foodLogs.reduce((daily, log) => {
      daily[log.date] = (daily[log.date] || 0) + (Number(log.calories) || 0);
      return daily;
    }, {});
    const trackedCalorieDays = Object.values(foodByDate);
    const average = (entries, key) => {
      const values = entries
        .map((entry) => Number(entry[key]))
        .filter(Number.isFinite);
      return values.length
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
        : null;
    };
    const completedByWeekday = habitLogs.reduce((counts, log) => {
      if (log.status !== "done") return counts;
      const weekday = new Date(`${normalizeDateIST(log.date)}T00:00:00Z`).toLocaleDateString(
        "en-US",
        { weekday: "long", timeZone: "UTC" },
      );
      counts[weekday] = (counts[weekday] || 0) + 1;
      return counts;
    }, {});
    const bestHabitDay = Object.entries(completedByWeekday).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0];
    const completedHabitLogs = habitLogs.filter((log) => log.status === "done").length;
    const workoutCompletionRate = average(workoutLogs, "completionPercentage");

    const userContext = {
      name: req.user.name || null,
      profile: profile
        ? {
            age: profile.age || null,
            heightCm: profile.height || null,
            weightKg: profile.weight || null,
            gender: profile.gender || null,
            activityLevel: profile.activityLevel || null,
            fitnessGoal: profile.goal || null,
            dailyCalorieGoal: profile.dailyGoal || null,
          }
        : null,
      habits: {
        activeCount: habits.length,
        trackedLogs30d: habitLogs.length,
        completionRate30d: habitLogs.length
          ? Math.round((completedHabitLogs / habitLogs.length) * 100)
          : null,
        bestCompletionWeekday: bestHabitDay || null,
        details: habitStats.slice(0, 20),
      },
      nutrition: {
        trackedFoodEntries30d: foodLogs.length,
        averageCaloriesPerLoggedDay: trackedCalorieDays.length
          ? Math.round(
              trackedCalorieDays.reduce((sum, value) => sum + value, 0) /
                trackedCalorieDays.length,
            )
          : null,
        dailyCalorieGoal: profile?.dailyGoal || null,
      },
      journal: {
        entries14d: journalEntries.length,
        averageMoodScore: average(journalEntries, "moodScore"),
        averageEnergyLevel: average(journalEntries, "energyLevel"),
        averageStressLevel: average(journalEntries, "stressLevel"),
        averageSleepHours: average(journalEntries, "sleepHours"),
        averageProductivityHours: average(journalEntries, "productivityHours"),
      },
      workouts: {
        sessionsLogged30d: workoutLogs.length,
        averageCompletionPercent: workoutCompletionRate,
        completedSessions30d: workoutLogs.filter((log) => log.status === "completed").length,
      },
      schedule: {
        upcomingEvents7d: scheduleEvents.length,
        upcoming: scheduleEvents.slice(0, 8).map((event) => ({
          title: event.title,
          date: event.date,
          time: event.startTime,
          category: event.category,
          status: event.status,
        })),
      },
      contextPeriod: { from: startDate, through: today },
    };

    // Get last 10 messages for context
    const history = await AIChat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const messages = history
      .reverse()
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.message || "").slice(0, 2000),
      }));

    let reply = "";
    try {
      const { content } = await completeWithGroq({
        messages: [
          {
            role: "system",
            content:
              "You are an encouraging, practical personal habit coach. Use the user's supplied profile, habits, nutrition, journal metrics, workouts, schedule, and prior conversation to make advice specific and useful. Refer to observed patterns or numbers when relevant, never invent missing information, and do not repeat sensitive measurements unless needed for the question. If a data area is empty, do not assume anything about it. Keep answers concise, actionable, and motivating.\n\nCurrent user context (JSON):\n" +
              JSON.stringify(userContext),
          },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 600,
      });
      reply = content;
    } catch (groqErr) {
      console.warn("Groq chat error, using fallback coach response:", groqErr.message);
      const strongestHabit = [...habitStats]
        .filter((habit) => habit.completionRate30d !== null)
        .sort((a, b) => b.completionRate30d - a.completionRate30d)[0];
      reply = strongestHabit
        ? `I'm temporarily offline, but I can still see "${strongestHabit.habit}" is your strongest recent habit at ${strongestHabit.completionRate30d}% completion over the last 30 days. Keep building on that momentum and try one small step toward your next goal today.`
        : "I'm temporarily offline, and there isn't enough recent tracking data to personalize this reply yet. Log a few habits and check in again; I'll use that progress to tailor my coaching.";
    }

    // Save AI reply
    const aiMsg = await AIChat.create({
      userId,
      role: "assistant",
      message: reply,
    });

    res.json({ reply: aiMsg });
  } catch (err) {
    console.error("AI CHAT ERROR:", err);
    res.status(500).json({
      message: "AI chat error",
      error: err.message,
    });
  }
};
