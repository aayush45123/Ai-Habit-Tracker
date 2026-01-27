// server/src/controllers/timetableController.js
import Timetable from "../models/Timetable.js";
import {
  generateImprovementSuggestions,
  getTodaysWorkout,
} from "../services/groqService.js";

/**
 * Create timetable manually (user input)
 */
export const createTimetable = async (req, res) => {
  try {
    const { name, category, goal, level, sportsMode, weeklySchedule } =
      req.body;

    // Validation
    if (!category || !goal || !level) {
      return res.status(400).json({
        message: "Please provide category, goal, and level",
      });
    }

    if (!weeklySchedule || weeklySchedule.length !== 7) {
      return res.status(400).json({
        message: "Please provide schedule for all 7 days",
      });
    }

    // Deactivate previous timetables
    await Timetable.updateMany(
      { userId: req.user, isActive: true },
      { isActive: false },
    );

    // Create new timetable
    const timetable = await Timetable.create({
      userId: req.user,
      name: name || "My Workout Schedule",
      category,
      goal,
      level,
      sportsMode: sportsMode || { enabled: false, sport: "none" },
      weeklySchedule,
      isActive: true,
      hasRequestedAI: false,
    });

    res.json({
      message: "Timetable created successfully!",
      timetable,
    });
  } catch (err) {
    console.error("Create Timetable Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get AI improvement suggestions
 */
export const getAIImprovements = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findOne({
      _id: id,
      userId: req.user,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    // Generate AI suggestions
    const aiResult = await generateImprovementSuggestions({
      category: timetable.category,
      goal: timetable.goal,
      level: timetable.level,
      sportsMode: timetable.sportsMode,
      weeklySchedule: timetable.weeklySchedule,
    });

    let suggestions = [];
    let overallAssessment = {};

    if (aiResult.success) {
      suggestions = aiResult.data.suggestions || [];
      overallAssessment = aiResult.data.overallAssessment || {};
    } else {
      suggestions = aiResult.fallback.suggestions || [];
      overallAssessment = aiResult.fallback.overallAssessment || {};
    }

    // Save suggestions to timetable
    timetable.aiImprovements = suggestions;
    timetable.hasRequestedAI = true;
    timetable.lastImprovedAt = new Date();
    await timetable.save();

    res.json({
      message: "AI improvements generated successfully!",
      suggestions,
      overallAssessment,
      aiSuccess: aiResult.success,
    });
  } catch (err) {
    console.error("Get AI Improvements Error:", err);
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
        message: "No active timetable found. Please create one first.",
      });
    }

    const todaysWorkout = getTodaysWorkout(timetable.weeklySchedule);

    res.json({
      todaysWorkout,
      timetableId: timetable._id,
      category: timetable.category,
      goal: timetable.goal,
      level: timetable.level,
    });
  } catch (err) {
    console.error("Get Today's Workout Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update timetable
 */
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weeklySchedule, category, goal, level, sportsMode } =
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
    if (category) timetable.category = category;
    if (goal) timetable.goal = goal;
    if (level) timetable.level = level;
    if (sportsMode) timetable.sportsMode = sportsMode;
    if (weeklySchedule) {
      timetable.weeklySchedule = weeklySchedule;
      // Reset AI improvements when schedule changes
      timetable.hasRequestedAI = false;
      timetable.aiImprovements = [];
    }

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
