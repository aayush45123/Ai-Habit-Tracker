import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import HabitCard from "../../components/HabitCard/HabitCard";
import RiskAlerts from "../../components/RiskAlerts/RiskAlerts";
import Recommendations from "../../components/Recommendations/Recommendations";
import AIChatDrawer from "../../components/AIChatDrawer/AIChatDrawer";
import { FaRobot, FaWifi } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";
import styles from "./Dashboard.module.css";

function formatDateISO(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weeklyData, setWeeklyData] = useState([]);
  const [weekChange, setWeekChange] = useState(0);

  // AI Insights
  const [ai, setAI] = useState(null);
  const [aiLoading, setAILoading] = useState(true);

  // Floating AI Chat
  const [chatOpen, setChatOpen] = useState(false);

  // Socket
  const { subscribe, isConnected } = useSocket();

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
    fetchAnalytics();
    fetchAIInsights();
  }, [fetchHabits]);

  // Real-time dashboard refresh via Socket.IO
  useEffect(() => {
    const unsubscribe = subscribe("dashboard:update", (data) => {
      console.log("⚡ dashboard:update received:", data);
      // Perform silent refresh of habits list without triggering full component reload
      fetchHabits(false);
      if (data?.type !== "habit:logged") {
        fetchAnalytics();
      }
    });
    return unsubscribe;
  }, [subscribe, fetchHabits]);

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

      // Refresh analytics in background silently
      fetchAnalytics();
    } catch (err) {
      console.error("Toggle failed", err);
      // Revert if request failed
      if (previousHabits) {
        setHabits(previousHabits);
      }
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

  return (
    <div className={styles.dashRoot}>
      {/* ── PAGE HEADER ── */}
      <header className={styles.dashHeader}>
        <div className={styles.headerLeft}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 className={styles.headerTitle}>Dashboard</h1>
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
            Track your daily habits, build powerful streaks, and transform your
            life one day at a time.
          </p>
        </div>
        <button
          className={styles.ctaBtn}
          onClick={() => (window.location.href = "/add")}
        >
          + Add Habit
        </button>
      </header>

      {/* ── STATS BAR ── */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{total}</span>
          <span className={styles.statLabel}>Total Habits</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard}>
          <span className={styles.statNum}>{completedToday}</span>
          <span className={styles.statLabel}>Done Today</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard}>
          <span className={styles.statNum}>{longestStreak}</span>
          <span className={styles.statLabel}>Longest Streak</span>
        </div>

        <div className={styles.statDivider} />

        <div className={styles.statCard}>
          <span
            className={`${styles.statNum} ${weekChange >= 0 ? styles.positive : styles.negative}`}
          >
            {weekChange > 0 ? "+" : ""}
            {weekChange}%
          </span>
          <span className={styles.statLabel}>Week Change</span>
        </div>

        <div className={styles.statDivider} />

        {/* Sparkline stat */}
        <div className={`${styles.statCard} ${styles.statSparkline}`}>
          <div className={styles.sparkTop}>
            <span className={styles.statNum}>{weeklyAvg}%</span>
            <svg viewBox="0 0 80 28" className={styles.spark}>
              <defs>
                <linearGradient id="sg" x1="0" x2="1">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              {weeklyData.length > 1 && (
                <polyline
                  fill="none"
                  stroke="url(#sg)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={weeklyData
                    .map(
                      (v, i) =>
                        `${(i / (weeklyData.length - 1)) * 76 + 2},${26 - (v / 100) * 22}`,
                    )
                    .join(" ")}
                />
              )}
            </svg>
          </div>
          <span className={styles.statLabel}>This Week</span>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className={styles.mainGrid}>
        {/* ── COLUMN 1: Today's Habits ── */}
        <section className={styles.habitsCol}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Today's Habits</h2>
              <span className={styles.panelBadge}>
                {completedToday}/{total}
              </span>
            </div>

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
              <div className={styles.muted}>Loading habits…</div>
            ) : habits.length === 0 ? (
              <div className={styles.empty}>
                <p>No habits yet.</p>
                <button
                  className={styles.secondary}
                  onClick={() => (window.location.href = "/add")}
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
          </div>
        </section>

        {/* ── COLUMN 2: Sidebar ── */}
        <aside className={styles.sidebarCol}>
          {/* Weekly Chart */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Weekly Completion</h2>
              <span className={styles.panelMeta}>Aim for 80%+</span>
            </div>
            <div className={styles.chartBox}>
              <svg
                viewBox="0 0 200 60"
                className={styles.bigSpark}
                preserveAspectRatio="none"
              >
                {weeklyData.length > 1 && (
                  <>
                    <defs>
                      <linearGradient
                        id="chartFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#60a5fa"
                          stopOpacity="0.2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#60a5fa"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <polygon
                      fill="url(#chartFill)"
                      points={[
                        ...weeklyData.map(
                          (v, i) =>
                            `${(i / (weeklyData.length - 1)) * 196 + 2},${58 - (v / 100) * 50}`,
                        ),
                        `${196 + 2},58`,
                        `2,58`,
                      ].join(" ")}
                    />
                    <polyline
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={weeklyData
                        .map(
                          (v, i) =>
                            `${(i / (weeklyData.length - 1)) * 196 + 2},${58 - (v / 100) * 50}`,
                        )
                        .join(" ")}
                    />
                  </>
                )}
                <line
                  x1="2"
                  y1="10"
                  x2="198"
                  y2="10"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
              </svg>
            </div>
            <div className={styles.chartLabels}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className={styles.chartDay}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>AI Insights</h2>
            </div>
            {aiLoading ? (
              <div className={styles.muted}>Analyzing your habits…</div>
            ) : !ai ? (
              <div className={styles.muted}>No insights available.</div>
            ) : (
              <div className={styles.shortAIBox}>{ai.shortSummary}</div>
            )}
          </div>

          {/* Risk Alerts — now a fixed-height carousel, fills remaining space */}
          <div className={styles.riskAlertsWrapper}>
            <RiskAlerts />
          </div>
        </aside>
      </div>

      {/* ── RECOMMENDATIONS (full-width below grid) ── */}
      <div className={styles.recommendationsSection}>
        <Recommendations />
      </div>

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
