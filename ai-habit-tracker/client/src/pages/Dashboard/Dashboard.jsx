import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import HabitCard from "../../components/HabitCard/HabitCard";
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

  const total = habits.length;
  const completedToday = habits.filter(
    (h) => h.lastDate === formatDateISO() && h.lastStatus === "done"
  ).length;
  const streak = Math.max(...habits.map((h) => h.streak || 0), 0);

  return (
    <div className={styles.dashRoot}>
      {/* HEADER */}
      <header className={styles.dashHeader}>
        <div>
          <h1>Welcome back</h1>
        </div>

        <div className={styles.dashHeaderRight}>
          <div className={`${styles.statCard} ${styles.statSmall}`}>
            <div className={styles.statLabel}>This week</div>
            <div className={styles.statValue}>
              {weeklyData.length
                ? Math.round(
                    weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length
                  )
                : 0}
              %
            </div>

            <div className={styles.sparklineContainer}>
              <svg viewBox="0 0 70 20" className={styles.spark}>
                <polyline
                  fill="none"
                  stroke="url(#g1)"
                  strokeWidth="2"
                  points={weeklyData
                    .map((v, i) => `${i * 10 + 2},${20 - v / 6}`)
                    .join(" ")}
                />
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
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

      {/* MAIN */}
      <main className={styles.dashMain}>
        {/* LEFT COLUMN */}
        <section className={styles.leftCol}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Quick Summary</h3>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.num}>{total}</div>
                <div className={styles.label}>Total Habits</div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.num}>{completedToday}</div>
                <div className={styles.label}>Completed Today</div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.num}>{streak}</div>
                <div className={styles.label}>Longest Streak</div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.num}>
                  {weekChange > 0 ? "+" : ""}
                  {weekChange}%
                </div>
                <div className={styles.label}>Week Change</div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Today's Habits</h3>

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
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className={styles.rightCol}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Weekly Completion</h3>

            <div className={styles.chartBox}>
              <svg viewBox="0 0 140 60" className={styles.bigSpark}>
                <polyline
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="3"
                  points={weeklyData
                    .map((v, i) => `${i * 20 + 5},${60 - v / 2}`)
                    .join(" ")}
                />
              </svg>
            </div>

            <div className={styles.miniLegend}>
              <div>Completion trend</div>
              <div className={styles.muted}>Aim for 80%+</div>
            </div>
          </div>

          {/* AI SHORT INSIGHTS */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>AI Insights</h3>

            {aiLoading ? (
              <div className={styles.muted}>Analyzing your habits…</div>
            ) : !ai ? (
              <div className={styles.muted}>No insights available.</div>
            ) : (
              <div className={styles.shortAIBox}>{ai.shortSummary}</div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
