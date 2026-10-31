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
  timeToMinutes,
} from "../../utils/dateHelpers";

// Local storage cache keys
const CACHE_KEY_PREFIX = "habit_time_timetable_";

function getCachedSchedule(date) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${date}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedSchedule(date, events) {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${date}`, JSON.stringify(events));
  } catch {}
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

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Reminder tracking ref to prevent duplicate chimes
  const alertedEventIdsRef = useRef(new Set());

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  /**
   * Fetch events for selected day & summary
   */
  const fetchDayData = useCallback(async (date) => {
    try {
      setLoading(true);

      // Try local cache first for instant display
      const cached = getCachedSchedule(date);
      if (cached && cached.length) {
        setEvents(cached);
      }

      // Fetch summary & day events
      const [summaryRes, eventsRes] = await Promise.allSettled([
        api.get(`/schedule/summary?date=${date}`),
        api.get(`/schedule?date=${date}`),
      ]);

      if (eventsRes.status === "fulfilled" && eventsRes.value.data.success) {
        const fetched = eventsRes.value.data.events || [];
        setEvents(fetched);
        setCachedSchedule(date, fetched);
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value.data.success) {
        setSummary(summaryRes.value.data);
      }
    } catch (err) {
      console.warn("Using offline / local schedule data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch month counts for monthly calendar view
   */
  const fetchMonthlyData = useCallback(async (date) => {
    try {
      const monthStr = date.slice(0, 7); // YYYY-MM
      const res = await api.get(`/schedule/monthly-counts?month=${monthStr}`);
      if (res.data.success) {
        setMonthlyCounts(res.data.countsByDate || {});
      }
    } catch (err) {
      console.warn("Could not load monthly counts:", err);
    }
  }, []);

  /**
   * Fetch weekly events for grid view
   */
  const fetchWeekData = useCallback(async (date) => {
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
      if (res.data.success) {
        setWeekEvents(res.data.events || []);
      }
    } catch (err) {
      console.warn("Could not load weekly events:", err);
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

          showToast(`🔔 Reminder: "${ev.title}" starting at ${ev.startTime}`);
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
  const handleSelectYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    setSelectedDate(formatDateISO(yest));
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
    try {
      if (editId) {
        const res = await api.put(`/schedule/${editId}`, eventData);
        if (res.data.success) {
          showToast("Schedule slot updated successfully");
        }
      } else {
        const res = await api.post("/schedule", eventData);
        if (res.data.success) {
          showToast(
            res.data.hasConflict
              ? "Slot added (Note: Contains time overlap with an existing task)"
              : "Time slot added to timetable"
          );
        }
      }

      setIsEventModalOpen(false);
      setEditingEvent(null);
      await fetchDayData(selectedDate);
      await fetchWeekData(selectedDate);
      await fetchMonthlyData(selectedDate);
    } catch (err) {
      console.error("Save error:", err);
      // Fallback local save if server fails
      const currentList = [...events];
      if (editId) {
        const idx = currentList.findIndex((x) => x._id === editId);
        if (idx !== -1) {
          currentList[idx] = { ...currentList[idx], ...eventData };
        }
      } else {
        const localDoc = {
          ...eventData,
          _id: `local_${Date.now()}`,
          startMinutes: timeToMinutes(eventData.startTime),
          endMinutes: timeToMinutes(eventData.endTime),
          status: "pending",
        };
        currentList.push(localDoc);
      }
      currentList.sort((a, b) => a.startMinutes - b.startMinutes);
      setEvents(currentList);
      setCachedSchedule(selectedDate, currentList);
      setIsEventModalOpen(false);
      setEditingEvent(null);
      showToast("Saved to local timetable!");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/schedule/${id}/status`, {});
      if (res.data.success) {
        showToast(res.data.message);
      }
      await fetchDayData(selectedDate);
      await fetchWeekData(selectedDate);
      await fetchMonthlyData(selectedDate);
    } catch (err) {
      // Local toggle fallback
      const updated = events.map((ev) => {
        if (ev._id === id) {
          return {
            ...ev,
            status: ev.status === "completed" ? "pending" : "completed",
          };
        }
        return ev;
      });
      setEvents(updated);
      setCachedSchedule(selectedDate, updated);
      showToast("Status updated");
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to remove this scheduled slot?")) {
      return;
    }

    try {
      await api.delete(`/schedule/${id}`);
      showToast("Schedule slot removed");
      setIsEventModalOpen(false);
      setEditingEvent(null);
      await fetchDayData(selectedDate);
      await fetchWeekData(selectedDate);
      await fetchMonthlyData(selectedDate);
    } catch (err) {
      const filtered = events.filter((ev) => ev._id !== id);
      setEvents(filtered);
      setCachedSchedule(selectedDate, filtered);
      setIsEventModalOpen(false);
      setEditingEvent(null);
      showToast("Removed slot");
    }
  };

  const handleApplyPreset = async (presetKey, targetDate, clearExisting) => {
    try {
      const res = await api.post("/schedule/apply-preset", {
        presetKey,
        targetDate,
        clearExisting,
      });
      if (res.data.success) {
        showToast(res.data.message);
      }
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
      if (res.data.success) {
        showToast(res.data.message);
      }
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
    <div className={styles.root}>
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
            <FiClock size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Time Timetable</h1>
            <p className={styles.subtitle}>
              Schedule specific tasks day-by-day from start to end time with conflict detection and live reminders.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.actionBtnPrimary}
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
          >
            <FiPlus size={18} />
            <span>Add Time Slot</span>
          </button>

          <button
            className={styles.actionBtnSecondary}
            onClick={() => setIsPresetModalOpen(true)}
          >
            <FiSliders size={16} />
            <span>Daily Templates</span>
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

          <span style={{ fontSize: "0.9rem", fontWeight: 800, marginLeft: "0.5rem" }}>
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

      {/* ── MAIN VIEW CONTENT ── */}
      {activeView === "timeline" && (
        <DailyTimelineView
          events={filteredEvents}
          selectedDate={selectedDate}
          onEditEvent={(event) => {
            setEditingEvent(event);
            setIsEventModalOpen(true);
          }}
          onDeleteEvent={handleDeleteEvent}
          onToggleStatus={handleToggleStatus}
          onOpenAddModal={() => {
            setEditingEvent(null);
            setIsEventModalOpen(true);
          }}
          onOpenPresetModal={() => setIsPresetModalOpen(true)}
          onOpenCloneModal={() => setIsCloneModalOpen(true)}
        />
      )}

      {activeView === "weekly" && (
        <WeeklyGridView
          weekEvents={weekEvents}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setActiveView("timeline");
          }}
          onEditEvent={(event) => {
            setEditingEvent(event);
            setIsEventModalOpen(true);
          }}
          onAddForDate={(date) => {
            setSelectedDate(date);
            setEditingEvent(null);
            setIsEventModalOpen(true);
          }}
        />
      )}

      {activeView === "monthly" && (
        <MonthlyCalendarView
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setActiveView("timeline");
          }}
          monthlyCounts={monthlyCounts}
        />
      )}

      {/* ── MODALS ── */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate}
        editEvent={editingEvent}
        existingEvents={events}
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

