import Timetable from "../models/Timetable.js";
import WorkoutLog from "../models/WorkoutLog.js";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TRAINING_FOCUS_GROUPS = [
  {
    label: "Push",
    patterns: ["push", "chest", "shoulder", "tricep", "deltoid"],
  },
  { label: "Pull", patterns: ["pull", "back", "bicep", "lat", "row"] },
  { label: "Legs", patterns: ["leg", "quad", "hamstring", "glute", "calf"] },
  { label: "Core", patterns: ["core", "abs", "plank", "crunch"] },
  {
    label: "Conditioning",
    patterns: [
      "conditioning",
      "cardio",
      "hiit",
      "run",
      "sprint",
      "bike",
      "swim",
    ],
  },
  { label: "Mobility", patterns: ["mobility", "stretch", "recovery", "yoga"] },
];

const IST_OFFSET_MINUTES = 330;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toISTDateString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return istDate.toISOString().split("T")[0];
}

function getISTDayName(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60000);
  return istDate.toLocaleDateString("en-US", { weekday: "long" });
}

function parseTimeToMinutes(value) {
  if (!value) return null;

  const normalized = String(value).trim();
  const hhmm24 = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm24) {
    return Number(hhmm24[1]) * 60 + Number(hhmm24[2]);
  }

  const hhmm12 = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (hhmm12) {
    let hours = Number(hhmm12[1]);
    const minutes = Number(hhmm12[2]);
    const meridiem = hhmm12[3].toUpperCase();

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  return null;
}

function estimateScheduledDuration(schedule) {
  if (!schedule?.startTime || !schedule?.endTime) return 0;

  const start = parseTimeToMinutes(schedule.startTime);
  const end = parseTimeToMinutes(schedule.endTime);

  if (start === null || end === null) return 0;

  let duration = end - start;
  if (duration < 0) duration += 24 * 60;

  return duration;
}

function buildExerciseEntries(schedule = {}) {
  return (schedule.exercises || []).map((exercise) => ({
    exerciseId: exercise._id?.toString() || exercise.name,
    name: exercise.name,
    sets: exercise.sets || "",
    reps: exercise.reps || "",
    duration: exercise.duration || "",
    restBetweenSets: exercise.restBetweenSets || "",
    notes: exercise.notes || "",
    completed: false,
    completedAt: null,
  }));
}

function getScheduleForDate(timetable, dateString) {
  const dayName = getISTDayName(new Date(`${dateString}T00:00:00Z`));
  const schedule =
    timetable.weeklySchedule.find((day) => day.day === dayName) ||
    timetable.weeklySchedule[0] ||
    null;

  return { dayName, schedule };
}

function createSnapshot(timetable, dateString) {
  const { dayName, schedule } = getScheduleForDate(timetable, dateString);
  const isRestDay = schedule?.isRestDay || false;

  return {
    date: dateString,
    scheduledDay: dayName,
    focusArea: schedule?.focusArea || (isRestDay ? "Rest Day" : "General"),
    status: isRestDay ? "rest" : "pending",
    totalExercises: isRestDay ? 0 : (schedule?.exercises || []).length,
    completedExercises: 0,
    completionPercentage: 0,
    scheduledDuration: isRestDay ? 0 : estimateScheduledDuration(schedule),
    actualDuration: 0,
    completedExerciseIds: [],
    exerciseEntries: isRestDay ? [] : buildExerciseEntries(schedule),
    checkpoint: {
      submitted: isRestDay,
      note: "",
      submittedAt: isRestDay ? new Date() : null,
    },
    isExpired: false,
    schedule,
  };
}

function isMissingWorkoutStatus(status) {
  return ["missed", "partial", "completed", "rest"].includes(status);
}

function normalizeCompletionPayload(log, payload = {}, finalStatus) {
  const exerciseEntries = log.exerciseEntries || [];
  const completedExerciseIds = Array.isArray(payload.completedExerciseIds)
    ? [...new Set(payload.completedExerciseIds.map((id) => String(id)))]
    : log.completedExerciseIds || [];

  exerciseEntries.forEach((exercise, index) => {
    const idsToMatch = [
      exercise.exerciseId,
      exercise._id ? exercise._id.toString() : null,
      exercise.name,
      `${log.scheduledDay || "day"}-${index}`,
    ].filter(Boolean);

    const isDone = completedExerciseIds.some((id) =>
      idsToMatch.includes(String(id)),
    );
    exercise.completed = isDone;
    exercise.completedAt = isDone ? exercise.completedAt || new Date() : null;
  });

  const completedExercises = exerciseEntries.filter(
    (exercise) => exercise.completed,
  );

  const totalExercises = exerciseEntries.length;
  const completedCount =
    finalStatus === "missed" || finalStatus === "rest"
      ? 0
      : completedExercises.length;
  const completionPercentage =
    totalExercises > 0
      ? Math.round((completedCount / totalExercises) * 100)
      : finalStatus === "rest"
        ? 0
        : 100;

  return {
    completedExerciseIds,
    completedExercises: completedCount,
    completionPercentage,
    exerciseEntries,
  };
}

async function getTimetableOr404(req, res, timetableId) {
  const timetable = await Timetable.findOne({
    _id: timetableId,
    userId: req.user._id,
  });

  if (!timetable) {
    res.status(404).json({ message: "Timetable not found" });
    return null;
  }

  return timetable;
}

async function getOrCreateWorkoutLog(timetable, dateString) {
  const existingLog = await WorkoutLog.findOne({
    userId: timetable.userId,
    timetableId: timetable._id,
    date: dateString,
  });

  if (existingLog) {
    return existingLog;
  }

  const snapshot = createSnapshot(timetable, dateString);
  const log = await WorkoutLog.create({
    userId: timetable.userId,
    timetableId: timetable._id,
    date: snapshot.date,
    scheduledDay: snapshot.scheduledDay,
    focusArea: snapshot.focusArea,
    status: snapshot.status,
    totalExercises: snapshot.totalExercises,
    completedExercises: snapshot.completedExercises,
    completionPercentage: snapshot.completionPercentage,
    scheduledDuration: snapshot.scheduledDuration,
    actualDuration: snapshot.actualDuration,
    completedExerciseIds: snapshot.completedExerciseIds,
    exerciseEntries: snapshot.exerciseEntries,
    checkpoint: snapshot.checkpoint,
    isExpired: snapshot.isExpired,
  });

  return log;
}

function buildWorkoutLogView(log, timetable) {
  const { schedule } = getScheduleForDate(timetable, log.date);

  return {
    ...log.toObject(),
    scheduledWorkout: schedule || null,
  };
}

function classifyFocusArea(focusArea = "") {
  const value = String(focusArea).toLowerCase();

  for (const group of TRAINING_FOCUS_GROUPS) {
    if (group.patterns.some((pattern) => value.includes(pattern))) {
      return group.label;
    }
  }

  return "Mixed";
}

function buildWorkoutAnalytics(timetable, logs) {
  const logsByDate = new Map(logs.map((log) => [log.date, log]));
  const today = toISTDateString();

  const last7Days = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = toISTDateString(new Date(Date.now() - index * DAY_IN_MS));
    const { dayName, schedule } = getScheduleForDate(timetable, date);
    const isRestDay = schedule?.isRestDay || false;
    const log = logsByDate.get(date);

    const status = isRestDay
      ? "rest"
      : log?.status || (date < today ? "missed" : "pending");

    last7Days.push({
      date,
      day: dayName,
      status,
      isRestDay,
      completionPercentage: log?.completionPercentage || 0,
      completedExercises: log?.completedExercises || 0,
      totalExercises: log?.totalExercises || (schedule?.exercises || []).length,
    });
  }

  const trainingDays = last7Days.filter((day) => !day.isRestDay);
  const completedWorkoutDays = trainingDays.filter(
    (day) => day.status === "completed",
  ).length;
  const weeklyAdherence =
    trainingDays.length > 0
      ? Math.round((completedWorkoutDays / trainingDays.length) * 100)
      : 0;

  let totalAssignedExercises = 0;
  let totalCompletedExercises = 0;
  let missedWorkouts = 0;

  for (let index = 0; index < 56; index += 1) {
    const date = toISTDateString(new Date(Date.now() - index * DAY_IN_MS));
    const { schedule } = getScheduleForDate(timetable, date);

    if (!schedule || schedule.isRestDay) {
      continue;
    }

    const log = logsByDate.get(date);
    const assignedExercises = schedule.exercises?.length || 0;

    totalAssignedExercises += assignedExercises;
    totalCompletedExercises += log?.completedExercises || 0;

    if (date < today && (!log || log.status === "missed")) {
      missedWorkouts += 1;
    }
  }

  const exerciseCompletionRate =
    totalAssignedExercises > 0
      ? Math.round((totalCompletedExercises / totalAssignedExercises) * 100)
      : 0;

  let currentWorkoutStreak = 0;
  for (let index = 0; index < 56; index += 1) {
    const date = toISTDateString(new Date(Date.now() - index * DAY_IN_MS));
    const { schedule } = getScheduleForDate(timetable, date);
    if (!schedule || schedule.isRestDay) {
      continue;
    }

    const log = logsByDate.get(date);
    if (log?.status === "completed") {
      currentWorkoutStreak += 1;
      continue;
    }

    break;
  }

  const workoutVolume = logs.reduce(
    (sum, log) => sum + (log.actualDuration || 0),
    0,
  );

  const focusDistribution = [
    "Push",
    "Pull",
    "Legs",
    "Core",
    "Conditioning",
    "Mobility",
    "Mixed",
  ].reduce((acc, label) => {
    acc[label] = 0;
    return acc;
  }, {});

  (timetable.weeklySchedule || []).forEach((day) => {
    if (day.isRestDay) return;
    const group = classifyFocusArea(day.focusArea);
    focusDistribution[group] += 1;
  });

  const last8WeeksAdherenceTrend = [];
  for (let weekIndex = 7; weekIndex >= 0; weekIndex -= 1) {
    const weekStart = 55 - weekIndex * 7;
    let scheduledDays = 0;
    let completedDays = 0;

    for (let offset = weekStart; offset > weekStart - 7; offset -= 1) {
      const date = toISTDateString(new Date(Date.now() - offset * DAY_IN_MS));
      const { schedule } = getScheduleForDate(timetable, date);
      if (!schedule || schedule.isRestDay) continue;

      scheduledDays += 1;
      const log = logsByDate.get(date);
      if (log?.status === "completed") {
        completedDays += 1;
      }
    }

    last8WeeksAdherenceTrend.push({
      week: `W${8 - weekIndex}`,
      adherence:
        scheduledDays > 0
          ? Math.round((completedDays / scheduledDays) * 100)
          : 0,
      scheduledDays,
      completedDays,
    });
  }

  const weeklyCompletionSeries = last7Days.map((day) => ({
    label: day.day.slice(0, 3).toUpperCase(),
    status: day.status,
    percentage: day.isRestDay ? 0 : day.completionPercentage,
    completedExercises: day.completedExercises,
    totalExercises: day.totalExercises,
  }));

  const latestStatusByDay = {};
  [...logs]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt),
    )
    .forEach((log) => {
      if (!latestStatusByDay[log.scheduledDay]) {
        latestStatusByDay[log.scheduledDay] = {
          status: log.status,
          date: log.date,
          completionPercentage: log.completionPercentage,
        };
      }
    });

  return {
    summary: {
      weeklyAdherence,
      exerciseCompletionRate,
      currentWorkoutStreak,
      missedWorkouts,
      workoutVolume,
      totalAssignedExercises,
      totalCompletedExercises,
    },
    weeklyCompletionSeries,
    last8WeeksAdherenceTrend,
    focusDistribution,
    recentLogs: logs
      .slice(-10)
      .reverse()
      .map((log) => buildWorkoutLogView(log, timetable)),
    latestStatusByDay,
  };
}

export const getTodayWorkoutLog = async (req, res) => {
  try {
    const timetableId = req.params.timetableId || req.params.id;
    const date = req.query.date
      ? toISTDateString(req.query.date)
      : toISTDateString();

    const timetable = await getTimetableOr404(req, res, timetableId);
    if (!timetable) return;

    const log = await getOrCreateWorkoutLog(timetable, date);
    const logs = await WorkoutLog.find({
      userId: req.user._id,
      timetableId,
    }).sort({ date: 1 });

    res.json({
      workoutLog: buildWorkoutLogView(log, timetable),
      analytics: buildWorkoutAnalytics(timetable, logs),
    });
  } catch (err) {
    console.error("Get Workout Log Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateWorkoutLogDraft = async (req, res) => {
  try {
    const timetableId = req.params.timetableId || req.params.id;
    const {
      date,
      completedExerciseIds = [],
      actualDuration = 0,
      note = "",
    } = req.body;

    const timetable = await getTimetableOr404(req, res, timetableId);
    if (!timetable) return;

    const logDate = toISTDateString(date || new Date());
    const log = await getOrCreateWorkoutLog(timetable, logDate);

    if (log.status === "rest") {
      return res
        .status(400)
        .json({ message: "Rest day logs do not require exercise updates" });
    }

    if (log.checkpoint?.submitted) {
      return res.status(409).json({
        message: "Workout log has already been submitted for this date",
      });
    }

    const normalizedIds = [
      ...new Set(completedExerciseIds.map((id) => String(id))),
    ];
    log.completedExerciseIds = normalizedIds;
    log.actualDuration = Number(actualDuration) || 0;
    log.checkpoint.note = note;

    const normalized = normalizeCompletionPayload(
      log,
      { completedExerciseIds: normalizedIds },
      log.status,
    );
    log.completedExercises = normalized.completedExercises;
    log.completionPercentage = normalized.completionPercentage;
    log.exerciseEntries = normalized.exerciseEntries;
    log.status =
      normalized.completedExercises === 0
        ? "pending"
        : log.status === "partial"
          ? "partial"
          : "pending";
    log.checkpoint.submitted = false;
    log.isExpired = false;

    await log.save();

    const logs = await WorkoutLog.find({
      userId: req.user._id,
      timetableId,
    }).sort({ date: 1 });

    res.json({
      workoutLog: buildWorkoutLogView(log, timetable),
      analytics: buildWorkoutAnalytics(timetable, logs),
    });
  } catch (err) {
    console.error("Update Workout Log Draft Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const finalizeWorkoutLog = async (req, res) => {
  try {
    const timetableId = req.params.timetableId || req.params.id;
    const {
      date,
      status,
      note = "",
      actualDuration = 0,
      completedExerciseIds = [],
    } = req.body;

    if (!isMissingWorkoutStatus(status)) {
      return res.status(400).json({
        message: "Status must be completed, partial, missed, or rest",
      });
    }

    const timetable = await getTimetableOr404(req, res, timetableId);
    if (!timetable) return;

    const logDate = toISTDateString(date || new Date());
    const log = await getOrCreateWorkoutLog(timetable, logDate);

    if (log.checkpoint?.submitted) {
      return res.status(409).json({
        message: "Workout log has already been submitted for this date",
      });
    }

    const finalStatus = log.status === "rest" ? "rest" : status;
    const normalized = normalizeCompletionPayload(
      log,
      {
        completedExerciseIds:
          finalStatus === "rest" ? [] : completedExerciseIds,
      },
      finalStatus,
    );

    log.status = finalStatus;
    log.completedExerciseIds = normalized.completedExerciseIds;
    log.completedExercises = normalized.completedExercises;
    log.completionPercentage = normalized.completionPercentage;
    log.exerciseEntries = normalized.exerciseEntries;
    log.actualDuration = Number(actualDuration) || 0;
    log.checkpoint.submitted = true;
    log.checkpoint.note = note;
    log.checkpoint.submittedAt = new Date();
    log.isExpired = false;

    await log.save();

    const logs = await WorkoutLog.find({
      userId: req.user._id,
      timetableId,
    }).sort({ date: 1 });

    res.json({
      message:
        finalStatus === "rest"
          ? "Rest day recorded successfully"
          : "Workout log saved successfully",
      workoutLog: buildWorkoutLogView(log, timetable),
      analytics: buildWorkoutAnalytics(timetable, logs),
    });
  } catch (err) {
    console.error("Finalize Workout Log Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getWorkoutLogAnalytics = async (req, res) => {
  try {
    const timetableId = req.params.timetableId || req.params.id;

    const timetable = await getTimetableOr404(req, res, timetableId);
    if (!timetable) return;

    const logs = await WorkoutLog.find({
      userId: req.user._id,
      timetableId,
    }).sort({ date: 1 });

    res.json({
      timetableId: timetable._id,
      analytics: buildWorkoutAnalytics(timetable, logs),
    });
  } catch (err) {
    console.error("Get Workout Log Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getWorkoutLogHistory = async (req, res) => {
  try {
    const timetableId = req.params.timetableId || req.params.id;

    const timetable = await getTimetableOr404(req, res, timetableId);
    if (!timetable) return;

    const logs = await WorkoutLog.find({
      userId: req.user._id,
      timetableId,
    })
      .sort({ date: -1 })
      .limit(30);

    res.json({
      timetableId: timetable._id,
      logs: logs.map((log) => buildWorkoutLogView(log, timetable)),
      count: logs.length,
    });
  } catch (err) {
    console.error("Get Workout Log History Error:", err);
    res.status(500).json({ message: err.message });
  }
};
