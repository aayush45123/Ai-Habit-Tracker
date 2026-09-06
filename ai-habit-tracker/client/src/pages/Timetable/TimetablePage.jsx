// client/src/pages/TimetablePage/TimetablePage.jsx - COMPLETE FIXED VERSION
import React, { useEffect, useState } from "react";
import {
  Dumbbell,
  Sparkles,
  Trash2,
  Plus,
  Target,
  Edit,
  Lightbulb,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./TimetablePage.module.css";
import TodaysWorkout from "../../components/TodaysWorkout/TodaysWorkout";
import WeeklySchedule from "../../components/WeeklySchedule/WeeklySchedule";
import TimetableCreator from "../../components/TimetableCreator/TimetableCreator";
import AIImprovements from "../../components/AIImprovements/AIImprovements";
import AITimetableGenerator from "../../components/AITimetableGenerator/AITimetableGenerator";
import TimetableCheckpointPanel from "../../components/TimetableCheckpointPanel/TimetableCheckpointPanel";
import TimetableAnalyticsPanel from "../../components/TimetableAnalyticsPanel/TimetableAnalyticsPanel";
import { Skeleton } from "../../components/Skeleton/Skeleton.jsx";

export default function TimetablePage() {
  function getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  }

  function getWorkoutCacheKey(timetableId, date = getTodayDateString()) {
    return `workout_log_cache_${timetableId}_${date}`;
  }

  function getWorkoutHistoryKey(timetableId) {
    return `workout_log_history_${timetableId}`;
  }

  function getWorkoutApiStatusKey(timetableId) {
    return `workout_log_api_available_${timetableId}`;
  }

  function isWorkoutApiAvailable(timetableId) {
    if (!timetableId) return false;

    const value = localStorage.getItem(getWorkoutApiStatusKey(timetableId));
    return value !== "false";
  }

  function setWorkoutApiAvailable(timetableId, available) {
    if (!timetableId) return;
    localStorage.setItem(
      getWorkoutApiStatusKey(timetableId),
      available ? "true" : "false",
    );
  }

  function readLocalWorkoutHistory(timetableId) {
    if (!timetableId) return {};

    try {
      return (
        JSON.parse(localStorage.getItem(getWorkoutHistoryKey(timetableId))) ||
        {}
      );
    } catch {
      return {};
    }
  }

  function writeLocalWorkoutHistory(timetableId, date, workoutLogData) {
    if (!timetableId || !date || !workoutLogData) return;

    const history = readLocalWorkoutHistory(timetableId);
    history[date] = workoutLogData;
    localStorage.setItem(
      getWorkoutHistoryKey(timetableId),
      JSON.stringify(history),
    );
    localStorage.setItem(
      getWorkoutCacheKey(timetableId, date),
      JSON.stringify(workoutLogData),
    );
  }

  function buildLocalAnalytics(timetable, history) {
    const weeklySchedule = timetable?.weeklySchedule || [];
    const historyEntries = Object.entries(history)
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const today = getTodayDateString();

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const iso = date.toISOString().split("T")[0];
      const weekday = daysOfWeek[date.getDay()];
      const schedule = weeklySchedule.find((day) => day.day === weekday);
      const log = history[iso];

      return {
        date: iso,
        day: weekday,
        status: schedule?.isRestDay
          ? "rest"
          : log?.status || (iso < today ? "missed" : "pending"),
        isRestDay: !!schedule?.isRestDay,
        completionPercentage: log?.completionPercentage || 0,
        completedExercises: log?.completedExercises || 0,
        totalExercises: schedule?.exercises?.length || 0,
      };
    });

    const scheduledDays = last7Days.filter((day) => !day.isRestDay);
    const completedWorkoutDays = scheduledDays.filter(
      (day) => day.status === "completed",
    ).length;
    const weeklyAdherence =
      scheduledDays.length > 0
        ? Math.round((completedWorkoutDays / scheduledDays.length) * 100)
        : 0;

    const totalAssignedExercises = scheduledDays.reduce(
      (sum, day) => sum + (day.totalExercises || 0),
      0,
    );
    const totalCompletedExercises = scheduledDays.reduce(
      (sum, day) => sum + (day.completedExercises || 0),
      0,
    );
    const exerciseCompletionRate =
      totalAssignedExercises > 0
        ? Math.round((totalCompletedExercises / totalAssignedExercises) * 100)
        : 0;

    let currentWorkoutStreak = 0;
    for (let offset = 0; offset < 56; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const iso = date.toISOString().split("T")[0];
      const weekday = daysOfWeek[date.getDay()];
      const schedule = weeklySchedule.find((day) => day.day === weekday);
      if (!schedule || schedule.isRestDay) continue;
      const log = history[iso];
      if (log?.status === "completed") {
        currentWorkoutStreak += 1;
      } else {
        break;
      }
    }

    const missedWorkouts = scheduledDays.filter(
      (day) => day.date < today && day.status === "missed",
    ).length;

    const weekSeries = last7Days.map((day) => ({
      label: day.day.slice(0, 3).toUpperCase(),
      status: day.status,
      percentage: day.isRestDay ? 0 : day.completionPercentage,
      completedExercises: day.completedExercises,
      totalExercises: day.totalExercises,
    }));

    const last8WeeksAdherenceTrend = Array.from({ length: 8 }, (_, index) => {
      const weekStart = 55 - index * 7;
      let scheduled = 0;
      let completed = 0;

      for (let offset = weekStart; offset > weekStart - 7; offset -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        const iso = date.toISOString().split("T")[0];
        const weekday = daysOfWeek[date.getDay()];
        const schedule = weeklySchedule.find((day) => day.day === weekday);
        if (!schedule || schedule.isRestDay) continue;
        scheduled += 1;
        if (history[iso]?.status === "completed") completed += 1;
      }

      return {
        week: `W${index + 1}`,
        adherence:
          scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
        scheduledDays: scheduled,
        completedDays: completed,
      };
    });

    const latestStatusByDay = {};
    historyEntries.forEach((entry) => {
      if (!latestStatusByDay[entry.scheduledDay]) {
        latestStatusByDay[entry.scheduledDay] = {
          status: entry.status,
          date: entry.date,
          completionPercentage: entry.completionPercentage || 0,
        };
      }
    });

    return {
      summary: {
        weeklyAdherence,
        exerciseCompletionRate,
        currentWorkoutStreak,
        missedWorkouts,
        workoutVolume: historyEntries.reduce(
          (sum, entry) => sum + (entry.actualDuration || 0),
          0,
        ),
        totalAssignedExercises,
        totalCompletedExercises,
      },
      weeklyCompletionSeries: weekSeries,
      last8WeeksAdherenceTrend,
      focusDistribution: weeklySchedule.reduce(
        (acc, day) => {
          if (day.isRestDay) return acc;
          const focus = day.focusArea || "Mixed";
          const bucket = focus.toLowerCase().includes("leg")
            ? "Legs"
            : focus.toLowerCase().includes("push")
              ? "Push"
              : focus.toLowerCase().includes("pull")
                ? "Pull"
                : focus.toLowerCase().includes("core")
                  ? "Core"
                  : focus.toLowerCase().includes("cardio") ||
                      focus.toLowerCase().includes("conditioning")
                    ? "Conditioning"
                    : focus.toLowerCase().includes("mobility") ||
                        focus.toLowerCase().includes("stretch")
                      ? "Mobility"
                      : "Mixed";
          acc[bucket] = (acc[bucket] || 0) + 1;
          return acc;
        },
        {
          Push: 0,
          Pull: 0,
          Legs: 0,
          Core: 0,
          Conditioning: 0,
          Mobility: 0,
          Mixed: 0,
        },
      ),
      recentLogs: historyEntries.slice(-10).reverse(),
      latestStatusByDay,
    };
  }

  const [activeTimetable, setActiveTimetable] = useState(null);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [workoutLog, setWorkoutLog] = useState(null);
  const [workoutAnalytics, setWorkoutAnalytics] = useState(null);
  const [completedExerciseIds, setCompletedExerciseIds] = useState([]);
  const [draftNote, setDraftNote] = useState("");
  const [draftDuration, setDraftDuration] = useState(0);
  const [draftStatus, setDraftStatus] = useState("partial");
  const [logLoading, setLogLoading] = useState(false);
  const [logSaving, setLogSaving] = useState(false);

  const isWorkoutSubmitted = !!workoutLog?.checkpoint?.submitted;

  useEffect(() => {
    loadActiveTimetable();
  }, []);

  async function loadActiveTimetable() {
    try {
      setLoading(true);
      const res = await api.get("/timetable/active");

      if (res.data.active) {
        const timetable = res.data.timetable;
        const todayWorkout = res.data.todaysWorkout;
        setActiveTimetable(timetable);
        setTodaysWorkout(todayWorkout);
        setShowCreator(false);

        // Load AI improvements if already requested
        if (timetable.hasRequestedAI) {
          setAiSuggestions(timetable.aiImprovements || []);
        }

        await loadWorkoutLog(timetable._id, timetable, todayWorkout);
      } else {
        setShowCreator(true);
        setWorkoutLog(null);
        setWorkoutAnalytics(null);
      }
    } catch (err) {
      console.error(err);
      setShowCreator(true);
      setWorkoutLog(null);
      setWorkoutAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkoutLog(timetableId, currentTimetable = activeTimetable, currentTodayWorkout = todaysWorkout) {
    if (!timetableId) return;

    setLogLoading(true);
    const todayDate = getTodayDateString();

    // 1. Immediately restore today's cached progress if present to avoid 0% flicker on refresh
    const cachedHistory = readLocalWorkoutHistory(timetableId);
    const cachedToday =
      cachedHistory[todayDate] ||
      Object.values(cachedHistory).find(
        (entry) =>
          entry?.date === todayDate ||
          (entry?.scheduledDay && entry.scheduledDay === currentTodayWorkout?.day),
      );

    if (cachedToday && Array.isArray(cachedToday.completedExerciseIds) && cachedToday.completedExerciseIds.length > 0) {
      setWorkoutLog(cachedToday);
      setCompletedExerciseIds(cachedToday.completedExerciseIds);
      setDraftNote(cachedToday?.checkpoint?.note || "");
      setDraftDuration(cachedToday?.actualDuration || 0);
      setDraftStatus(cachedToday?.status || "partial");
      if (currentTimetable) {
        setWorkoutAnalytics(buildLocalAnalytics(currentTimetable, cachedHistory));
      }
    }

    // 2. Fetch fresh workout log and analytics from backend API
    try {
      const res = await api.get(`/timetables/${timetableId}/workout-log/today`);
      setWorkoutApiAvailable(timetableId, true);

      if (res.data?.workoutLog) {
        const incomingLog = res.data.workoutLog;
        setWorkoutLog(incomingLog);
        setWorkoutAnalytics(res.data.analytics || null);
        setCompletedExerciseIds(incomingLog.completedExerciseIds || []);
        setDraftNote(incomingLog.checkpoint?.note || "");
        setDraftDuration(incomingLog.actualDuration || 0);
        setDraftStatus(
          incomingLog.status && incomingLog.status !== "pending"
            ? incomingLog.status
            : incomingLog.status === "rest"
              ? "rest"
              : "partial",
        );
        writeLocalWorkoutHistory(
          timetableId,
          incomingLog.date || todayDate,
          incomingLog,
        );
        return;
      }
    } catch (err) {
      console.warn("Could not load workout log from server, using local cache:", err.message);
    }

    // 3. Fallback: if server did not return a log, use local cache or create fallback
    if (cachedToday) {
      setWorkoutLog(cachedToday);
      setCompletedExerciseIds(cachedToday.completedExerciseIds || []);
      setDraftNote(cachedToday?.checkpoint?.note || "");
      setDraftDuration(cachedToday?.actualDuration || 0);
      setDraftStatus(cachedToday?.status || "partial");
      setWorkoutAnalytics(
        buildLocalAnalytics(currentTimetable, cachedHistory),
      );
    } else {
      const fallbackLog = {
        date: todayDate,
        scheduledDay: currentTodayWorkout?.day || "Today",
        focusArea: currentTodayWorkout?.focusArea || "",
        status: currentTodayWorkout?.isRestDay ? "rest" : "pending",
        totalExercises: currentTodayWorkout?.exercises?.length || 0,
        completedExercises: 0,
        completionPercentage: 0,
        scheduledDuration: 0,
        actualDuration: 0,
        completedExerciseIds: [],
        checkpoint: {
          submitted: !!currentTodayWorkout?.isRestDay,
          note: "",
          submittedAt: null,
        },
        exerciseEntries: (currentTodayWorkout?.exercises || []).map(
          (exercise, index) => ({
            exerciseId:
              exercise._id?.toString() ||
              `${currentTodayWorkout?.day || "today"}-${index}`,
            name: exercise.name,
            sets: exercise.sets || "",
            reps: exercise.reps || "",
            duration: exercise.duration || "",
            restBetweenSets: exercise.restBetweenSets || "",
            notes: exercise.notes || "",
            completed: false,
            completedAt: null,
          }),
        ),
      };

      setWorkoutLog(fallbackLog);
      setCompletedExerciseIds([]);
      setDraftNote("");
      setDraftDuration(0);
      setDraftStatus(currentTodayWorkout?.isRestDay ? "rest" : "partial");
      setWorkoutAnalytics(buildLocalAnalytics(currentTimetable, {}));
    }

    setLogLoading(false);
  }

  const workoutExerciseIds =
    todaysWorkout?.exercises?.map(
      (exercise, index) =>
        exercise._id?.toString() || `${todaysWorkout?.day || "today"}-${index}`,
    ) || [];

  const workoutCompletionPercentage =
    todaysWorkout &&
    !todaysWorkout.isRestDay &&
    todaysWorkout.exercises.length > 0
      ? Math.round(
          (completedExerciseIds.length / todaysWorkout.exercises.length) * 100,
        )
      : 0;

  async function persistWorkoutDraft(nextExerciseIds = completedExerciseIds) {
    if (!activeTimetable?._id) return;

    const currentDate = workoutLog?.date || getTodayDateString();
    const cachedLog = {
      ...(workoutLog || {}),
      date: currentDate,
      scheduledDay: workoutLog?.scheduledDay || todaysWorkout?.day || "Today",
      focusArea: workoutLog?.focusArea || todaysWorkout?.focusArea || "",
      completedExerciseIds: nextExerciseIds,
      completedExercises: nextExerciseIds.length,
      completionPercentage:
        todaysWorkout?.exercises?.length > 0
          ? Math.round(
              (nextExerciseIds.length / todaysWorkout.exercises.length) * 100,
            )
          : 0,
      actualDuration: draftDuration,
      checkpoint: {
        ...(workoutLog?.checkpoint || {}),
        submitted: workoutLog?.checkpoint?.submitted || false,
        note: draftNote,
      },
    };

    writeLocalWorkoutHistory(activeTimetable._id, currentDate, cachedLog);

    try {
      const res = await api.patch(
        `/timetables/${activeTimetable._id}/workout-log/today`,
        {
          date: currentDate,
          completedExerciseIds: nextExerciseIds,
          actualDuration: draftDuration,
          note: draftNote,
        },
      );

      setWorkoutApiAvailable(activeTimetable._id, true);
      if (res.data?.workoutLog) {
        setWorkoutLog(res.data.workoutLog);
        setWorkoutAnalytics(res.data.analytics || null);
        writeLocalWorkoutHistory(
          activeTimetable._id,
          res.data.workoutLog?.date || currentDate,
          res.data.workoutLog,
        );
      }
      return;
    } catch (err) {
      console.warn("Could not sync workout draft to server, maintained in local storage:", err);
      const fallbackLog = {
        ...(workoutLog || {}),
        date: currentDate,
        scheduledDay: workoutLog?.scheduledDay || todaysWorkout?.day || "Today",
        focusArea: workoutLog?.focusArea || todaysWorkout?.focusArea || "",
        status:
          workoutLog?.status || (todaysWorkout?.isRestDay ? "rest" : "pending"),
        totalExercises:
          todaysWorkout?.exercises?.length || workoutLog?.totalExercises || 0,
        completedExercises: nextExerciseIds.length,
        completionPercentage:
          todaysWorkout?.exercises?.length > 0
            ? Math.round(
                (nextExerciseIds.length / todaysWorkout.exercises.length) * 100,
              )
            : workoutLog?.completionPercentage || 0,
        scheduledDuration: workoutLog?.scheduledDuration || 0,
        actualDuration: draftDuration,
        completedExerciseIds: nextExerciseIds,
        checkpoint: {
          ...(workoutLog?.checkpoint || {}),
          submitted: workoutLog?.checkpoint?.submitted || false,
          note: draftNote,
        },
        exerciseEntries:
          workoutLog?.exerciseEntries ||
          (todaysWorkout?.exercises || []).map((exercise, index) => ({
            exerciseId:
              exercise._id?.toString() ||
              `${todaysWorkout?.day || "today"}-${index}`,
            name: exercise.name,
            sets: exercise.sets || "",
            reps: exercise.reps || "",
            duration: exercise.duration || "",
            restBetweenSets: exercise.restBetweenSets || "",
            notes: exercise.notes || "",
            completed: nextExerciseIds.includes(
              exercise._id?.toString() ||
                `${todaysWorkout?.day || "today"}-${index}`,
            ),
            completedAt: nextExerciseIds.includes(
              exercise._id?.toString() ||
                `${todaysWorkout?.day || "today"}-${index}`,
            )
              ? new Date().toISOString()
              : null,
          })),
      };

      setWorkoutLog(fallbackLog);
      setWorkoutAnalytics(
        buildLocalAnalytics(activeTimetable, {
          ...readLocalWorkoutHistory(activeTimetable._id),
          [currentDate]: fallbackLog,
        }),
      );
      writeLocalWorkoutHistory(activeTimetable._id, currentDate, fallbackLog);
      return;
    }
  }

  async function handleToggleExercise(exerciseId) {
    if (!exerciseId) return;
    if (isWorkoutSubmitted) return;

    const normalizedId = String(exerciseId);
    const nextIds = completedExerciseIds.includes(normalizedId)
      ? completedExerciseIds.filter((id) => id !== normalizedId)
      : [...completedExerciseIds, normalizedId];

    setCompletedExerciseIds(nextIds);
    await persistWorkoutDraft(nextIds);
  }

  async function handleCompleteWorkout() {
    if (!todaysWorkout || todaysWorkout.isRestDay) return;
    if (isWorkoutSubmitted) return;

    const nextIds = workoutExerciseIds.filter(Boolean);
    setCompletedExerciseIds(nextIds);
    await persistWorkoutDraft(nextIds);
  }

  async function handleSaveTimetable(timetableData) {
    try {
      setLoading(true);
      const res = await api.post("/timetables/create", timetableData);

      setActiveTimetable(res.data.timetable);
      setShowCreator(false);
      setMessage("Timetable created successfully!");
      await loadActiveTimetable();

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error creating timetable");
    } finally {
      setLoading(false);
    }
  }

  async function handleGetAIImprovements() {
    if (!activeTimetable) return;

    setLoadingAI(true);
    setMessage("");

    try {
      const res = await api.post(
        `/timetables/${activeTimetable._id}/ai-improve`,
      );

      setAiSuggestions(res.data.suggestions || []);
      setAiAssessment(res.data.overallAssessment || {});
      setMessage(
        res.data.aiSuccess
          ? "AI analysis complete!"
          : "Analysis complete (using fallback suggestions)",
      );

      // Refresh to get updated timetable with hasRequestedAI flag
      await loadActiveTimetable();

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Error getting AI improvements",
      );
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleSubmitCheckpoint(checkpointData) {
    if (!activeTimetable?._id) return;
    if (isWorkoutSubmitted) {
      setMessage("Workout log already submitted for this date.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLogSaving(true);
    setMessage("");

    try {
      const res = await api.post(
        `/timetables/${activeTimetable._id}/workout-log/submit`,
        {
          date: workoutLog?.date || getTodayDateString(),
          status: checkpointData.status,
          note: checkpointData.note,
          actualDuration: checkpointData.actualDuration,
          completedExerciseIds,
        },
      );

      setWorkoutLog(res.data.workoutLog || null);
      setWorkoutAnalytics(res.data.analytics || null);
      setDraftStatus(res.data.workoutLog?.status || checkpointData.status);
      setWorkoutApiAvailable(activeTimetable._id, true);
      writeLocalWorkoutHistory(
        activeTimetable._id,
        res.data.workoutLog?.date || getTodayDateString(),
        res.data.workoutLog,
      );

      setMessage(res.data.message || "Workout log saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage(
          err.response?.data?.message || "Workout log already submitted",
        );
        setTimeout(() => setMessage(""), 3000);
        return;
      }
      console.warn("Server checkpoint save failed, saving to local history:", err);

      const fallbackDate = workoutLog?.date || getTodayDateString();
      const fallbackLog = {
        ...(workoutLog || {}),
        date: fallbackDate,
        scheduledDay: workoutLog?.scheduledDay || todaysWorkout?.day || "Today",
        focusArea: workoutLog?.focusArea || todaysWorkout?.focusArea || "",
        status: checkpointData.status,
        actualDuration: checkpointData.actualDuration,
        completedExerciseIds,
        completedExercises: completedExerciseIds.length,
        completionPercentage:
          todaysWorkout?.exercises?.length > 0
            ? Math.round(
                (completedExerciseIds.length / todaysWorkout.exercises.length) *
                  100,
              )
            : 0,
        totalExercises: todaysWorkout?.exercises?.length || 0,
        checkpoint: {
          submitted: true,
          note: checkpointData.note,
          submittedAt: new Date().toISOString(),
        },
        exerciseEntries:
          workoutLog?.exerciseEntries ||
          (todaysWorkout?.exercises || []).map((exercise, index) => ({
            exerciseId:
              exercise._id?.toString() ||
              `${todaysWorkout?.day || "today"}-${index}`,
            name: exercise.name,
            sets: exercise.sets || "",
            reps: exercise.reps || "",
            duration: exercise.duration || "",
            restBetweenSets: exercise.restBetweenSets || "",
            notes: exercise.notes || "",
            completed: completedExerciseIds.includes(
              exercise._id?.toString() ||
                `${todaysWorkout?.day || "today"}-${index}`,
            ),
            completedAt: completedExerciseIds.includes(
              exercise._id?.toString() ||
                `${todaysWorkout?.day || "today"}-${index}`,
            )
              ? new Date().toISOString()
              : null,
          })),
      };
      writeLocalWorkoutHistory(activeTimetable._id, fallbackDate, fallbackLog);
      setWorkoutLog(fallbackLog);
      setWorkoutAnalytics(
        buildLocalAnalytics(
          activeTimetable,
          readLocalWorkoutHistory(activeTimetable._id),
        ),
      );
    } finally {
      setLogSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !activeTimetable ||
      !confirm("Are you sure you want to delete this timetable?")
    )
      return;

    try {
      await api.delete(`/timetables/${activeTimetable._id}`);

      // ✅ ADDED: Clear localStorage when timetable is deleted
      if (activeTimetable._id) {
        localStorage.removeItem(`timetable_decisions_${activeTimetable._id}`);
      }

      setActiveTimetable(null);
      setTodaysWorkout(null);
      setAiSuggestions(null);
      setAiAssessment(null);
      setWorkoutLog(null);
      setWorkoutAnalytics(null);
      setCompletedExerciseIds([]);
      setDraftNote("");
      setDraftDuration(0);
      setDraftStatus("partial");
      setShowCreator(true);
      setMessage("Timetable deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error deleting timetable");
    }
  }

  function handleEditTimetable() {
    setShowCreator(true);
  }

  if (loading && !activeTimetable) {
    return (
      <div className={styles.root}>
        {/* Header skeleton */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Skeleton height="64px" width="64px" variant="rect" />
            <div className={styles.skeletonHeaderText}>
              <Skeleton height="32px" width="260px" variant="rect" />
              <Skeleton height="18px" width="200px" variant="rounded" />
            </div>
          </div>
          <div className={styles.skeletonHeaderActions}>
            <Skeleton height="44px" width="160px" variant="rect" />
            <Skeleton height="44px" width="140px" variant="rect" />
          </div>
        </div>

        {/* Day cards grid skeleton */}
        <div className={styles.skeletonDayGrid}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.skeletonDayCard}>
              <Skeleton height="22px" width="70%" variant="rect" />
              <div className={styles.skeletonExerciseList}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className={styles.skeletonExerciseItem}>
                    <Skeleton height="16px" width="65%" variant="rounded" />
                    <Skeleton height="16px" width="40px" variant="rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Analytics panel skeleton */}
        <div className={styles.skeletonAnalyticsSection}>
          <div className={styles.skeletonMetricsRow}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonMetricCard}>
                <Skeleton height="14px" width="80%" variant="rounded" />
                <Skeleton height="36px" width="60%" variant="rect" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Dumbbell className={styles.icon} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Workout Timetable</h2>
            <p className={styles.subtitle}>
              {showCreator
                ? "Create your personalized workout schedule"
                : "Your weekly workout plan"}
            </p>
          </div>
        </div>

        {activeTimetable && !showCreator && (
          <div className={styles.headerActions}>
            {!activeTimetable.hasRequestedAI && (
              <button
                className={styles.aiBtn}
                onClick={handleGetAIImprovements}
                disabled={loadingAI}
              >
                {loadingAI ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className={styles.btnIcon} />
                    <span>AI Improve</span>
                  </>
                )}
              </button>
            )}
            <button className={styles.editBtn} onClick={handleEditTimetable}>
              <Edit className={styles.btnIcon} />
              <span>Edit</span>
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 className={styles.btnIcon} />
            </button>
          </div>
        )}

        {!activeTimetable && (
          <button
            className={styles.createBtn}
            onClick={() => setShowCreator(true)}
          >
            <Plus className={styles.btnIcon} />
            <span>Create Timetable</span>
          </button>
        )}
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={styles.messageBox}>
          <Sparkles className={styles.messageIcon} />
          <p>{message}</p>
        </div>
      )}

      {/* CREATOR MODE */}
      {/* CREATOR MODE */}
      {showCreator && (
        <>
          <AITimetableGenerator
            onGenerated={(generatedTimetable) => {
              handleSaveTimetable(generatedTimetable);
            }}
          />

          <TimetableCreator
            onSave={handleSaveTimetable}
            onCancel={() => {
              setShowCreator(false);

              if (!activeTimetable) {
                loadActiveTimetable();
              }
            }}
            initialData={activeTimetable}
          />
        </>
      )}

      {/* VIEW MODE */}
      {!showCreator && activeTimetable && (
        <>
          {/* TIMETABLE INFO */}
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <Target className={styles.infoIcon} />
              <h3 className={styles.infoTitle}>{activeTimetable.name}</h3>
            </div>
            <div className={styles.infoDetails}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Category:</span>
                <span className={styles.infoValue}>
                  {activeTimetable.category.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Goal:</span>
                <span className={styles.infoValue}>
                  {activeTimetable.goal.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Level:</span>
                <span className={styles.infoValue}>
                  {activeTimetable.level.toUpperCase()}
                </span>
              </div>
              {activeTimetable.sportsMode?.enabled && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Sport:</span>
                  <span className={styles.infoValue}>
                    {activeTimetable.sportsMode.sport
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI IMPROVEMENTS */}
          {activeTimetable.hasRequestedAI &&
            aiSuggestions &&
            aiSuggestions.length > 0 && (
              <AIImprovements
                suggestions={aiSuggestions}
                assessment={aiAssessment}
                currentSchedule={activeTimetable.weeklySchedule}
                timetableId={activeTimetable._id}
                onApplySuggestion={(suggestion) => {
                  console.log("Applied suggestion:", suggestion);
                }}
                onRejectSuggestion={(suggestion) => {
                  console.log("Rejected suggestion:", suggestion);
                }}
              />
            )}

          {/* TODAY'S WORKOUT */}
          {todaysWorkout && (
            <TodaysWorkout
              workout={todaysWorkout}
              completedExerciseIds={completedExerciseIds}
              completionPercentage={workoutCompletionPercentage}
              onToggleExercise={handleToggleExercise}
              onCompleteWorkout={handleCompleteWorkout}
            />
          )}

          {/* CHECKPOINTS */}
          <TimetableCheckpointPanel
            workoutLog={workoutLog}
            workout={todaysWorkout}
            analytics={workoutAnalytics}
            loading={logSaving || logLoading}
            submitted={isWorkoutSubmitted}
            completedExerciseIds={completedExerciseIds}
            completionPercentage={workoutCompletionPercentage}
            draftStatus={draftStatus}
            draftNote={draftNote}
            draftDuration={draftDuration}
            onStatusChange={setDraftStatus}
            onNoteChange={setDraftNote}
            onDurationChange={setDraftDuration}
            onSubmit={handleSubmitCheckpoint}
          />

          {/* ANALYTICS */}
          <TimetableAnalyticsPanel
            analytics={workoutAnalytics}
            loading={logLoading}
          />

          {/* WEEKLY SCHEDULE */}
          <WeeklySchedule
            schedule={activeTimetable.weeklySchedule}
            goal={activeTimetable.goal}
            level={activeTimetable.level}
            timeAvailable={activeTimetable.timeAvailable || 60}
            checkpointStatusByDay={workoutAnalytics?.latestStatusByDay || {}}
          />

          {/* CTA FOR AI IMPROVEMENT */}
          {!activeTimetable.hasRequestedAI && (
            <div className={styles.aiCTA}>
              <div className={styles.ctaIcon}>
                <Lightbulb />
              </div>
              <div className={styles.ctaContent}>
                <h4 className={styles.ctaTitle}>
                  Get AI-Powered Improvement Suggestions
                </h4>
                <p className={styles.ctaText}>
                  Let our AI analyze your workout plan and provide personalized
                  recommendations to optimize your training for better results.
                </p>
                <button
                  className={styles.ctaButton}
                  onClick={handleGetAIImprovements}
                  disabled={loadingAI}
                >
                  {loadingAI ? (
                    <>
                      <div className={styles.btnSpinner}></div>
                      <span>Analyzing Your Program...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className={styles.btnIcon} />
                      <span>Analyze & Improve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!showCreator && !activeTimetable && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Dumbbell />
          </div>
          <h3 className={styles.emptyTitle}>No Active Timetable</h3>
          <p className={styles.emptyText}>
            Create your first workout timetable to start tracking your fitness
            journey.
          </p>
          <button
            className={styles.emptyButton}
            onClick={() => setShowCreator(true)}
          >
            <Plus className={styles.btnIcon} />
            <span>Create Your First Timetable</span>
          </button>
        </div>
      )}
    </div>
  );
}
