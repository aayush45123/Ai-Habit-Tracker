// server/src/controllers/timetableController.js
import Timetable from "../models/Timetable.js";
import {
  generateWorkoutTimetable,
  getTodaysWorkout,
} from "../services/groqService.js";

/**
 * Generate AI-powered timetable
 */
export const generateTimetable = async (req, res) => {
  try {
    const { goal, level, timeAvailable, sportsMode } = req.body;

    // Validation
    if (!goal || !level || !timeAvailable) {
      return res.status(400).json({
        message: "Please provide goal, level, and time available",
      });
    }

    // Deactivate previous timetables
    await Timetable.updateMany(
      { userId: req.user, isActive: true },
      { isActive: false },
    );

    // Generate timetable using Groq AI
    const aiResult = await generateWorkoutTimetable({
      goal,
      level,
      timeAvailable,
      sportsMode: sportsMode || { enabled: false, sport: "none" },
    });

    let weeklySchedule;
    let aiGenerated = true;

    if (aiResult.success) {
      weeklySchedule = aiResult.data.weeklySchedule;
    } else {
      weeklySchedule = aiResult.fallback.weeklySchedule;
      aiGenerated = false;
    }

    // Create new timetable
    const timetable = await Timetable.create({
      userId: req.user,
      goal,
      level,
      timeAvailable,
      sportsMode: sportsMode || { enabled: false, sport: "none" },
      weeklySchedule,
      isActive: true,
      aiGenerated,
      generatedAt: new Date(),
    });

    res.json({
      message: aiGenerated
        ? "AI-powered timetable generated successfully!"
        : "Timetable generated successfully (using fallback)",
      timetable,
      tips: aiResult.success ? aiResult.data.tips : aiResult.fallback.tips,
      warnings: aiResult.success
        ? aiResult.data.warnings
        : aiResult.fallback.warnings,
    });
  } catch (err) {
    console.error("Generate Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get active timetable
 */
export const getActiveTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      userId: req.user,
      isActive: true,
    });

    if (!timetable) {
      return res.json({
        active: false,
        message: "No active timetable found",
      });
    }

    // Get today's workout
    const todaysWorkout = getTodaysWorkout(timetable.weeklySchedule);

    res.json({
      active: true,
      timetable,
      todaysWorkout,
    });
  } catch (err) {
    console.error("Get Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get today's workout specifically
 */
export const getTodaysWorkoutPlan = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      userId: req.user,
      isActive: true,
    });

    if (!timetable) {
      return res.status(404).json({
        message: "No active timetable found. Please generate one first.",
      });
    }

    const todaysWorkout = getTodaysWorkout(timetable.weeklySchedule);

    res.json({
      todaysWorkout,
      timetableId: timetable._id,
      goal: timetable.goal,
      level: timetable.level,
    });
  } catch (err) {
    console.error("Get Today's Workout Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update timetable (manual edits)
 */
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { weeklySchedule, name, goal, level, timeAvailable, sportsMode } =
      req.body;

    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Update fields
    if (name) timetable.name = name;
    if (goal) timetable.goal = goal;
    if (level) timetable.level = level;
    if (timeAvailable) timetable.timeAvailable = timeAvailable;
    if (sportsMode) timetable.sportsMode = sportsMode;
    if (weeklySchedule) timetable.weeklySchedule = weeklySchedule;

    await timetable.save();

    res.json({
      message: "Timetable updated successfully!",
      timetable,
    });
  } catch (err) {
    console.error("Update Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete timetable
 */
export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    await Timetable.findByIdAndDelete(id);

    res.json({ message: "Timetable deleted successfully" });
  } catch (err) {
    console.error("Delete Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all user timetables (history)
 */
export const getTimetableHistory = async (req, res) => {
  try {
    const timetables = await Timetable.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      timetables,
      count: timetables.length,
    });
  } catch (err) {
    console.error("Get History Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Regenerate timetable with new AI suggestions
 */
export const regenerateTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Generate new schedule with AI
    const aiResult = await generateWorkoutTimetable({
      goal: timetable.goal,
      level: timetable.level,
      timeAvailable: timetable.timeAvailable,
      sportsMode: timetable.sportsMode,
    });

    let weeklySchedule;
    let aiGenerated = true;

    if (aiResult.success) {
      weeklySchedule = aiResult.data.weeklySchedule;
    } else {
      weeklySchedule = aiResult.fallback.weeklySchedule;
      aiGenerated = false;
    }

    timetable.weeklySchedule = weeklySchedule;
    timetable.aiGenerated = aiGenerated;
    timetable.generatedAt = new Date();

    await timetable.save();

    res.json({
      message: "Timetable regenerated successfully!",
      timetable,
      tips: aiResult.success ? aiResult.data.tips : aiResult.fallback.tips,
      warnings: aiResult.success
        ? aiResult.data.warnings
        : aiResult.fallback.warnings,
    });
  } catch (err) {
    console.error("Regenerate Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};
