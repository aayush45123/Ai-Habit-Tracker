import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { FiTrendingUp, FiCpu, FiCheckCircle, FiActivity, FiZap, FiTarget } from "react-icons/fi";

export default function JournalAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await api.get("/journal/analytics");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch journal analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Computing intelligence analytics...</div>;
  }

  if (!data || data.summary.totalEntries === 0) {
    return (
      <div className={styles.formCard} style={{ textAlign: "center" }}>
        <h2>🧠 Journal Intelligence Engine</h2>
        <p className={styles.subtitle}>Log a few daily entries to unlock correlations between your sleep, workouts, study hours, and habits!</p>
      </div>
    );
  }

  const { summary, productivity, learning, fitness, mood, correlations, intelligenceInsights } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 🧠 Intelligence Engine Observations */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, textTransform: "uppercase" }}>
          <FiCpu color="var(--color-accent-secondary)" /> Intelligence Insights
        </h2>

        <div className={styles.statsGrid}>
          {intelligenceInsights.map((ins, idx) => (
            <div key={idx} className={styles.insightCard}>
              <span className={styles.insightCategory}>{ins.category}</span>
              <div className={styles.insightTitle}>{ins.title}</div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>{ins.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 Habit & Metric Correlation Engine */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, textTransform: "uppercase" }}>
          <FiTrendingUp color="var(--color-accent-primary)" /> Habit Correlation Discoveries
        </h2>

        {correlations.length === 0 ? (
          <div className={styles.formCard}>
            <p className={styles.subtitle}>Continue logging to build statistical power for lifestyle correlation discovery.</p>
          </div>
        ) : (
          <div className={styles.statsGrid}>
            {correlations.map((corr, idx) => (
              <div
                key={idx}
                className={styles.insightCard}
                style={{ borderLeft: `6px solid ${corr.positive ? "#10b981" : "#f59e0b"}` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={styles.insightCategory}>{corr.pair}</span>
                  <span className={styles.badge} style={{ background: corr.positive ? "#10b981" : "#f59e0b" }}>
                    {corr.score > 0 ? `+${corr.score}%` : `${corr.score}%`}
                  </span>
                </div>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", fontWeight: 700 }}>{corr.insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⚡ Performance Breakdown Grid */}
      <div className={styles.sectionGrid}>
        {/* Productivity Analytics */}
        <div className={styles.statCard}>
          <h3 style={{ margin: 0, textTransform: "uppercase" }}>⚡ Productivity</h3>
          <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{productivity.avgHours} hrs/day</div>
          <div style={{ fontSize: "0.9rem" }}>
            Peak Focus Day: <strong>{productivity.mostProductiveDay}</strong>
          </div>
          <div style={{ fontSize: "0.9rem" }}>
            Weekday Habit Rate: <strong>{productivity.weeklyConsistency}%</strong>
          </div>
        </div>

        {/* Learning Analytics */}
        <div className={styles.statCard}>
          <h3 style={{ margin: 0, textTransform: "uppercase" }}>📚 Learning & Study</h3>
          <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{learning.totalHours} Total Hours</div>
          <div style={{ fontSize: "0.9rem" }}>
            Active Learning Days: <strong>{learning.activeDays} days</strong>
          </div>
          <div style={{ fontSize: "0.9rem" }}>
            Topics Logged: <strong>{learning.topicsCount} logs</strong>
          </div>
        </div>

        {/* Wellness & Fitness */}
        <div className={styles.statCard}>
          <h3 style={{ margin: 0, textTransform: "uppercase" }}>💧 Fitness & Hydration</h3>
          <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{fitness.avgWater} L / day</div>
          <div style={{ fontSize: "0.9rem" }}>
            Avg Calories Burned: <strong>{fitness.avgCalories} kcal</strong>
          </div>
          <div style={{ fontSize: "0.9rem" }}>
            Sleep Average: <strong>{summary.avgSleepHours} hrs</strong>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className={styles.statCard}>
          <h3 style={{ margin: 0, textTransform: "uppercase" }}>🙂 Mood & Stress</h3>
          <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{mood.averageScore} / 5 Avg Mood</div>
          <div style={{ fontSize: "0.9rem" }}>
            High Stress Days: <strong>{mood.stressFrequency} days</strong>
          </div>
          <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Great: {mood.moodDistribution.great || 0} • Good: {mood.moodDistribution.good || 0} • Neutral: {mood.moodDistribution.neutral || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
