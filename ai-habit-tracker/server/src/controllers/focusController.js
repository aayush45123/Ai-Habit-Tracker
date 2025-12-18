// server/src/controllers/focusController.js
import FocusLog from "../models/FocusLog.js";
import { getTodayIST, normalizeDateIST } from "../utils/getTodayIST.js";

// POST /api/focus/log  (auth required)
// body: { durationMin: number, sessionType?: string, status?: string }
export const logFocus = async (req, res) => {
  try {
    const userId = req.user._id || req.user;
    const durationMin = Number(req.body.durationMin) || 0;
    const sessionType = req.body.sessionType || "focus";
    const status = req.body.status || "completed";

    if (durationMin <= 0 && status === "completed") {
      return res.status(400).json({ message: "Invalid duration" });
    }

    const date = getTodayIST();

    // Create a new log entry
    const log = await FocusLog.create({
      userId,
      date,
      durationMin,
      sessionType,
      status,
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
    const userId = req.user._id || req.user;
    const date = getTodayIST();

    // Count completed sessions
    const count = await FocusLog.countDocuments({
      userId,
      date,
      status: "completed",
    });

    // Count skipped sessions
    const skipped = await FocusLog.countDocuments({
      userId,
      date,
      status: "skipped",
    });

    // Total minutes today
    const agg = await FocusLog.aggregate([
      { $match: { userId, date, status: "completed" } },
      {
        $group: {
          _id: "$date",
          totalMin: { $sum: "$durationMin" },
        },
      },
    ]);

    const totalMin = agg.length ? agg[0].totalMin : 0;

    return res.json({ date, count, skipped, totalMin });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err: err.message });
  }
};

// GET /api/focus/stats?days=7
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user;
    const days = Number(req.query.days) || 30;

    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60000);
    const start = new Date(istNow);
    start.setDate(istNow.getDate() - (days - 1));
    const startISO = start.toISOString().split("T")[0];

    // Aggregate completed sessions - ONLY count minutes from completed sessions
    const completedDocs = await FocusLog.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startISO },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$date",
          totalMin: { $sum: "$durationMin" }, // Only completed session minutes
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Aggregate skipped sessions - do NOT include their minutes in totalMin
    const skippedDocs = await FocusLog.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startISO },
          status: "skipped",
        },
      },
      {
        $group: {
          _id: "$date",
          skipped: { $sum: 1 },
        },
      },
    ]);

    // Merge results
    const skippedMap = {};
    skippedDocs.forEach((doc) => {
      skippedMap[doc._id] = doc.skipped;
    });

    const docs = completedDocs.map((doc) => ({
      ...doc,
      skipped: skippedMap[doc._id] || 0,
    }));

    // Add dates with only skipped sessions (no completed minutes)
    skippedDocs.forEach((doc) => {
      if (!docs.find((d) => d._id === doc._id)) {
        docs.push({
          _id: doc._id,
          totalMin: 0, // No completed minutes for days with only skips
          count: 0,
          skipped: doc.skipped,
        });
      }
    });

    // Sort by date
    docs.sort((a, b) => a._id.localeCompare(b._id));

    return res.json({ docs });
  } catch (err) {
    return res.status(500).json({ message: "Server error", err: err.message });
  }
};
