// server/src/controllers/challengeController.js (FIXED)
import Challenge from "../models/Challenge.js";
import ChallengeLog from "../models/ChallengeLog.js";
import { getTodayIST, normalizeDateIST } from "../utils/getTodayIST.js";

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
   ✅ FIXED: Deactivates old challenges before starting new one
----------------------------------------------------- */
export const startChallenge = async (req, res) => {
  try {
    let { habits } = req.body;
    if (!habits || habits.length < 6)
      return res
        .status(400)
        .json({ message: "Please enter at least 6 habits." });

    // ✅ Deactivate any existing active challenges
    await Challenge.updateMany(
      { userId: req.user, isActive: true },
      { isActive: false }
    );

    const formattedHabits = habits.map((h) => ({
      title: h.title,
      startTime: convertTo24FromString(h.startTime),
      endTime: convertTo24FromString(h.endTime),
    }));

    const todayISO = getTodayIST();

    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const endDate = new Date(istNow);
    endDate.setDate(istNow.getDate() + 20);
    const endDateISO = endDate.toISOString().split("T")[0];

    const challenge = await Challenge.create({
      userId: req.user,
      habits: formattedHabits,
      startDate: todayISO,
      endDate: endDateISO,
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
   GET CURRENT ACTIVE CHALLENGE
   ✅ FIXED: Auto-deactivates expired challenges
----------------------------------------------------- */
export const getCurrentChallenge = async (req, res) => {
  try {
    const todayISO = getTodayIST();

    // ✅ Find active challenge
    let challenge = await Challenge.findOne({
      userId: req.user,
      isActive: true,
    });

    // ✅ If challenge exists and has expired, deactivate it
    if (challenge && challenge.endDate < todayISO) {
      challenge.isActive = false;
      await challenge.save();

      return res.json({
        active: false,
        message: "Challenge completed! Start a new one.",
        completed: true,
        stats: await getChallengeStats(challenge._id, todayISO),
      });
    }

    if (!challenge) {
      return res.json({ active: false, message: "No active challenge" });
    }

    // Get IST time components
    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const currentHour = istNow.getUTCHours();
    const currentMinute = istNow.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const logs = await ChallengeLog.find({ challengeId: challenge._id });

    const TOTAL_DAYS = 21;
    const days = [];

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const dateObj = new Date(challenge.startDate + "T00:00:00Z");
      const istDate = new Date(dateObj.getTime() + 330 * 60000);
      istDate.setDate(istDate.getDate() + i);
      const iso = istDate.toISOString().split("T")[0];

      const statuses = challenge.habits.map((habit, index) => {
        const log = logs.find((l) => l.date === iso && l.habitIndex === index);

        // Parse habit times
        const [startHour, startMin] = habit.startTime.split(":").map(Number);
        const [endHour, endMin] = habit.endTime.split(":").map(Number);
        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;

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

    res.json({
      active: true,
      challenge,
      days,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   GET CHALLENGE STATS (HELPER)
----------------------------------------------------- */
async function getChallengeStats(challengeId, todayISO) {
  try {
    const challenge = await Challenge.findById(challengeId);
    const logs = await ChallengeLog.find({ challengeId });

    const totalHabits = challenge.habits.length * 21;
    const completedHabits = logs.length;
    const completionRate = Math.round((completedHabits / totalHabits) * 100);

    // Count perfect days
    const perfectDays = new Set();
    logs.forEach((log) => {
      const dayLogs = logs.filter((l) => l.date === log.date);
      if (dayLogs.length === challenge.habits.length) {
        perfectDays.add(log.date);
      }
    });

    return {
      totalHabits,
      completedHabits,
      completionRate,
      perfectDays: perfectDays.size,
      daysCompleted: 21,
    };
  } catch (err) {
    return null;
  }
}

/* -----------------------------------------------------
   GET HEATMAP DATA
   ✅ FIXED: Works for completed challenges too
----------------------------------------------------- */
export const getChallengeHeatmap = async (req, res) => {
  try {
    // ✅ Get most recent challenge (active or completed)
    const challenge = await Challenge.findOne({
      userId: req.user,
    }).sort({ createdAt: -1 });

    if (!challenge) return res.json({ heatmap: [], stats: null });

    const logs = await ChallengeLog.find({ challengeId: challenge._id });
    const todayISO = getTodayIST();
    const TOTAL_DAYS = 21;
    const heatmap = [];

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const dateObj = new Date(challenge.startDate + "T00:00:00Z");
      const istDate = new Date(dateObj.getTime() + 330 * 60000);
      istDate.setDate(istDate.getDate() + i);
      const iso = istDate.toISOString().split("T")[0];

      // Count completed habits for this day
      const completedCount = challenge.habits.filter((habit, index) => {
        return logs.some((l) => l.date === iso && l.habitIndex === index);
      }).length;

      const totalHabits = challenge.habits.length;
      const completionRate =
        totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

      // Determine intensity level (0-4 like GitHub)
      let level = 0;
      // ✅ For completed challenges, show all days
      const isFuture = challenge.isActive && iso > todayISO;

      if (isFuture) {
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
      (d) => d.level === 4 && (challenge.isActive ? d.date <= todayISO : true)
    ).length;

    const activeDays = heatmap.filter(
      (d) => d.level > 0 && (challenge.isActive ? d.date <= todayISO : true)
    ).length;

    const relevantDays = challenge.isActive
      ? heatmap.filter((d) => d.date <= todayISO).length
      : 21;

    const totalPossibleHabits = relevantDays * challenge.habits.length;
    const totalCompleted = logs.length;
    const overallCompletion =
      totalPossibleHabits > 0
        ? Math.round((totalCompleted / totalPossibleHabits) * 100)
        : 0;

    // Current streak calculation
    let currentStreak = 0;
    const reversedHeatmap = [...heatmap].reverse();
    for (const day of reversedHeatmap) {
      if (challenge.isActive && day.date > todayISO) continue;
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
      if (challenge.isActive && day.date > todayISO) continue;
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
      isCompleted: !challenge.isActive,
      endDate: challenge.endDate,
    };

    res.json({ heatmap, stats, challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   MARK HABIT DONE
----------------------------------------------------- */
export const markHabitDone = async (req, res) => {
  try {
    const { id, index } = req.params;
    const habitIndex = Number(index);
    const challenge = await Challenge.findById(id);
    if (!challenge)
      return res.status(404).json({ message: "Challenge not found" });

    const todayISO = getTodayIST();

    // ✅ Check if challenge has expired
    if (challenge.endDate < todayISO) {
      return res.status(400).json({
        message: "Challenge has ended. Start a new one!",
        challengeEnded: true,
      });
    }

    // Get IST time components
    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const currentHour = istNow.getUTCHours();
    const currentMinute = istNow.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const habit = challenge.habits[habitIndex];

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

/* -----------------------------------------------------
   ✅ NEW: GET CHALLENGE HISTORY
----------------------------------------------------- */
export const getChallengeHistory = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .limit(10);

    const history = await Promise.all(
      challenges.map(async (challenge) => {
        const logs = await ChallengeLog.find({ challengeId: challenge._id });
        const totalPossible = challenge.habits.length * 21;
        const completed = logs.length;
        const completionRate = Math.round((completed / totalPossible) * 100);

        return {
          _id: challenge._id,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          isActive: challenge.isActive,
          completionRate,
          totalCompleted: completed,
          totalPossible,
          habitCount: challenge.habits.length,
        };
      })
    );

    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   ✅ NEW: DELETE OLD CHALLENGE (for cleanup)
----------------------------------------------------- */
export const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findOne({
      _id: id,
      userId: req.user,
    });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Delete challenge and all its logs
    await ChallengeLog.deleteMany({ challengeId: id });
    await Challenge.findByIdAndDelete(id);

    res.json({ message: "Challenge deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
