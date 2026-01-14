// server/src/controllers/challengeController.js (FIXED - MIDNIGHT SPANNING)
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
   ✅ NEW: Check if current time is within habit window
   Handles midnight-spanning times (e.g., 20:00 - 08:00)
----------------------------------------------------- */
function isTimeInWindow(currentMinutes, startMinutes, endMinutes) {
  // Normal case: start < end (e.g., 06:00 - 10:00)
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Midnight-spanning case: start > end (e.g., 20:00 - 08:00)
  // This means the window spans across midnight
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

/* -----------------------------------------------------
   ✅ NEW: Check if time window has expired
   Handles midnight-spanning times
----------------------------------------------------- */
function isTimeExpired(currentMinutes, endMinutes, startMinutes) {
  // Normal case: start < end
  if (startMinutes < endMinutes) {
    return currentMinutes > endMinutes;
  }

  // Midnight-spanning case: start > end
  // Time is expired only if it's between end and start
  return currentMinutes > endMinutes && currentMinutes < startMinutes;
}

/* -----------------------------------------------------
   START 21-DAY CHALLENGE
----------------------------------------------------- */
export const startChallenge = async (req, res) => {
  try {
    let { habits } = req.body;

    if (!habits || habits.length < 6) {
      return res.status(400).json({
        message: "Please enter at least 6 habits to start the challenge.",
      });
    }

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

    res.json({ message: "Challenge started successfully!", challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   RESTART CHALLENGE
----------------------------------------------------- */
export const restartChallenge = async (req, res) => {
  try {
    const { habits } = req.body;

    if (!habits || habits.length < 6) {
      return res.status(400).json({
        message: "Please enter at least 6 habits to restart the challenge.",
      });
    }

    const currentChallenge = await Challenge.findOne({
      userId: req.user,
      isActive: true,
    });

    if (currentChallenge) {
      currentChallenge.isActive = false;
      await currentChallenge.save();
    }

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

    const newChallenge = await Challenge.create({
      userId: req.user,
      habits: formattedHabits,
      startDate: todayISO,
      endDate: endDateISO,
      isActive: true,
    });

    res.json({
      message: "Challenge restarted successfully!",
      challenge: newChallenge,
      previousChallengeId: currentChallenge?._id,
    });
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

    if (!habits || habits.length < 6) {
      return res.status(400).json({
        message: "Please maintain at least 6 habits in your challenge.",
      });
    }

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

    res.json({
      message: "Challenge updated successfully!",
      challenge: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   GET CURRENT ACTIVE CHALLENGE
   ✅ FIXED: Proper handling of midnight-spanning times
----------------------------------------------------- */
export const getCurrentChallenge = async (req, res) => {
  try {
    const todayISO = getTodayIST();

    let challenge = await Challenge.findOne({
      userId: req.user,
      isActive: true,
    });

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

        const [startHour, startMin] = habit.startTime.split(":").map(Number);
        const [endHour, endMin] = habit.endTime.split(":").map(Number);
        const startTimeInMinutes = startHour * 60 + startMin;
        const endTimeInMinutes = endHour * 60 + endMin;

        // ✅ Past days
        if (iso < todayISO) {
          return log ? "done" : "expired";
        }

        // ✅ Today - check time windows with midnight support
        if (iso === todayISO) {
          if (log) return "done";

          // Check if we're before the start time
          if (startTimeInMinutes < endTimeInMinutes) {
            // Normal time window (doesn't cross midnight)
            if (currentTimeInMinutes < startTimeInMinutes) return "pending";
            if (currentTimeInMinutes > endTimeInMinutes) return "expired";
            return "ongoing";
          } else {
            // Midnight-spanning time window (e.g., 20:00 - 08:00)
            if (
              isTimeInWindow(
                currentTimeInMinutes,
                startTimeInMinutes,
                endTimeInMinutes
              )
            ) {
              return "ongoing";
            }
            if (
              isTimeExpired(
                currentTimeInMinutes,
                endTimeInMinutes,
                startTimeInMinutes
              )
            ) {
              return "expired";
            }
            return "pending";
          }
        }

        // ✅ Future days
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
    console.error("Error in getCurrentChallenge:", err);
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
----------------------------------------------------- */
export const getChallengeHeatmap = async (req, res) => {
  try {
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

      const completedCount = challenge.habits.filter((habit, index) => {
        return logs.some((l) => l.date === iso && l.habitIndex === index);
      }).length;

      const totalHabits = challenge.habits.length;
      const completionRate =
        totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

      let level = 0;
      const isFuture = challenge.isActive && iso > todayISO;

      if (isFuture) {
        level = -1;
      } else if (completionRate === 0) {
        level = 0;
      } else if (completionRate < 40) {
        level = 1;
      } else if (completionRate < 70) {
        level = 2;
      } else if (completionRate < 100) {
        level = 3;
      } else {
        level = 4;
      }

      heatmap.push({
        date: iso,
        level,
        count: completedCount,
        total: totalHabits,
        percentage: Math.round(completionRate),
      });
    }

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
   ✅ FIXED: Proper handling of midnight-spanning times
----------------------------------------------------- */
export const markHabitDone = async (req, res) => {
  try {
    const { id, index } = req.params;
    const habitIndex = Number(index);
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const todayISO = getTodayIST();

    if (challenge.endDate < todayISO) {
      return res.status(400).json({
        message: "Challenge has ended. Start a new one!",
        challengeEnded: true,
      });
    }

    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const currentHour = istNow.getUTCHours();
    const currentMinute = istNow.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const habit = challenge.habits[habitIndex];
    const [startHour, startMin] = habit.startTime.split(":").map(Number);
    const [endHour, endMin] = habit.endTime.split(":").map(Number);
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    // ✅ Check if we're in the valid time window (with midnight support)
    if (
      !isTimeInWindow(
        currentTimeInMinutes,
        startTimeInMinutes,
        endTimeInMinutes
      )
    ) {
      if (
        currentTimeInMinutes < startTimeInMinutes &&
        startTimeInMinutes < endTimeInMinutes
      ) {
        return res.status(400).json({ message: "Too early to mark done." });
      }
      if (
        isTimeExpired(
          currentTimeInMinutes,
          endTimeInMinutes,
          startTimeInMinutes
        )
      ) {
        return res.status(400).json({ message: "Time window expired." });
      }
      return res.status(400).json({ message: "Not in valid time window." });
    }

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
   GET CHALLENGE HISTORY
----------------------------------------------------- */
export const getChallengeHistory = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .limit(20);

    const history = await Promise.all(
      challenges.map(async (challenge) => {
        const logs = await ChallengeLog.find({ challengeId: challenge._id });
        const totalPossible = challenge.habits.length * 21;
        const completed = logs.length;
        const completionRate =
          totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

        const todayISO = getTodayIST();
        const startDate = new Date(challenge.startDate);
        const endDate = new Date(challenge.endDate);
        const today = new Date(todayISO);

        let daysElapsed = 0;
        if (challenge.isActive) {
          const diff = today.getTime() - startDate.getTime();
          daysElapsed = Math.min(
            Math.floor(diff / (1000 * 60 * 60 * 24)) + 1,
            21
          );
        } else {
          daysElapsed = 21;
        }

        return {
          _id: challenge._id,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          isActive: challenge.isActive,
          completionRate,
          totalCompleted: completed,
          totalPossible,
          habitCount: challenge.habits.length,
          daysElapsed,
          createdAt: challenge.createdAt,
        };
      })
    );

    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* -----------------------------------------------------
   DELETE CHALLENGE
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

    if (challenge.isActive) {
      return res.status(400).json({
        message:
          "Cannot delete active challenge. Please restart or complete it first.",
      });
    }

    await ChallengeLog.deleteMany({ challengeId: id });
    await Challenge.findByIdAndDelete(id);

    res.json({ message: "Challenge deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
