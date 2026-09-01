// server/src/controllers/challengeController.js (COMPLETE FIX WITH DEBUGGING)
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
   ✅ FIXED: Determine habit status for today
   Properly handles midnight-spanning time windows
----------------------------------------------------- */
function getHabitStatusForToday(
  currentTimeInMinutes,
  startTimeInMinutes,
  endTimeInMinutes,
  hasLog
) {
  // If already marked done, return "done"
  if (hasLog) return "done";

  const isMidnightSpanning = startTimeInMinutes > endTimeInMinutes;

  if (isMidnightSpanning) {
    // Midnight-spanning window (e.g., 20:00 - 08:00)
    // Valid from startTime until 23:59, then from 00:00 until endTime

    // Currently in the valid window?
    const inWindow =
      currentTimeInMinutes >= startTimeInMinutes || // After start time (20:00+)
      currentTimeInMinutes <= endTimeInMinutes; // Or before end time (before 08:00)

    if (inWindow) {
      return "ongoing"; // Can mark done now
    }

    // Between endTime and startTime = expired window
    // e.g., if it's 10:00 AM and window is 20:00-08:00, it's expired
    if (
      currentTimeInMinutes > endTimeInMinutes &&
      currentTimeInMinutes < startTimeInMinutes
    ) {
      return "expired";
    }

    // This shouldn't happen but just in case
    return "pending";
  } else {
    // Normal window (e.g., 06:00 - 10:30)
    if (currentTimeInMinutes < startTimeInMinutes) {
      return "pending"; // Too early
    }
    if (currentTimeInMinutes > endTimeInMinutes) {
      return "expired"; // Too late
    }
    return "ongoing"; // Can mark done now
  }
}

/* -----------------------------------------------------
   START CHALLENGE
----------------------------------------------------- */
export const startChallenge = async (req, res) => {
  try {
    let { habits, durationDays = 21 } = req.body;

    if (!habits || habits.length < 6) {
      return res.status(400).json({
        message: "Please enter at least 6 habits to start the challenge.",
      });
    }

    const totalDays = Math.max(1, parseInt(durationDays, 10) || 21);

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
    endDate.setDate(istNow.getDate() + (totalDays - 1));
    const endDateISO = endDate.toISOString().split("T")[0];

    const challenge = await Challenge.create({
      userId: req.user,
      habits: formattedHabits,
      startDate: todayISO,
      endDate: endDateISO,
      durationDays: totalDays,
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
    const { habits, durationDays = 21 } = req.body;

    if (!habits || habits.length < 6) {
      return res.status(400).json({
        message: "Please enter at least 6 habits to restart the challenge.",
      });
    }

    const totalDays = Math.max(1, parseInt(durationDays, 10) || 21);

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
    endDate.setDate(istNow.getDate() + (totalDays - 1));
    const endDateISO = endDate.toISOString().split("T")[0];

    const newChallenge = await Challenge.create({
      userId: req.user,
      habits: formattedHabits,
      startDate: todayISO,
      endDate: endDateISO,
      durationDays: totalDays,
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
   ✅ COMPLETELY FIXED: Proper midnight-spanning logic
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

    console.log("🕐 Current IST Time:", {
      hour: currentHour,
      minute: currentMinute,
      totalMinutes: currentTimeInMinutes,
      formatted: `${String(currentHour).padStart(2, "0")}:${String(
        currentMinute
      ).padStart(2, "0")}`,
    });

    const logs = await ChallengeLog.find({ challengeId: challenge._id });

    const TOTAL_DAYS =
      challenge.durationDays ||
      (challenge.endDate && challenge.startDate
        ? Math.round(
            (new Date(challenge.endDate + "T00:00:00Z") -
              new Date(challenge.startDate + "T00:00:00Z")) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : 21);
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

        // ✅ Today - use the fixed function
        if (iso === todayISO) {
          const status = getHabitStatusForToday(
            currentTimeInMinutes,
            startTimeInMinutes,
            endTimeInMinutes,
            !!log
          );

          // Debug log for the 7th habit (sleep)
          if (index === 6) {
            console.log(`🛏️ Habit #${index + 1} (${habit.title}):`, {
              startTime: habit.startTime,
              endTime: habit.endTime,
              startMinutes: startTimeInMinutes,
              endMinutes: endTimeInMinutes,
              currentMinutes: currentTimeInMinutes,
              isMidnightSpanning: startTimeInMinutes > endTimeInMinutes,
              hasLog: !!log,
              status,
            });
          }

          return status;
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

    const totalDays =
      challenge.durationDays ||
      (challenge.endDate && challenge.startDate
        ? Math.round(
            (new Date(challenge.endDate + "T00:00:00Z") -
              new Date(challenge.startDate + "T00:00:00Z")) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : 21);

    const totalHabits = challenge.habits.length * totalDays;
    const completedHabits = logs.length;
    const completionRate =
      totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

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
      daysCompleted: totalDays,
      durationDays: totalDays,
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
    const TOTAL_DAYS =
      challenge.durationDays ||
      (challenge.endDate && challenge.startDate
        ? Math.round(
            (new Date(challenge.endDate + "T00:00:00Z") -
              new Date(challenge.startDate + "T00:00:00Z")) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : 21);
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
      : TOTAL_DAYS;

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
      totalDays: TOTAL_DAYS,
      durationDays: TOTAL_DAYS,
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
   ✅ FIXED: Uses same logic as getCurrentChallenge
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

    // Check if we can mark it done using the same logic
    const isMidnightSpanning = startTimeInMinutes > endTimeInMinutes;

    if (isMidnightSpanning) {
      // Midnight-spanning: valid if currentTime >= startTime OR currentTime <= endTime
      const inWindow =
        currentTimeInMinutes >= startTimeInMinutes ||
        currentTimeInMinutes <= endTimeInMinutes;

      if (!inWindow) {
        return res.status(400).json({
          message: `Time window expired. Valid from ${habit.startTime} to ${habit.endTime}.`,
        });
      }
    } else {
      // Normal window
      if (currentTimeInMinutes < startTimeInMinutes) {
        return res.status(400).json({ message: "Too early to mark done." });
      }
      if (currentTimeInMinutes > endTimeInMinutes) {
        return res.status(400).json({ message: "Time window expired." });
      }
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
        const totalDays =
          challenge.durationDays ||
          (challenge.endDate && challenge.startDate
            ? Math.round(
                (new Date(challenge.endDate + "T00:00:00Z") -
                  new Date(challenge.startDate + "T00:00:00Z")) /
                  (1000 * 60 * 60 * 24)
              ) + 1
            : 21);

        const totalPossible = challenge.habits.length * totalDays;
        const completed = logs.length;
        const completionRate =
          totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

        const todayISO = getTodayIST();
        const startDate = new Date(challenge.startDate + "T00:00:00Z");
        const today = new Date(todayISO + "T00:00:00Z");

        let daysElapsed = 0;
        if (challenge.isActive) {
          const diff = today.getTime() - startDate.getTime();
          daysElapsed = Math.min(
            Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1),
            totalDays
          );
        } else {
          daysElapsed = totalDays;
        }

        return {
          _id: challenge._id,
          startDate: challenge.startDate,
          endDate: challenge.endDate,
          durationDays: totalDays,
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
