import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import HabitCard from "../../components/HabitCard/HabitCard";
import RiskAlerts from "../../components/RiskAlerts/RiskAlerts";
import Recommendations from "../../components/Recommendations/Recommendations";
import AIChatDrawer from "../../components/AIChatDrawer/AIChatDrawer";
import { FaRobot } from "react-icons/fa";
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

  useEffect(() => {
    fetchHabits();
    fetchAnalytics();
    fetchAIInsights();
  }, []);

  async function fetchHabits() {
    try {
      setLoading(true);
      const res = await api.get("/habits/all");
      setHabits(res.data?.habits || []);
    } catch (err) {
      setError("Failed to fetch habits");
    } finally {
      setLoading(false);
    }
  }

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
    try {
      const payload = {
        date: formatDateISO(new Date()),
        status: done ? "done" : "missed",
      };
      await api.post(`/habits/${habitId}/log`, payload);
      await fetchHabits();
      await fetchAnalytics();
      await fetchAIInsights();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  }

  async function deleteHabit(habitId) {
    try {
      await api.delete(`/habits/${habitId}`);

      // Refresh dashboard after deletion
      await fetchHabits();
      await fetchAnalytics();
      await fetchAIInsights();
    } catch (err) {
      console.error("Delete failed", err);
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
          <h1 className={styles.headerTitle}>Dashboard</h1>
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
