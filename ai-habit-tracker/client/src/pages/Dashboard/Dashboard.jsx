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

  const [ai, setAI] = useState(null);
  const [aiLoading, setAILoading] = useState(true);

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

  const total = habits.length;
  const completedToday = habits.filter(
    (h) => h.lastDate === formatDateISO() && h.lastStatus === "done",
  ).length;
  const longestStreak = Math.max(...habits.map((h) => h.longestStreak || 0), 0);
  const weekAvg = weeklyData.length
    ? Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length)
    : 0;

  return (
    <div className={styles.dashRoot}>
      {/* ── HEADER ── */}
      <header className={styles.dashHeader}>
        <div>
          <h1>Welcome Back</h1>
          <p className={styles.dashDescription}>
            Track daily habits · Build streaks · Transform your routine
          </p>
        </div>

        <div className={styles.dashHeaderRight}>
          <div className={`${styles.statCard} ${styles.statSmall}`}>
            <div className={styles.statLabel}>This week</div>
            <div className={styles.statValue}>{weekAvg}%</div>
            <div className={styles.sparklineContainer}>
              <svg viewBox="0 0 70 20" className={styles.spark}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#g1)"
                  strokeWidth="2"
                  points={weeklyData
                    .map((v, i) => `${i * 10 + 2},${20 - v / 6}`)
                    .join(" ")}
                />
              </svg>
            </div>
          </div>

          <button
            className={styles.ctaBtn}
            onClick={() => (window.location.href = "/add")}
          >
            + Add Habit
          </button>
        </div>
      </header>

      {/* ── METRICS STRIP ── */}
      <div className={styles.metricsStrip}>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>Total Habits</div>
          <div className={styles.metricCellNum}>{total}</div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>Completed Today</div>
          <div className={styles.metricCellNum}>{completedToday}</div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>Longest Streak</div>
          <div className={styles.metricCellNum}>{longestStreak}d</div>
        </div>
        <div className={styles.metricCell}>
          <div className={styles.metricCellLabel}>Week Change</div>
          <div className={styles.metricCellNum}>
            {weekChange > 0 ? "+" : ""}
            {weekChange}%
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className={styles.dashBody}>
        {/* LEFT — Today's Habits */}
        <section className={styles.leftCol}>
          <div className={styles.habitsSection}>
            <h3 className={styles.habitsSectionTitle}>Today's Habits</h3>

            {loading ? (
              <div className={styles.muted}>Loading habits…</div>
            ) : habits.length === 0 ? (
              <div className={styles.empty}>
                <p>No habits yet. Start building your routine.</p>
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
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — Sidebar panels */}
        <aside className={styles.rightCol}>
          {/* Risk Alerts */}
          <RiskAlerts />

          {/* Weekly Completion */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Weekly Completion</h3>
            <div className={styles.chartBox}>
              <svg viewBox="0 0 140 60" className={styles.bigSpark}>
                <polyline
                  fill="none"
                  stroke="var(--color-accent-primary)"
                  strokeWidth="3"
                  points={weeklyData
                    .map((v, i) => `${i * 20 + 5},${60 - v / 2}`)
                    .join(" ")}
                />
              </svg>
            </div>
            <div className={styles.miniLegend}>
              <span>Completion trend</span>
              <span>Aim 80%+</span>
            </div>
          </div>

          {/* AI Insights */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>AI Insights</h3>
            {aiLoading ? (
              <div className={styles.muted}>Analysing your habits…</div>
            ) : !ai ? (
              <div className={styles.muted}>No insights available yet.</div>
            ) : (
              <div className={styles.shortAIBox}>{ai.shortSummary}</div>
            )}
          </div>
        </aside>
      </div>

      {/* ── RECOMMENDATIONS (full width) ── */}
      <div className={styles.recommendationsRow}>
        <Recommendations />
      </div>

      {/* ── FLOATING AI CHAT ── */}
      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      <button
        className={styles.floatingAI}
        onClick={() => setChatOpen(true)}
        title="Chat with AI Coach"
      >
        <FaRobot size={20} />
      </button>
    </div>
  );
}
