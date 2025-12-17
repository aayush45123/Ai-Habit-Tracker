import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./AIChat.module.css";

export default function AIChat() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    try {
      const res = await api.get("/ai/insights");
      setInsights(res.data.ai);
    } catch (err) {
      console.error(err);
      setInsights({ summary: "Unable to generate insights right now." });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.aiLoading}>
        Analyzing your habits and patterns…
      </div>
    );
  }

  if (!insights) {
    return <div className={styles.aiLoading}>No AI insights available.</div>;
  }

  return (
    <div className={styles.aiRoot}>
      <h2 className={styles.aiTitle}>AI Habit Insights</h2>

      {/* OVERALL SUMMARY */}
      <section className={styles.aiSection}>
        <h3>Overview</h3>
        <p className={styles.aiHighlight}>{insights.summary}</p>
      </section>

      {/* PERFORMANCE */}
      <section className={styles.aiSection}>
        <h3>Performance Breakdown</h3>

        <div className={styles.aiGrid}>
          <div className={styles.aiStat}>
            <span>Strongest Habit</span>
            <b>{insights.strongest || "Not enough data"}</b>
          </div>

          <div className={styles.aiStat}>
            <span>Weakest Habit</span>
            <b>{insights.weakest || "Not enough data"}</b>
          </div>

          <div className={styles.aiStat}>
            <span>Best Day</span>
            <b>{insights.bestDay || "Not identified yet"}</b>
          </div>
        </div>
      </section>

      {/* RECOMMENDATIONS */}
      <section className={styles.aiSection}>
        <h3>Actionable Recommendations</h3>

        {insights.recommendations?.length > 0 ? (
          <ul className={styles.aiList}>
            {insights.recommendations.map((r, i) => (
              <li key={i}>
                <b>Tip {i + 1}:</b> {r}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recommendations available yet.</p>
        )}
      </section>

      {/* MOTIVATION */}
      <section className={styles.aiSection}>
        <h3>Motivation & Mindset</h3>
        <p className={styles.aiMotivation}>{insights.motivation}</p>
      </section>
    </div>
  );
}
