// server/src/controllers/focusController.js
import FocusLog from "../models/FocusLog.js";
import User from "../models/User.js";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// POST /api/focus/log  (auth required)
// body: { durationMin: number }
export const logFocus = async (req, res) => {
  try {
    const userId = req.user; // depending on your auth middleware, this may be req.user._id or req.user
    const durationMin = Number(req.body.durationMin) || 0;
    if (durationMin <= 0) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    const date = todayISO();

    // Upsert: if user already logged multiple focus sessions on same day, we keep separate records.
    // Here we create a new log entry.
    const log = await FocusLog.create({
      userId,
      date,
      durationMin,
    });

    return res.status(201).json({ message: "Focus logged", log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", err: err.message });
  }
};

// GET /api/focus/today
export const getTodayCount = async (req, res) => {
  try {
    const userId = req.user;
    const date = todayISO();
    const count = await FocusLog.countDocuments({ userId, date });
    // Optionally return total minutes today too:
    const agg = await FocusLog.aggregate([
      { $match: { userId: req.user, date } },
      {
        $group: {
          _id: "$date",
          totalMin: { $sum: "$durationMin" },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalMin = agg.length ? agg[0].totalMin : 0;
    return res.json({ date, count, totalMin });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err: err.message });
  }
};

// GET /api/focus/stats?days=7
export const getStats = async (req, res) => {
  try {
    const userId = req.user;
    const days = Number(req.query.days) || 30;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const startISO = start.toISOString().split("T")[0];

    const docs = await FocusLog.aggregate([
      { $match: { userId: req.user, date: { $gte: startISO } } },
      {
        $group: {
          _id: "$date",
          totalMin: { $sum: "$durationMin" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({ docs });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err: err.message });
  }
};
