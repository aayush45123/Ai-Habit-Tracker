import ScheduleEvent from "../models/ScheduleEvent.js";

// Helper: convert HH:mm to minutes from 00:00
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper: convert minutes from 00:00 to HH:mm
function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Helper: get today's date formatted as YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Predefined routine templates that can be applied to any date
const SCHEDULE_PRESETS = {
  productive_workday: {
    name: "Productive Workday",
    description: "High-focus deep work blocks, balanced breaks, and structured wrap-ups",
    events: [
      {
        title: "Morning Planning & Priorities",
        startTime: "08:30",
        endTime: "09:00",
        category: "routine",
        priority: "high",
        description: "Review top 3 goals, clear inbox, organize daily workspace",
        reminderMinutesBefore: 10,
      },
      {
        title: "Deep Work - Primary Project Focus",
        startTime: "09:00",
        endTime: "11:30",
        category: "work",
        priority: "urgent",
        description: "Distraction-free high-leverage problem solving and coding",
        reminderMinutesBefore: 15,
      },
      {
        title: "Active Rest & Rehydration",
        startTime: "11:30",
        endTime: "12:00",
        category: "break",
        priority: "low",
        description: "Step away from screen, hydrate, short walk and posture stretch",
        reminderMinutesBefore: 5,
      },
      {
        title: "Collaborative Sync & Comms",
        startTime: "12:00",
        endTime: "13:00",
        category: "meeting",
        priority: "medium",
        description: "Team alignment, messages, code reviews, and feedback",
        reminderMinutesBefore: 10,
      },
      {
        title: "Nutritious Lunch & Downtime",
        startTime: "13:00",
        endTime: "14:00",
        category: "personal",
        priority: "low",
        description: "Healthy meal, disconnect, recharge eyes and mind",
        reminderMinutesBefore: 5,
      },
      {
        title: "Deep Work - Secondary Objectives",
        startTime: "14:00",
        endTime: "16:30",
        category: "work",
        priority: "high",
        description: "Task execution, documentation, feature development",
        reminderMinutesBefore: 15,
      },
      {
        title: "Daily Closeout & Tomorrow Prep",
        startTime: "16:30",
        endTime: "17:00",
        category: "routine",
        priority: "medium",
        description: "Log progress, commit changes, organize tomorrow's timetable",
        reminderMinutesBefore: 10,
      },
      {
        title: "Physical Exercise & Mobility",
        startTime: "17:30",
        endTime: "18:45",
        category: "fitness",
        priority: "high",
        description: "Cardio, weight training, or high-energy physical activity",
        reminderMinutesBefore: 15,
      },
    ],
  },
  student_study: {
    name: "Student Exam Prep & Study",
    description: "Spaced study blocks with Pomodoro-friendly review periods",
    events: [
      {
        title: "Flashcard Recall & Concepts Review",
        startTime: "08:30",
        endTime: "09:15",
        category: "study",
        priority: "medium",
        description: "Active recall practice and formula verification",
        reminderMinutesBefore: 10,
      },
      {
        title: "Core Subject Intensive Session",
        startTime: "09:30",
        endTime: "11:30",
        category: "study",
        priority: "urgent",
        description: "Difficult topic deep study and theory mastery",
        reminderMinutesBefore: 15,
      },
      {
        title: "Problem Solving & Exercises",
        startTime: "11:45",
        endTime: "13:00",
        category: "study",
        priority: "high",
        description: "Practice sets, mock questions, test solving",
        reminderMinutesBefore: 10,
      },
      {
        title: "Lunch & Brain Break",
        startTime: "13:00",
        endTime: "14:00",
        category: "break",
        priority: "low",
        description: "Relax, eat balanced meal, light walk",
        reminderMinutesBefore: 5,
      },
      {
        title: "Secondary Subject / Lecture Review",
        startTime: "14:30",
        endTime: "16:30",
        category: "study",
        priority: "high",
        description: "Take structured notes, summarize key chapters",
        reminderMinutesBefore: 15,
      },
      {
        title: "Outdoor Walk & Sports",
        startTime: "17:00",
        endTime: "18:00",
        category: "fitness",
        priority: "medium",
        description: "Fresh air, cardio, clear mental fatigue",
        reminderMinutesBefore: 10,
      },
      {
        title: "Summary & Day Reflection",
        startTime: "20:00",
        endTime: "21:00",
        category: "study",
        priority: "medium",
        description: "Review today's highlights and set next targets",
        reminderMinutesBefore: 10,
      },
    ],
  },
  wellness_balance: {
    name: "Healthy Balanced Routine",
    description: "Harmonious balance of wellness, productive bursts, and personal peace",
    events: [
      {
        title: "Morning Sunlight & Hydration",
        startTime: "07:00",
        endTime: "07:30",
        category: "routine",
        priority: "medium",
        description: "Hydrate with lemon water, 10 min light stretching, natural daylight",
        reminderMinutesBefore: 5,
      },
      {
        title: "Morning Workout / Yoga",
        startTime: "07:30",
        endTime: "08:30",
        category: "fitness",
        priority: "high",
        description: "Full body mobility, yoga flow, or morning jog",
        reminderMinutesBefore: 10,
      },
      {
        title: "Mindful Breakfast & Reading",
        startTime: "08:30",
        endTime: "09:15",
        category: "personal",
        priority: "low",
        description: "High protein meal, read 10 pages of inspirational book",
        reminderMinutesBefore: 5,
      },
      {
        title: "Top Priority Deep Focus",
        startTime: "09:30",
        endTime: "12:30",
        category: "work",
        priority: "urgent",
        description: "Execute the single most important task of the day",
        reminderMinutesBefore: 15,
      },
      {
        title: "Mindful Lunch & Pause",
        startTime: "12:30",
        endTime: "13:30",
        category: "break",
        priority: "low",
        description: "Unplugged lunch, rest without phone",
        reminderMinutesBefore: 5,
      },
      {
        title: "Afternoon Tasks & Creative Projects",
        startTime: "14:00",
        endTime: "16:30",
        category: "work",
        priority: "medium",
        description: "Creative hobby, research, learning new skills",
        reminderMinutesBefore: 10,
      },
      {
        title: "Evening Wind Down & Journaling",
        startTime: "21:00",
        endTime: "22:00",
        category: "routine",
        priority: "medium",
        description: "Gratitude list, digital sunset, prepare for deep sleep",
        reminderMinutesBefore: 10,
      },
    ],
  },
};

/**
 * Helper to annotate events with conflict/overlap information
 */
function annotateConflicts(events) {
  const result = [];
  for (let i = 0; i < events.length; i++) {
    const cur = events[i].toObject ? events[i].toObject() : { ...events[i] };
    const conflicts = [];

    for (let j = 0; j < events.length; j++) {
      if (i === j) continue;
      const other = events[j];
      // Check interval overlap: max(startA, startB) < min(endA, endB)
      if (
        Math.max(cur.startMinutes, other.startMinutes) <
        Math.min(cur.endMinutes, other.endMinutes)
      ) {
        conflicts.push({
          id: other._id,
          title: other.title,
          timeRange: `${other.startTime} - ${other.endTime}`,
        });
      }
    }

    cur.hasConflict = conflicts.length > 0;
    cur.conflicts = conflicts;
    result.push(cur);
  }
  return result;
}

/**
 * GET /api/schedule
 * Fetch events filtered by date, range, or category
 */
export async function getEvents(req, res) {
  try {
    const userId = req.user._id;
    const { date, startDate, endDate, category, status, month } = req.query;

    const query = { userId };

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (month) {
      // Month format: YYYY-MM
      query.date = { $regex: new RegExp(`^${month}`) };
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const events = await ScheduleEvent.find(query).sort({ date: 1, startMinutes: 1 });
    const annotatedEvents = annotateConflicts(events);

    return res.status(200).json({
      success: true,
      count: annotatedEvents.length,
      events: annotatedEvents,
    });
  } catch (error) {
    console.error("Error fetching schedule events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch schedule events",
      error: error.message,
    });
  }
}

/**
 * GET /api/schedule/summary
 * Get summary stats for today or specified date (active task, upcoming, counts)
 */
export async function getScheduleSummary(req, res) {
  try {
    const userId = req.user._id;
    const targetDate = req.query.date || getTodayDateString();

    const events = await ScheduleEvent.find({ userId, date: targetDate }).sort({
      startMinutes: 1,
    });

    // Compute current time in minutes
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activeEvent = null;
    let nextUpcomingEvent = null;
    let totalMinutesPlanned = 0;
    let completedCount = 0;

    for (const ev of events) {
      const duration = Math.max(0, ev.endMinutes - ev.startMinutes);
      totalMinutesPlanned += duration;

      if (ev.status === "completed") {
        completedCount++;
      }

      // Check currently active
      if (
        ev.status !== "completed" &&
        ev.status !== "cancelled" &&
        currentMinutes >= ev.startMinutes &&
        currentMinutes < ev.endMinutes
      ) {
        if (!activeEvent) activeEvent = ev;
      }

      // Check next upcoming
      if (
        ev.status !== "completed" &&
        ev.status !== "cancelled" &&
        ev.startMinutes > currentMinutes
      ) {
        if (!nextUpcomingEvent || ev.startMinutes < nextUpcomingEvent.startMinutes) {
          nextUpcomingEvent = ev;
        }
      }
    }

    const totalEvents = events.length;
    const completionRate =
      totalEvents > 0 ? Math.round((completedCount / totalEvents) * 100) : 0;

    return res.status(200).json({
      success: true,
      date: targetDate,
      totalEvents,
      completedCount,
      pendingCount: totalEvents - completedCount,
      completionRate,
      totalMinutesPlanned,
      totalHoursPlanned: (totalMinutesPlanned / 60).toFixed(1),
      activeEvent,
      nextUpcomingEvent,
      events: annotateConflicts(events),
    });
  } catch (error) {
    console.error("Error getting schedule summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate schedule summary",
      error: error.message,
    });
  }
}

/**
 * GET /api/schedule/monthly-counts
 * Get count of events per day in a given YYYY-MM
 */
export async function getMonthlyEventCounts(req, res) {
  try {
    const userId = req.user._id;
    const month = req.query.month || getTodayDateString().slice(0, 7); // "YYYY-MM"

    const events = await ScheduleEvent.find({
      userId,
      date: { $regex: new RegExp(`^${month}`) },
    }).select("date status");

    const countsByDate = {};
    for (const ev of events) {
      if (!countsByDate[ev.date]) {
        countsByDate[ev.date] = { total: 0, completed: 0 };
      }
      countsByDate[ev.date].total += 1;
      if (ev.status === "completed") {
        countsByDate[ev.date].completed += 1;
      }
    }

    return res.status(200).json({
      success: true,
      month,
      countsByDate,
    });
  } catch (error) {
    console.error("Error getting monthly counts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly counts",
      error: error.message,
    });
  }
}

/**
 * POST /api/schedule
 * Create a new schedule event/time block
 */
export async function createEvent(req, res) {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      category,
      priority,
      status,
      reminderMinutesBefore,
      color,
      isRecurring,
      recurringDays,
    } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Title, date, start time, and end time are required",
      });
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time",
      });
    }

    // Check for existing overlapping events on the same day for user
    const overlapping = await ScheduleEvent.find({
      userId,
      date,
      startMinutes: { $lt: endMinutes },
      endMinutes: { $gt: startMinutes },
    });

    const newEvent = new ScheduleEvent({
      userId,
      title: title.trim(),
      description: description ? description.trim() : "",
      date,
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      category: category || "routine",
      priority: priority || "medium",
      status: status || "pending",
      reminderMinutesBefore: reminderMinutesBefore !== undefined ? reminderMinutesBefore : 15,
      color: color || "#000000",
      isRecurring: !!isRecurring,
      recurringDays: recurringDays || [],
    });

    await newEvent.save();

    return res.status(201).json({
      success: true,
      message: "Schedule event created successfully",
      event: newEvent,
      hasConflict: overlapping.length > 0,
      conflictsCount: overlapping.length,
      conflictsWith: overlapping.map((o) => `${o.title} (${o.startTime} - ${o.endTime})`),
    });
  } catch (error) {
    console.error("Error creating schedule event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create schedule event",
      error: error.message,
    });
  }
}

/**
 * PUT /api/schedule/:id
 * Update an existing event
 */
export async function updateEvent(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = { ...req.body };

    const event = await ScheduleEvent.findOne({ _id: id, userId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Schedule event not found",
      });
    }

    const startTime = updateData.startTime || event.startTime;
    const endTime = updateData.endTime || event.endTime;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    updateData.startMinutes = startMinutes;
    updateData.endMinutes = endMinutes;

    const updatedEvent = await ScheduleEvent.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Schedule event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating schedule event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update schedule event",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/schedule/:id/status
 * Quickly toggle or update event status
 */
export async function toggleEventStatus(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const event = await ScheduleEvent.findOne({ _id: id, userId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Schedule event not found",
      });
    }

    // If explicit status provided, use it; otherwise toggle between completed and pending
    const newStatus =
      status || (event.status === "completed" ? "pending" : "completed");

    event.status = newStatus;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Event marked as ${newStatus}`,
      event,
    });
  } catch (error) {
    console.error("Error toggling event status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle status",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/schedule/:id
 * Delete an event
 */
export async function deleteEvent(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await ScheduleEvent.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Schedule event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Schedule event removed",
      id,
    });
  } catch (error) {
    console.error("Error deleting schedule event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete schedule event",
      error: error.message,
    });
  }
}

/**
 * POST /api/schedule/clone-day
 * Clone all events from sourceDate to targetDate
 */
export async function cloneDaySchedule(req, res) {
  try {
    const userId = req.user._id;
    const { sourceDate, targetDate } = req.body;

    if (!sourceDate || !targetDate) {
      return res.status(400).json({
        success: false,
        message: "sourceDate and targetDate are required",
      });
    }

    const sourceEvents = await ScheduleEvent.find({ userId, date: sourceDate });
    if (!sourceEvents.length) {
      return res.status(404).json({
        success: false,
        message: `No events found on ${sourceDate} to copy`,
      });
    }

    const clonedDocs = sourceEvents.map((ev) => ({
      userId,
      title: ev.title,
      description: ev.description,
      date: targetDate,
      startTime: ev.startTime,
      endTime: ev.endTime,
      startMinutes: ev.startMinutes,
      endMinutes: ev.endMinutes,
      category: ev.category,
      priority: ev.priority,
      status: "pending",
      reminderMinutesBefore: ev.reminderMinutesBefore,
      color: ev.color,
    }));

    const inserted = await ScheduleEvent.insertMany(clonedDocs);

    return res.status(201).json({
      success: true,
      message: `Copied ${inserted.length} events from ${sourceDate} to ${targetDate}`,
      events: inserted,
    });
  } catch (error) {
    console.error("Error cloning schedule day:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clone day schedule",
      error: error.message,
    });
  }
}

/**
 * POST /api/schedule/apply-preset
 * Apply a preset routine to a given date
 */
export async function applyPresetSchedule(req, res) {
  try {
    const userId = req.user._id;
    const { presetKey, targetDate, clearExisting } = req.body;

    const preset = SCHEDULE_PRESETS[presetKey];
    if (!preset) {
      return res.status(400).json({
        success: false,
        message: `Unknown preset key. Choose from: ${Object.keys(SCHEDULE_PRESETS).join(", ")}`,
      });
    }

    const date = targetDate || getTodayDateString();

    if (clearExisting) {
      await ScheduleEvent.deleteMany({ userId, date });
    }

    const docs = preset.events.map((item) => ({
      userId,
      title: item.title,
      description: item.description,
      date,
      startTime: item.startTime,
      endTime: item.endTime,
      startMinutes: timeToMinutes(item.startTime),
      endMinutes: timeToMinutes(item.endTime),
      category: item.category,
      priority: item.priority,
      status: "pending",
      reminderMinutesBefore: item.reminderMinutesBefore,
      color: "#000000",
    }));

    const inserted = await ScheduleEvent.insertMany(docs);

    return res.status(201).json({
      success: true,
      message: `Successfully loaded "${preset.name}" preset with ${inserted.length} time blocks`,
      events: inserted,
    });
  } catch (error) {
    console.error("Error applying schedule preset:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to apply preset",
      error: error.message,
    });
  }
}

/**
 * GET /api/schedule/presets
 * List available presets
 */
export async function getPresets(req, res) {
  return res.status(200).json({
    success: true,
    presets: Object.entries(SCHEDULE_PRESETS).map(([key, val]) => ({
      key,
      name: val.name,
      description: val.description,
      eventCount: val.events.length,
      sampleEvents: val.events.slice(0, 3),
    })),
  });
}

