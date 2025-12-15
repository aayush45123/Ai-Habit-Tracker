import Challenge from "../models/Challenge.js";
import ChallengeLog from "../models/ChallengeLog.js";

/* -----------------------------------------------------
   Convert "06:00 AM" → "06:00" (24-hour)
----------------------------------------------------- */
function convertTo24FromString(fullTime) {
  if (!fullTime) return "";
  let [time, period] = fullTime.split(" ");
  let [hour, minute] = time.split(":").map(Number);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/* -----------------------------------------------------
   START 21-DAY CHALLENGE
----------------------------------------------------- */
export const startChallenge = async (req, res) => {
  try {
    let { habits } = req.body;
    if (!habits || habits.length < 6)
      return res
        .status(400)
        .json({ message: "Please enter at least 6 habits." });

    const formattedHabits = habits.map((h) => ({
      title: h.title,
      startTime: convertTo24FromString(h.startTime),
      endTime: convertTo24FromString(h.endTime),
    }));

    const challenge = await Challenge.create({
      userId: req.user,
      habits: formattedHabits,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0],
      isActive: true,
    });

    res.json({ message: "Challenge started", challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   UPDATE CHALLENGE
----------------------------------------------------- */
export const updateChallenge = async (req, res) => {
  try {
    const { habits } = req.body;
    const challengeId = req.params.id;

    if (!habits || habits.length < 6)
      return res
        .status(400)
        .json({ message: "Please enter at least 6 habits." });

    const formattedHabits = habits.map((h) => ({
      title: h.title,
      startTime: convertTo24FromString(h.startTime),
      endTime: convertTo24FromString(h.endTime),
    }));

    const updated = await Challenge.findByIdAndUpdate(
      challengeId,
      { habits: formattedHabits },
      { new: true }
    );

    res.json({ message: "Challenge updated", challenge: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   GET CURRENT ACTIVE CHALLENGE - WITH DEBUG INFO
----------------------------------------------------- */
export const getCurrentChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      userId: req.user,
      isActive: true,
    });

    if (!challenge)
      return res.json({ active: false, message: "No active challenge" });

    // Use client-provided local time to avoid timezone mismatches
    const clientHour = req.query.hour ? Number(req.query.hour) : null;
    const clientMinute = req.query.minute ? Number(req.query.minute) : null;
    const clientToday = req.query.today || null; // expected "YYYY-MM-DD"

    const now = new Date();
    const todayISO = clientToday || now.toISOString().split("T")[0];

    const logs = await ChallengeLog.find({ challengeId: challenge._id });

    const TOTAL_DAYS = 21;
    const days = [];

    // Debug info
    console.log("=== DEBUG INFO ===");
    console.log("Current time:", now.toISOString());
    console.log("Current time (local):", now.toString());
    console.log("Client Today ISO (if provided):", clientToday);
    console.log("Today ISO used:", todayISO);
    console.log("Server timezone offset:", now.getTimezoneOffset(), "minutes");

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const dateObj = new Date(challenge.startDate);
      dateObj.setDate(dateObj.getDate() + i);
      const iso = dateObj.toISOString().split("T")[0];

      const statuses = challenge.habits.map((habit, index) => {
        const log = logs.find((l) => l.date === iso && l.habitIndex === index);

        // Current time components
        const currentHour = clientHour ?? now.getHours();
        const currentMinute = clientMinute ?? now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Parse habit times
        const [startHour, startMin] = habit.startTime.split(":").map(Number);
        const [endHour, endMin] = habit.endTime.split(":").map(Number);
        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;

        // Debug for today's habits
        if (iso === todayISO && index === 0) {
          console.log(`\nHabit: ${habit.title}`);
          console.log(`Stored times: ${habit.startTime} - ${habit.endTime}`);
          console.log(
            `Start: ${startHour}:${startMin} (${startTimeInMinutes} mins)`
          );
          console.log(`End: ${endHour}:${endMin} (${endTimeInMinutes} mins)`);
          console.log(
            `Current: ${currentHour}:${currentMinute} (${currentTimeInMinutes} mins)`
          );
        }

        if (iso < todayISO) return log ? "done" : "expired";

        if (iso === todayISO) {
          if (log) return "done";
          if (currentTimeInMinutes < startTimeInMinutes) return "pending";
          if (
            currentTimeInMinutes >= startTimeInMinutes &&
            currentTimeInMinutes <= endTimeInMinutes
          )
            return "ongoing";
          return "expired";
        }

        return "future";
      });

      days.push({ date: iso, statuses });
    }

    console.log("=== END DEBUG ===\n");

    res.json({
      active: true,
      challenge,
      days,
      debug: {
        currentTime: now.toISOString(),
        currentTimeLocal: now.toString(),
        todayISO,
        clientToday,
        clientHour,
        clientMinute,
        serverTimezoneOffset: now.getTimezoneOffset(),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   GET HEATMAP DATA
----------------------------------------------------- */
export const getChallengeHeatmap = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      userId: req.user,
      isActive: true,
    });

    if (!challenge) return res.json({ heatmap: [], stats: null });

    const logs = await ChallengeLog.find({ challengeId: challenge._id });
    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];
    const TOTAL_DAYS = 21;
    const heatmap = [];

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const dateObj = new Date(challenge.startDate);
      dateObj.setDate(dateObj.getDate() + i);
      const iso = dateObj.toISOString().split("T")[0];

      // Count completed habits for this day
      const completedCount = challenge.habits.filter((habit, index) => {
        return logs.some((l) => l.date === iso && l.habitIndex === index);
      }).length;

      const totalHabits = challenge.habits.length;
      const completionRate =
        totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

      // Determine intensity level (0-4 like GitHub)
      let level = 0;
      if (iso > todayISO) {
        level = -1; // future day
      } else if (completionRate === 0) {
        level = 0; // no activity
      } else if (completionRate < 40) {
        level = 1; // low activity
      } else if (completionRate < 70) {
        level = 2; // medium activity
      } else if (completionRate < 100) {
        level = 3; // high activity
      } else {
        level = 4; // perfect day
      }

      heatmap.push({
        date: iso,
        level,
        count: completedCount,
        total: totalHabits,
        percentage: Math.round(completionRate),
      });
    }

    // Calculate overall stats
    const completedDays = heatmap.filter(
      (d) => d.level === 4 && d.date <= todayISO
    ).length;
    const activeDays = heatmap.filter(
      (d) => d.level > 0 && d.date <= todayISO
    ).length;
    const totalPossibleHabits =
      heatmap.filter((d) => d.date <= todayISO).length *
      challenge.habits.length;
    const totalCompleted = logs.length;
    const overallCompletion =
      totalPossibleHabits > 0
        ? Math.round((totalCompleted / totalPossibleHabits) * 100)
        : 0;

    // Current streak calculation
    let currentStreak = 0;
    const reversedHeatmap = [...heatmap].reverse();
    for (const day of reversedHeatmap) {
      if (day.date > todayISO) continue;
      if (day.level === 4) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak calculation
    let longestStreak = 0;
    let tempStreak = 0;
    for (const day of heatmap) {
      if (day.date > todayISO) continue;
      if (day.level === 4) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const stats = {
      completedDays,
      activeDays,
      currentStreak,
      longestStreak,
      overallCompletion,
      totalCompleted,
      totalPossibleHabits,
    };

    res.json({ heatmap, stats, challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   MARK HABIT DONE - FIXED
----------------------------------------------------- */
export const markHabitDone = async (req, res) => {
  try {
    const { id, index } = req.params;
    const habitIndex = Number(index);
    const challenge = await Challenge.findById(id);
    if (!challenge)
      return res.status(404).json({ message: "Challenge not found" });

    // Use client-provided local time to avoid timezone mismatches
    const clientHour = req.query.hour ? Number(req.query.hour) : null;
    const clientMinute = req.query.minute ? Number(req.query.minute) : null;
    const clientToday = req.query.today || null; // expected "YYYY-MM-DD"

    const now = new Date();
    const todayISO = clientToday || now.toISOString().split("T")[0];

    const habit = challenge.habits[habitIndex];

    // Current time in minutes
    const currentHour = clientHour ?? now.getHours();
    const currentMinute = clientMinute ?? now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Parse habit times
    const [startHour, startMin] = habit.startTime.split(":").map(Number);
    const [endHour, endMin] = habit.endTime.split(":").map(Number);
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    if (currentTimeInMinutes < startTimeInMinutes)
      return res.status(400).json({ message: "Too early to mark done." });
    if (currentTimeInMinutes > endTimeInMinutes)
      return res.status(400).json({ message: "Time window expired." });

    await ChallengeLog.findOneAndUpdate(
      { challengeId: id, habitIndex: habitIndex, date: todayISO },
      { status: "done" },
      { upsert: true }
    );

    res.json({ message: "Habit marked done!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
