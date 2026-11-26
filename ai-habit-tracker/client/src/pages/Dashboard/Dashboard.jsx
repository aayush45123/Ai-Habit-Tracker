import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import HabitCard from "../../components/HabitCard/HabitCard";
import RiskAlerts from "../../components/RiskAlerts/RiskAlerts";
import Recommendations from "../../components/Recommendations/Recommendations";
import AIChatDrawer from "../../components/AIChatDrawer/AIChatDrawer";
import AddHabitModal from "../../components/AddHabitModal/AddHabitModal";
import GamificationWidget from "../../components/GamificationWidget/GamificationWidget";
import { FaRobot, FaWifi } from "react-icons/fa";
import {
  FiCalendar,
  FiClock,
  FiCheckSquare,
  FiZap,
  FiTrendingUp,
  FiCpu,
} from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import styles from "./Dashboard.module.css";
import { DashboardSkeleton } from "../../components/Skeleton/Skeleton.jsx";

function formatDateISO(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weeklyData, setWeeklyData] = useState([]);
  const [weekChange, setWeekChange] = useState(0);

  // Unified Command Center Data
  const [unified, setUnified] = useState(null);

  // AI Insights
  const [ai, setAI] = useState(null);
  const [aiLoading, setAILoading] = useState(true);

  // Floating AI Chat
  const [chatOpen, setChatOpen] = useState(false);

  // Add Habit Modal
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Socket
  const { subscribe, isConnected } = useSocket();

  const fetchUnifiedDashboard = useCallback(async () => {
    try {
      const res = await api.get("/dashboard");
      if (res.data) {
        setUnified(res.data);
      }
    } catch (err) {
      console.error("Unified dashboard fetch error:", err);
    }
  }, []);

  const fetchHabits = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get("/habits/all");
      setHabits(res.data?.habits || []);
    } catch (err) {
      setError("Failed to fetch habits");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits(true);
    fetchUnifiedDashboard();
    fetchAnalytics();
    fetchAIInsights();
  }, [fetchHabits, fetchUnifiedDashboard]);

  // Real-time dashboard refresh via Socket.IO
  useEffect(() => {
    const unsubscribe = subscribe("dashboard:update", (data) => {
      // Perform silent refresh of habits list without triggering full component reload
      fetchHabits(false);
      fetchUnifiedDashboard();
      if (data?.type !== "habit:logged") {
        fetchAnalytics();
      }
    });
    return unsubscribe;
  }, [subscribe, fetchHabits, fetchUnifiedDashboard]);

  async function fetchAnalytics() {
    try {
      const res = await api.get("/habits/analytics/all");
      const raw = Object.values(res.data.weekly || {});
      const scaled = raw.map((v) => Math.min(100, v * 20));
      setWeeklyData(scaled);
      setWeekChange(res.data.weekChange || 0);
    } catch (err) {
      console.error("Analytics error", err);
    }
  }

  async function fetchAIInsights() {
    try {
      setAILoading(true);
      const res = await api.get("/ai/insights");
      setAI(res.data.ai);
    } catch (err) {
      console.error(err);
      setAI(null);
    } finally {
      setAILoading(false);
    }
  }

  async function toggleHabitDone(habitId, done) {
    const todayISO = formatDateISO(new Date());
    const newStatus = done ? "done" : "missed";
    let previousHabits;

    // Optimistically update the specific habit in state immediately
    setHabits((prev) => {
      previousHabits = prev;
      return prev.map((h) => {
        if (h._id !== habitId) return h;

        let newStreak = h.streak || 0;
        if (done) {
          if (h.lastStatus !== "done" || h.lastDate !== todayISO) {
            newStreak += 1;
          }
        } else {
          newStreak = Math.max(0, newStreak - 1);
        }

        return {
          ...h,
          lastDate: todayISO,
          lastStatus: newStatus,
          streak: newStreak,
          longestStreak: Math.max(h.longestStreak || 0, newStreak),
        };
      });
    });

    try {
      const payload = {
        date: todayISO,
        status: newStatus,
      };
      const res = await api.post(`/habits/${habitId}/log`, payload);

      // Reconcile with exact server streak counts if returned
      if (res.data && typeof res.data.currentStreak === "number") {
        setHabits((prev) =>
          prev.map((h) => {
            if (h._id !== habitId) return h;
            return {
              ...h,
              streak: res.data.currentStreak,
              longestStreak: res.data.longestStreak ?? h.longestStreak,
            };
          })
        );
      }

      // Refresh analytics & unified overview in background silently
      fetchAnalytics();
      fetchUnifiedDashboard();
    } catch (err) {
      console.error("Toggle failed", err);
      // Revert if request failed
      if (previousHabits) {
        setHabits(previousHabits);
      }
    }
  }

  async function toggleScheduleTask(taskId) {
    try {
      await api.patch(`/schedule/${taskId}/status`, {});
      fetchUnifiedDashboard();
    } catch (err) {
      console.error("Task toggle failed:", err);
    }
  }

  async function deleteHabit(habitId) {
    let previousHabits;
    setHabits((prev) => {
      previousHabits = prev;
      return prev.filter((h) => h._id !== habitId);
    });

    try {
      await api.delete(`/habits/${habitId}`);
      fetchAnalytics();
      fetchUnifiedDashboard();
      fetchAIInsights();
    } catch (err) {
      console.error("Delete failed", err);
      if (previousHabits) setHabits(previousHabits);
      alert(err.response?.data?.message || "Failed to delete habit");
    }
  }

  const total = habits.length;
  const completedToday = habits.filter(
    (h) => h.lastDate === formatDateISO() && h.lastStatus === "done",
  ).length;
  const longestStreak = Math.max(...habits.map((h) => h.longestStreak || 0), 0);
  const weeklyAvg = weeklyData.length
    ? Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length)
    : 0;

  // Derived Command Center Metrics
  const overview = unified?.overview || {};
  const tasksToday = overview.tasksToday || { completed: 0, total: 0 };
  const focusTime = overview.focusTime || { minutes: 0, sessions: 0 };
  const workoutInfo = overview.workout || { hasWorkout: false, isRestDay: false, isCompleted: false };
  const growthScore = overview.growthScore ?? weeklyAvg;

  const weeklyDays = unified?.weeklyProgress?.days || [];
  const maxBarValue = Math.max(
    10,
    ...weeklyDays.map((d) => Math.max(d.tasks || 0, d.habits || 0, Math.round((d.focusMinutes || 0) / 10)))
  );

  const todayEvents = unified?.todaySchedule?.events || [];
  const priorityTasks = unified?.priorityTasks || [];
  const aiBullets = unified?.aiInsights?.bullets || [];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.dashRoot}>
      {/* ── PAGE HEADER ── */}
      <header className={styles.dashHeader}>
        <div className={styles.headerLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 className={styles.headerTitle}>Personal Growth Command Center</h1>
            <span
              title={isConnected ? "Live updates active" : "Connecting..."}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: "20px",
                background: isConnected
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(156,163,175,0.15)",
                color: isConnected ? "#10b981" : "#9ca3af",
                border: `1px solid ${isConnected ? "rgba(16,185,129,0.3)" : "rgba(156,163,175,0.2)"}`,
                transition: "all 0.3s",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isConnected ? "#10b981" : "#9ca3af",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                }}
              />
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
          <p className={styles.headerSub}>
            Here's your unified personal growth and productivity overview for today.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondary}
            onClick={() => navigate("/schedule")}
          >
            Daily Planner
          </button>
          <button
            className={styles.ctaBtn}
            onClick={() => setAddModalOpen(true)}
          >
            + Add Habit
          </button>
        </div>
      </header>

      {/* ── UNIFIED STATS BAR (5 Command Cards - Image D style) ── */}
      <div className={styles.statsBar}>
        <div className={styles.statCard} onClick={() => navigate("/schedule")} style={{ cursor: "pointer" }}>
          <span className={styles.statNum}>{tasksToday.completed}/{tasksToday.total}</span>
          <span className={styles.statLabel}>Tasks Today</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard} onClick={() => navigate("/focus")} style={{ cursor: "pointer" }}>
          <span className={styles.statNum}>{focusTime.minutes}m</span>
          <span className={styles.statLabel}>Focus Time</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard}>
          <span className={styles.statNum}>{completedToday}/{total}</span>
          <span className={styles.statLabel}>Habits Done</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard} onClick={() => navigate("/timetable")} style={{ cursor: "pointer" }}>
          <span className={`${styles.statNum} ${workoutInfo.isCompleted ? styles.positive : ""}`}>
            {workoutInfo.isCompleted
              ? "Done"
              : workoutInfo.isRestDay
                ? "Rest"
                : workoutInfo.hasWorkout
                  ? "Pending"
                  : "—"}
          </span>
          <span className={styles.statLabel}>Workout</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard}>
          <span className={styles.statNum}>{growthScore}%</span>
          <span className={styles.statLabel}>Growth Score</span>
        </div>
      </div>

      {/* ── MIDDLE ROW: WEEKLY PROGRESS + AI INSIGHTS (Image D style) ── */}
      <div className={styles.commandMidGrid}>
        {/* Weekly Progress Multi-Metric Bar Chart */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Weekly Progress</h2>
            <div className={styles.barChartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendSwatchTasks} /> Tasks
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendSwatchHabits} /> Habits
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendSwatchFocus} /> Focus (10m)
              </span>
            </div>
          </div>
          {weeklyDays.length > 0 ? (
            <div className={styles.barChartContainer}>
              {weeklyDays.map((d) => {
                const tasksH = Math.min(100, Math.round(((d.tasks || 0) / maxBarValue) * 100));
                const habitsH = Math.min(100, Math.round(((d.habits || 0) / maxBarValue) * 100));
                const focusUnits = Math.round((d.focusMinutes || 0) / 10);
                const focusH = Math.min(100, Math.round((focusUnits / maxBarValue) * 100));
                return (
                  <div key={d.date} className={styles.barGroup} title={`${d.day}: ${d.tasks} tasks, ${d.habits} habits, ${d.focusMinutes}m focus`}>
                    <div className={styles.barsRow}>
                      <div className={styles.barTasks} style={{ height: `${Math.max(4, tasksH)}%` }} />
                      <div className={styles.barHabits} style={{ height: `${Math.max(4, habitsH)}%` }} />
                      <div className={styles.barFocus} style={{ height: `${Math.max(4, focusH)}%` }} />
                    </div>
                    <span className={styles.barDayLabel}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.muted} style={{ padding: "2rem", textAlign: "center" }}>
              Complete habits, tasks, or focus sprints to populate your 7-day progress chart.
            </div>
          )}
        </section>

        {/* AI Coach Insights */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>AI Coach Insights</h2>
            <button
              className={styles.secondary}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
              onClick={() => navigate("/ai")}
            >
              Open Coach
            </button>
          </div>
          {aiBullets.length > 0 ? (
            <ul className={styles.insightsList}>
              {aiBullets.map((bullet, idx) => (
                <li key={idx} className={styles.insightItem}>
                  <FiCpu size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : aiLoading ? (
            <div className={styles.muted}>Analyzing your activity…</div>
          ) : (
            <div className={styles.shortAIBox}>
              {ai?.shortSummary || "Keep logging your daily habits and journal entries to unlock personalized AI insights."}
            </div>
          )}
        </section>
      </div>

      {/* ── BOTTOM ROW: TODAY'S SCHEDULE + PRIORITY TASKS & HABITS (Image D style) ── */}
      <div className={styles.commandBottomGrid}>
        {/* Left: Today's Schedule */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Today's Schedule</h2>
            <button
              className={styles.secondary}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
              onClick={() => navigate("/schedule")}
            >
              Manage Planner
            </button>
          </div>
          {todayEvents.length === 0 ? (
            <div className={styles.empty}>
              <p>No time blocks scheduled for today.</p>
              <button className={styles.secondary} onClick={() => navigate("/schedule")}>
                Plan Your Day
              </button>
            </div>
          ) : (
            <div className={styles.scheduleList}>
              {todayEvents.map((ev) => {
                const isDone = ev.status === "completed";
                return (
                  <div key={ev._id} className={`${styles.scheduleRow} ${isDone ? styles.scheduleRowDone : ""}`}>
                    <span className={styles.scheduleTime}>{ev.startTime}</span>
                    <span className={`${styles.scheduleTitle} ${isDone ? styles.taskDoneText : ""}`}>
                      {ev.title}
                    </span>
                    <span className={styles.scheduleCategoryTag}>{ev.category}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Priority Tasks & Today's Habits */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Priority Tasks & Habits</h2>
            <span className={styles.panelBadge}>
              {completedToday + tasksToday.completed}/{total + tasksToday.total}
            </span>
          </div>

          {priorityTasks.length > 0 && (
            <div className={styles.taskChecklist}>
              {priorityTasks.map((task) => {
                const isDone = task.status === "completed";
                return (
                  <div key={task._id} className={styles.taskCheckRow}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleScheduleTask(task._id)}
                      className={styles.taskCheckbox}
                    />
                    <span className={`${styles.taskTitleText} ${isDone ? styles.taskDoneText : ""}`}>
                      {task.title}
                    </span>
                    <span className={styles.taskPriorityBadge}>{task.priority || "medium"}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress strip */}
          <div className={styles.progressStrip}>
            <div
              className={styles.progressFill}
              style={{
                width:
                  total > 0 ? `${(completedToday / total) * 100}%` : "0%",
              }}
            />
          </div>

          {loading ? (
            <div className={styles.muted} style={{ textAlign: "center", padding: "2rem" }}>Loading habits…</div>
          ) : habits.length === 0 ? (
            <div className={styles.empty}>
              <p>No habits yet.</p>
              <button
                className={styles.secondary}
                onClick={() => setAddModalOpen(true)}
              >
                Create first habit
              </button>
            </div>
          ) : (
            <div className={styles.habitList}>
              {habits.map((h) => (
                <HabitCard
                  key={h._id}
                  habit={h}
                  onToggle={(done) => toggleHabitDone(h._id, done)}
                  onDelete={() => deleteHabit(h._id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── GAMIFICATION PROGRESSION WIDGET ── */}
      <GamificationWidget />

      {/* ── RISK ALERTS & RECOMMENDATIONS ── */}
      <div className={styles.mainGrid}>
        <div className={styles.recommendationsSection}>
          <Recommendations />
        </div>
        <div className={styles.riskAlertsWrapper}>
          <RiskAlerts />
        </div>
      </div>

      {/* ── ADD HABIT MODAL ── */}
      <AddHabitModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(newHabits) => {
          // Optimistically prepend the newly created habits
          setHabits((prev) => [...newHabits, ...prev]);
          // Silently re-fetch from server to reconcile
          fetchHabits(false);
          fetchAnalytics();
          fetchUnifiedDashboard();
        }}
      />

      {/* ── FLOATING AI CHAT ── */}
      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      <button
        className={styles.floatingAI}
        onClick={() => setChatOpen(true)}
        title="Chat with AI Coach"
      >
        <FaRobot size={22} />
      </button>
    </div>
  );
}
