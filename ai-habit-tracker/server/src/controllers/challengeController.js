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
      startTime: convertTo24FromString(h.startTime), // FIXED
      endTime: convertTo24FromString(h.endTime), // FIXED
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
      startTime: convertTo24FromString(h.startTime), // FIXED
      endTime: convertTo24FromString(h.endTime), // FIXED
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
----------------------------------------------------- */
export const getCurrentChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      userId: req.user,
      isActive: true,
    });

    if (!challenge)
      return res.json({ active: false, message: "No active challenge" });

    const todayISO = new Date().toISOString().split("T")[0];

    const logs = await ChallengeLog.find({ challengeId: challenge._id });

    const TOTAL_DAYS = 21;
    const days = [];
    let completed = 0;

    for (let i = 0; i < TOTAL_DAYS; i++) {
      const dateObj = new Date(challenge.startDate);
      dateObj.setDate(dateObj.getDate() + i);
      const iso = dateObj.toISOString().split("T")[0];

      const statuses = challenge.habits.map((habit, index) => {
        const log = logs.find((l) => l.date === iso && l.habitIndex === index);

        const now = new Date();
        const start = new Date(`${iso}T${habit.startTime}`);
        const end = new Date(`${iso}T${habit.endTime}`);

        if (iso < todayISO) return log ? "done" : "expired";

        if (iso === todayISO) {
          if (log) return "done";
          if (now < start) return "pending";
          if (now >= start && now <= end) return "ongoing";
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
   MARK HABIT DONE
----------------------------------------------------- */
/* -----------------------------------------------------
   MARK HABIT DONE
----------------------------------------------------- */
export const markHabitDone = async (req, res) => {
  try {
    const { id, index } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge)
      return res.status(404).json({ message: "Challenge not found" });

    const todayISO = new Date().toISOString().split("T")[0];
    const habit = challenge.habits[index];

    // FIX: convert 08:00 PM → 20:00
    function convertTo24(fullTime) {
      let [t, p] = fullTime.split(" ");
      let [h, m] = t.split(":").map(Number);

      if (p === "PM" && h !== 12) h += 12;
      if (p === "AM" && h === 12) h = 0;

      return `${String(h).padStart(2, "0")}:${m}`;
    }

    const start24 = convertTo24(habit.startTime);
    const end24 = convertTo24(habit.endTime);

    const now = new Date();
    const start = new Date(`${todayISO}T${start24}`);
    const end = new Date(`${todayISO}T${end24}`);

    if (now < start)
      return res.status(400).json({ message: "Too early to mark done." });

    if (now > end)
      return res.status(400).json({ message: "Time window expired." });

    await ChallengeLog.findOneAndUpdate(
      { challengeId: id, habitIndex: index, date: todayISO },
      { status: "done" },
      { upsert: true }
    );

    res.json({ message: "Habit marked done!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
