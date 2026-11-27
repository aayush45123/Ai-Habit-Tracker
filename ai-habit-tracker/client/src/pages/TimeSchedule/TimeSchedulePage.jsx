import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiClock,
  FiCalendar,
  FiPlus,
  FiSliders,
  FiCopy,
  FiCheckCircle,
  FiActivity,
  FiTrendingUp,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheckSquare,
  FiTrash2,
  FiSearch,
} from "react-icons/fi";
import api from "../../utils/api";
import styles from "./TimeSchedulePage.module.css";
import DailyTimelineView from "../../components/TimeSchedule/DailyTimelineView";
import WeeklyGridView from "../../components/TimeSchedule/WeeklyGridView";
import MonthlyCalendarView from "../../components/TimeSchedule/MonthlyCalendarView";
import EventModal from "../../components/TimeSchedule/EventModal";
import PresetModal from "../../components/TimeSchedule/PresetModal";
import CloneDayModal from "../../components/TimeSchedule/CloneDayModal";
import LiveReminderBanner from "../../components/TimeSchedule/LiveReminderBanner";
import {
  formatDateISO,
  formatDisplayDate,
  playChimeSound,
} from "../../utils/dateHelpers";

// Local storage cache keys
const CACHE_KEY_PREFIX = "habit_time_timetable_";

function getCachedSchedule(date) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${date}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Could not read the cached timetable:", error);
    return null;
  }
}

function setCachedSchedule(date, events) {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${date}`, JSON.stringify(events));
  } catch (error) {
    console.warn("Could not cache the timetable:", error);
  }
}

export default function TimeSchedulePage() {
  const todayStr = formatDateISO();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeView, setActiveView] = useState("timeline"); // "timeline" | "weekly" | "monthly"

  // Data states
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyCounts, setMonthlyCounts] = useState({});
  const [weekEvents, setWeekEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Unscheduled Backlog & Sidebar state (Reclaim style)
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [newBacklogTitle, setNewBacklogTitle] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [syncingWorkout, setSyncingWorkout] = useState(false);

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Reminder tracking ref to prevent duplicate chimes
  const alertedEventIdsRef = useRef(new Set());
  const dayRequestIdRef = useRef(0);
  const weekRequestIdRef = useRef(0);
  const monthRequestIdRef = useRef(0);
  const [dataError, setDataError] = useState("");
  const [eventRequestError, setEventRequestError] = useState("");
  const [weekError, setWeekError] = useState("");
  const [monthError, setMonthError] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(""), 4000);
  };

  /**
   * Fetch events for selected day & summary
   */
  const fetchDayData = useCallback(async (date) => {
    const requestId = ++dayRequestIdRef.current;
    try {
      setLoading(true);
      setDataError("");
      setSummary(null);

      // Try local cache first for instant display
      const cached = getCachedSchedule(date);
      if (Array.isArray(cached)) {
        setEvents(cached);
      }

      // Fetch summary, day events & unscheduled backlog tasks
      const [summaryRes, eventsRes, unscheduledRes] = await Promise.allSettled([
        api.get(`/schedule/summary?date=${date}`),
        api.get(`/schedule?date=${date}`),
        api.get(`/schedule?isUnscheduled=true`),
      ]);

      if (requestId !== dayRequestIdRef.current) return;

      const failures = [];
      if (eventsRes.status === "fulfilled" && eventsRes.value.data.success) {
        const fetched = eventsRes.value.data.events || [];
        setEvents(fetched);
        setCachedSchedule(date, fetched);
      } else {
        failures.push("Could not refresh scheduled events.");
      }

      if (unscheduledRes.status === "fulfilled" && unscheduledRes.value.data.success) {
        setUnscheduledTasks(unscheduledRes.value.data.events || []);
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value.data.success) {
        setSummary(summaryRes.value.data);
      } else {
        failures.push("Could not refresh timetable summary.");
      }
      setDataError(failures.join(" "));
    } catch (err) {
      console.error("Could not load timetable data:", err);
      if (requestId === dayRequestIdRef.current) {
        setDataError("Could not load timetable data. Please try again.");
      }
    } finally {
      if (requestId === dayRequestIdRef.current) setLoading(false);
    }
  }, []);

  /**
   * Fetch month counts for monthly calendar view
   */
  const fetchMonthlyData = useCallback(async (date) => {
    const requestId = ++monthRequestIdRef.current;
    setMonthlyCounts({});
    setMonthError("");
    try {
      const monthStr = date.slice(0, 7); // YYYY-MM
      const res = await api.get(`/schedule/monthly-counts?month=${monthStr}`);
      if (requestId !== monthRequestIdRef.current) return;
      if (res.data.success) {
        setMonthlyCounts(res.data.countsByDate || {});
      } else {
        setMonthError("Could not load monthly timetable counts.");
      }
    } catch (err) {
      console.error("Could not load monthly counts:", err);
      if (requestId === monthRequestIdRef.current) {
        setMonthError("Could not load monthly timetable counts.");
      }
    }
  }, []);

  /**
   * Fetch weekly events for grid view
   */
  const fetchWeekData = useCallback(async (date) => {
    const requestId = ++weekRequestIdRef.current;
    setWeekEvents([]);
    setWeekError("");
    try {
      // Calculate current week range
      const [y, m, d] = date.split("-").map(Number);
      const target = new Date(y, m - 1, d);
      const dayOfWeek = target.getDay();
      const distToMonday = (dayOfWeek + 6) % 7;

      const monday = new Date(target);
      monday.setDate(target.getDate() - distToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startDate = formatDateISO(monday);
      const endDate = formatDateISO(sunday);

      const res = await api.get(`/schedule?startDate=${startDate}&endDate=${endDate}`);
      if (requestId !== weekRequestIdRef.current) return;
      if (res.data.success) {
        setWeekEvents(res.data.events || []);
      } else {
        setWeekError("Could not load weekly timetable events.");
      }
    } catch (err) {
      console.error("Could not load weekly events:", err);
      if (requestId === weekRequestIdRef.current) {
        setWeekError("Could not load weekly timetable events.");
      }
    }
  }, []);

  // Initial & date changes
  useEffect(() => {
    fetchDayData(selectedDate);
    fetchMonthlyData(selectedDate);
    fetchWeekData(selectedDate);
  }, [selectedDate, fetchDayData, fetchMonthlyData, fetchWeekData]);

  // Periodic Reminder / Chime Checker (Every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const isToday = selectedDate === formatDateISO();

      if (!isToday || !events.length) return;

      const soundEnabled = localStorage.getItem("schedule_sound_chime") !== "false";

      for (const ev of events) {
        if (ev.status === "completed" || ev.status === "cancelled") continue;

        const reminderOffset = ev.reminderMinutesBefore || 0;
        const triggerTime = ev.startMinutes - reminderOffset;

        // Check if within 1-minute window and not yet alerted
        if (
          currentMins >= triggerTime &&
          currentMins <= ev.startMinutes &&
          !alertedEventIdsRef.current.has(ev._id)
        ) {
          alertedEventIdsRef.current.add(ev._id);

          if (soundEnabled) {
            playChimeSound();
          }

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Timetable Alert: ${ev.title}`, {
              body: `Scheduled from ${ev.startTime} to ${ev.endTime}. Get ready!`,
              icon: "/favicon.ico",
            });
          }

          showToast(`Reminder: "${ev.title}" starting at ${ev.startTime}`);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [events, selectedDate]);

  // Handle Quick Date Change
  const handleSelectToday = () => setSelectedDate(todayStr);
  const handleSelectTomorrow = () => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    setSelectedDate(formatDateISO(tm));
  };
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(formatDateISO(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(formatDateISO(next));
  };

  // CRUD Actions
  const handleSaveEvent = async (eventData, editId) => {
    setEventRequestError("");
    try {
      if (editId) {
        const res = await api.put(`/schedule/${editId}`, eventData);
        if (!res.data?.success) throw new Error("The schedule slot could not be updated.");
        showToast("Schedule slot updated successfully");
      } else {
        const res = await api.post("/schedule", eventData);
        if (!res.data?.success) throw new Error("The schedule slot could not be added.");
        showToast(
          res.data.hasConflict
            ? "Slot added with a time overlap. Review the conflict warning."
            : "Time slot added to timetable",
        );
      }

      setIsEventModalOpen(false);
      setEditingEvent(null);
      await fetchDayData(selectedDate);
      await fetchWeekData(selectedDate);
      await fetchMonthlyData(selectedDate);
    } catch (err) {
      console.error("Save error:", err);
      setEventRequestError(
        err.response?.data?.message || err.message || "Could not save this time slot.",
      );
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/schedule/${id}/status`, {});
      if (!res.data?.success) throw new Error("Could not update task status.");
      showToast(res.data.message);
      await fetchDayData(selectedDate);
      await fetchWeekData(selectedDate);
      await fetchMonthlyData(selectedDate);
    } catch (err) {
      console.error("Status update error:", err);
      showToast(err.response?.data?.message || "Could not update task status.");
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to remove this scheduled slot?")) {
      return;
    }

    try {
      const res = await api.delete(`/schedule/${id}`);
      if (!res.data?.success) throw new Error("Could not remove this time slot.");
      showToast("Schedule slot removed");
      setEventRequestError("");
      setIsEventModalOpen(false);
      setEditingEvent(null);
      await fetchDayData(selectedDate);
      await fetchWeekData(selectedDate);
      await fetchMonthlyData(selectedDate);
    } catch (err) {
      console.error("Delete error:", err);
      setEventRequestError(
        err.response?.data?.message || "Could not remove this time slot.",
      );
      showToast(err.response?.data?.message || "Could not remove this time slot.");
    }
  };

  const handleApplyPreset = async (presetKey, targetDate, clearExisting) => {
    try {
      const res = await api.post("/schedule/apply-preset", {
        presetKey,
        targetDate,
        clearExisting,
      });
      if (!res.data?.success) throw new Error("Could not apply this template.");
      showToast(res.data.message);
      setIsPresetModalOpen(false);
      setSelectedDate(targetDate);
      await fetchDayData(targetDate);
      await fetchWeekData(targetDate);
      await fetchMonthlyData(targetDate);
    } catch (err) {
      console.error("Preset apply error", err);
      showToast("Failed to apply preset routine");
    }
  };

  const handleCloneDay = async (sourceDate, targetDate) => {
    try {
      const res = await api.post("/schedule/clone-day", {
        sourceDate,
        targetDate,
      });
      if (!res.data?.success) throw new Error("Could not copy this day.");
      showToast(res.data.message);
      setIsCloneModalOpen(false);
      setSelectedDate(targetDate);
      await fetchDayData(targetDate);
      await fetchWeekData(targetDate);
      await fetchMonthlyData(targetDate);
    } catch (err) {
      console.error("Clone day error", err);
      showToast("Could not copy day timetable");
    }
  };

  const handleSyncWorkout = async () => {
    try {
      setSyncingWorkout(true);
      const res = await api.post("/schedule/sync-workout", { date: selectedDate });
      if (res.data?.success) {
        showToast(res.data.message || "Today's workout synced to Daily Planner!");
        await fetchDayData(selectedDate);
        await fetchWeekData(selectedDate);
      } else {
        showToast(res.data?.message || "Could not sync workout.");
      }
    } catch (err) {
      console.error("Sync workout error", err);
      showToast(err.response?.data?.message || "Workout sync failed.");
    } finally {
      setSyncingWorkout(false);
    }
  };

  const handleAddBacklogTask = async (e) => {
    e.preventDefault();
    if (!newBacklogTitle.trim()) return;
    try {
      const res = await api.post("/schedule", {
        title: newBacklogTitle.trim(),
        date: selectedDate,
        isTask: true,
        isUnscheduled: true,
        startTime: "00:00",
        endTime: "00:30",
        category: "work",
        priority: "medium",
      });
      if (res.data?.success) {
        setNewBacklogTitle("");
        showToast("Task added to unscheduled backlog");
        await fetchDayData(selectedDate);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Could not add task to backlog.");
    }
  };

  const handleScheduleBacklogTask = (task) => {
    setEditingEvent({
      ...task,
      isUnscheduled: false,
      isTask: true,
      startTime: task.startTime && task.startTime !== "00:00" ? task.startTime : "09:00",
      endTime: task.endTime && task.endTime !== "00:00" ? task.endTime : "09:30",
    });
    setEventRequestError("");
    setIsEventModalOpen(true);
  };

  // Filter events for display
  const filteredEvents = events.filter((ev) => {
    if (categoryFilter !== "all" && ev.category !== categoryFilter) return false;
    if (statusFilter !== "all" && ev.status !== statusFilter) return false;
    return true;
  });

  // Calculate quick metrics for current view
  const totalEvents = events.length;
  const completedCount = events.filter((e) => e.status === "completed").length;
  const pendingCount = totalEvents - completedCount;
  const totalMinutes = events.reduce(
    (acc, cur) => acc + Math.max(0, cur.endMinutes - cur.startMinutes),
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completionRate =
    totalEvents > 0 ? Math.round((completedCount / totalEvents) * 100) : 0;

  return (
    <div className={styles.root} aria-busy={loading}>
      {/* ── TOAST ALERT ── */}
      {toastMessage && (
        <div className={styles.toastNotice}>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <FiCalendar size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Daily Planner</h1>
            <p className={styles.subtitle}>
              Schedule time blocks, track priority tasks, manage your backlog, and synchronize your daily workouts.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.actionBtnPrimary}
            onClick={() => {
              setEditingEvent(null);
              setEventRequestError("");
              setIsEventModalOpen(true);
            }}
          >
            <FiPlus size={18} />
            <span>Add Event / Task</span>
          </button>

          <button
            className={styles.actionBtnSecondary}
            onClick={handleSyncWorkout}
            disabled={syncingWorkout}
            title="Import scheduled workout into today's timeline"
          >
            <FiActivity size={16} />
            <span>{syncingWorkout ? "Syncing..." : "Sync Workout"}</span>
          </button>

          <button
            className={styles.actionBtnSecondary}
            onClick={() => setIsPresetModalOpen(true)}
          >
            <FiSliders size={16} />
            <span>Daily Routines</span>
          </button>

          <button
            className={styles.actionBtnSecondary}
            onClick={() => setIsCloneModalOpen(true)}
          >
            <FiCopy size={16} />
            <span>Duplicate Day</span>
          </button>
        </div>
      </div>

      {/* ── LIVE REMINDER BANNER ── */}
      <LiveReminderBanner
        activeEvent={summary?.activeEvent}
        nextUpcomingEvent={summary?.nextUpcomingEvent}
        onToggleStatus={handleToggleStatus}
      />

      {dataError && (
        <div className={styles.errorNotice} role="alert">
          <span>{dataError}</span>
          <button type="button" onClick={() => fetchDayData(selectedDate)}>
            Retry
          </button>
        </div>
      )}
      {loading && (
        <div className={styles.loadingState} role="status" aria-live="polite">
          Updating timetable…
        </div>
      )}

      {/* ── METRICS SUMMARY ROW ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            <FiClock size={22} /> {totalEvents}
          </span>
          <span className={styles.statLabel}>Scheduled Slots</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            <FiCheckCircle size={22} /> {completedCount}
          </span>
          <span className={styles.statLabel}>Completed Tasks</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            <FiActivity size={22} /> {totalHours}h
          </span>
          <span className={styles.statLabel}>Total Planned Time</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>
            <FiTrendingUp size={22} /> {completionRate}%
          </span>
          <span className={styles.statLabel}>Timetable Completion</span>
        </div>
      </div>

      {/* ── CONTROLS & VIEWS ROW ── */}
      <div className={styles.controlsRow}>
        <div className={styles.dateNavGroup}>
          <button className={styles.dateQuickBtn} onClick={handlePrevDay} title="Previous Day">
            <FiChevronLeft size={16} />
          </button>

          <button
            className={`${styles.dateQuickBtn} ${
              selectedDate === todayStr ? styles.dateQuickBtnActive : ""
            }`}
            onClick={handleSelectToday}
          >
            Today
          </button>

          <button className={styles.dateQuickBtn} onClick={handleSelectTomorrow}>
            Tomorrow
          </button>

          <button className={styles.dateQuickBtn} onClick={handleNextDay} title="Next Day">
            <FiChevronRight size={16} />
          </button>

          <input
            type="date"
            className={styles.datePickerInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <span className={styles.selectedDateLabel}>
            {formatDisplayDate(selectedDate)}
          </span>
        </div>

        <div className={styles.viewSwitcher}>
          <button
            className={`${styles.viewBtn} ${
              activeView === "timeline" ? styles.viewBtnActive : ""
            }`}
            onClick={() => setActiveView("timeline")}
          >
            <FiList size={16} />
            <span>Timeline</span>
          </button>

          <button
            className={`${styles.viewBtn} ${
              activeView === "weekly" ? styles.viewBtnActive : ""
            }`}
            onClick={() => setActiveView("weekly")}
          >
            <FiGrid size={16} />
            <span>Weekly</span>
          </button>

          <button
            className={`${styles.viewBtn} ${
              activeView === "monthly" ? styles.viewBtnActive : ""
            }`}
            onClick={() => setActiveView("monthly")}
          >
            <FiCalendar size={16} />
            <span>Monthly</span>
          </button>
        </div>
      </div>

      {/* ── CATEGORY TIME ALLOCATION BAR (Reclaim-style Monochrome) ── */}
      {(() => {
        const sourceEvents = activeView === "weekly" ? weekEvents : events;
        const catTotals = {};
        let totalAllocatedMins = 0;
        for (const ev of sourceEvents) {
          const mins =
            typeof ev.startMinutes === "number" && typeof ev.endMinutes === "number"
              ? Math.max(0, ev.endMinutes - ev.startMinutes)
              : ev.plannedDurationMinutes || 30;
          const cat = ev.category || "other";
          catTotals[cat] = (catTotals[cat] || 0) + mins;
          totalAllocatedMins += mins;
        }
        const CAT_SHADES = {
          work: "#000000",
          study: "#2b2b2b",
          fitness: "#4a4a4a",
          meeting: "#6e6e6e",
          routine: "#919191",
          personal: "#b5b5b5",
          break: "#d4d4d4",
          other: "#e5e5e5",
        };
        const breakdown = Object.entries(catTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, mins]) => ({
            cat,
            pct: totalAllocatedMins > 0 ? Math.round((mins / totalAllocatedMins) * 100) : 0,
            color: CAT_SHADES[cat] || "#737373",
          }))
          .filter((item) => item.pct > 0);

        if (breakdown.length === 0) return null;

        return (
          <div className={styles.allocationCard}>
            <div className={styles.allocationLegend}>
              {breakdown.map((item) => (
                <span key={item.cat} className={styles.allocationLegendItem}>
                  <span
                    className={styles.allocationDot}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={styles.allocationCatName}>{item.cat}</span>
                  <span className={styles.allocationPct}>{item.pct}%</span>
                </span>
              ))}
            </div>
            <div className={styles.allocationBarTrack}>
              {breakdown.map((item) => (
                <div
                  key={item.cat}
                  className={styles.allocationBarSegment}
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  title={`${item.cat}: ${item.pct}%`}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── FILTERS (Available in Timeline View) ── */}
      {activeView === "timeline" && (
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Filter by:</span>

          {["all", "work", "study", "fitness", "meeting", "routine", "personal", "break"].map(
            (cat) => (
              <button
                key={cat}
                className={`${styles.filterChip} ${
                  categoryFilter === cat ? styles.filterChipActive : ""
                }`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.toUpperCase()}
              </button>
            )
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}>
            {["all", "pending", "completed"].map((st) => (
              <button
                key={st}
                className={`${styles.filterChip} ${
                  statusFilter === st ? styles.filterChipActive : ""
                }`}
                onClick={() => setStatusFilter(st)}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN VIEW CONTENT (Split Calendar + Sidebar on Timeline & Weekly) ── */}
      {(activeView === "timeline" || activeView === "weekly") && (
        <div className={styles.plannerLayout}>
          <div className={styles.timelineMain}>
            {activeView === "timeline" && (
              <DailyTimelineView
                events={filteredEvents}
                selectedDate={selectedDate}
                onEditEvent={(event) => {
                  setEventRequestError("");
                  setEditingEvent(event);
                  setIsEventModalOpen(true);
                }}
                onDeleteEvent={handleDeleteEvent}
                onToggleStatus={handleToggleStatus}
                onOpenAddModal={() => {
                  setEditingEvent(null);
                  setEventRequestError("");
                  setIsEventModalOpen(true);
                }}
                onOpenPresetModal={() => setIsPresetModalOpen(true)}
                onOpenCloneModal={() => setIsCloneModalOpen(true)}
                hasAnyEvents={events.length > 0}
                onClearFilters={() => {
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
              />
            )}

            {activeView === "weekly" && weekError && (
              <div className={styles.errorNotice} role="alert">
                <span>{weekError}</span>
                <button type="button" onClick={() => fetchWeekData(selectedDate)}>
                  Retry
                </button>
              </div>
            )}

            {activeView === "weekly" && !weekError && (
              <WeeklyGridView
                weekEvents={weekEvents}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setActiveView("timeline");
                }}
                onEditEvent={(event) => {
                  setEventRequestError("");
                  setEditingEvent(event);
                  setIsEventModalOpen(true);
                }}
                onAddForDate={(date) => {
                  setSelectedDate(date);
                  setEditingEvent(null);
                  setEventRequestError("");
                  setIsEventModalOpen(true);
                }}
              />
            )}
          </div>

          {/* ── RIGHT SIDEBAR: SCHEDULED / UNSCHEDULED / DONE (Reclaim.ai style) ── */}
          {(() => {
            const q = sidebarSearch.trim().toLowerCase();
            const openTasks = unscheduledTasks.filter(
              (t) => t.status !== "completed" && (!q || t.title.toLowerCase().includes(q))
            );
            const doneTasks = [
              ...unscheduledTasks.filter((t) => t.status === "completed"),
              ...events.filter((e) => e.status === "completed"),
            ].filter((t) => !q || t.title.toLowerCase().includes(q));
            const scheduledThisWeek = (activeView === "weekly" ? weekEvents : events)
              .filter((e) => e.status !== "completed" && (!q || e.title.toLowerCase().includes(q)))
              .slice(0, 6);

            return (
              <aside className={styles.backlogPanel}>
                <div className={styles.sidebarSearchWrap}>
                  <FiSearch size={14} className={styles.sidebarSearchIcon} />
                  <input
                    type="text"
                    placeholder="Search tasks & slots..."
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className={styles.sidebarSearchInput}
                  />
                </div>

                {/* Scheduled this week / today */}
                <div className={styles.sidebarSection}>
                  <div className={styles.sidebarSectionHeader}>
                    <span className={styles.sidebarSectionTitle}>
                      {activeView === "weekly" ? "Scheduled this week" : "Scheduled today"}
                    </span>
                    <span className={styles.backlogBadge}>{scheduledThisWeek.length}</span>
                  </div>
                  {scheduledThisWeek.length === 0 ? (
                    <div className={styles.emptyBacklog}>No upcoming slots</div>
                  ) : (
                    <div className={styles.sidebarCompactList}>
                      {scheduledThisWeek.map((ev) => (
                        <button
                          type="button"
                          key={ev._id}
                          className={styles.sidebarCompactRow}
                          onClick={() => {
                            setEventRequestError("");
                            setEditingEvent(ev);
                            setIsEventModalOpen(true);
                          }}
                        >
                          <span className={styles.sidebarCompactTitle}>{ev.title}</span>
                          <span className={styles.sidebarCompactMeta}>{ev.startTime}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unscheduled Backlog */}
                <div className={styles.sidebarSection}>
                  <div className={styles.sidebarSectionHeader}>
                    <span className={styles.sidebarSectionTitle}>Unscheduled</span>
                    <span className={styles.backlogBadge}>{openTasks.length}</span>
                  </div>

                  <form onSubmit={handleAddBacklogTask} className={styles.backlogAddForm}>
                    <input
                      type="text"
                      placeholder="Add task to backlog..."
                      value={newBacklogTitle}
                      onChange={(e) => setNewBacklogTitle(e.target.value)}
                      className={styles.backlogInput}
                    />
                    <button type="submit" className={styles.backlogAddBtn} title="Add to Backlog">
                      <FiPlus size={16} />
                    </button>
                  </form>

                  <div className={styles.backlogList}>
                    {openTasks.length === 0 ? (
                      <div className={styles.emptyBacklog}>
                        No open backlog tasks.
                      </div>
                    ) : (
                      openTasks.map((task) => (
                        <div key={task._id} className={styles.backlogItem}>
                          <div className={styles.backlogItemTop}>
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => handleToggleStatus(task._id)}
                              className={styles.backlogCheckbox}
                              title="Mark as done"
                            />
                            <span className={styles.backlogItemTitle}>{task.title}</span>
                            <button
                              className={styles.deleteTaskBtn}
                              onClick={() => handleDeleteEvent(task._id)}
                              title="Delete task"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>

                          <div className={styles.backlogItemMeta}>
                            <div className={styles.backlogMetaLeft}>
                              <span>{task.priority || "Normal"}</span>
                              <span>•</span>
                              <span>{task.plannedDurationMinutes || 30}m</span>
                            </div>
                            <button
                              className={styles.scheduleTaskBtn}
                              onClick={() => handleScheduleBacklogTask(task)}
                              title="Assign a time block to this task"
                            >
                              <FiClock size={12} />
                              <span>Schedule</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Done Section */}
                <div className={styles.sidebarSection}>
                  <button
                    type="button"
                    className={styles.sidebarDoneToggle}
                    onClick={() => setShowDoneTasks((prev) => !prev)}
                  >
                    <span>Done ({doneTasks.length})</span>
                    <span>{showDoneTasks ? "Hide" : "Show"}</span>
                  </button>
                  {showDoneTasks && (
                    <div className={styles.sidebarCompactList}>
                      {doneTasks.length === 0 ? (
                        <div className={styles.emptyBacklog}>No completed items yet</div>
                      ) : (
                        doneTasks.map((task) => (
                          <div key={task._id} className={styles.backlogItemDoneRow}>
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleStatus(task._id)}
                              className={styles.backlogCheckbox}
                            />
                            <span className={styles.completedTaskTitle}>{task.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </aside>
            );
          })()}
        </div>
      )}

      {activeView === "monthly" && monthError && (
        <div className={styles.errorNotice} role="alert">
          <span>{monthError}</span>
          <button type="button" onClick={() => fetchMonthlyData(selectedDate)}>
            Retry
          </button>
        </div>
      )}

      {activeView === "monthly" && !monthError && (
        <MonthlyCalendarView
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setActiveView("timeline");
          }}
          monthlyCounts={monthlyCounts}
          onMonthChange={fetchMonthlyData}
        />
      )}

      {/* ── MODALS ── */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setEventRequestError("");
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate}
        editEvent={editingEvent}
        existingEvents={events}
        requestError={eventRequestError}
      />

      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onApplyPreset={handleApplyPreset}
        targetDate={selectedDate}
      />

      <CloneDayModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onCloneDay={handleCloneDay}
        currentSelectedDate={selectedDate}
      />
    </div>
  );
}

