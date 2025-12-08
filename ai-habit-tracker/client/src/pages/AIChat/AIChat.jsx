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
      setInsights({ summary: "Error loading insights." });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className={styles.aiLoading}>Analyzing your habits… ⏳</div>;
  }

  if (!insights) {
    return <div className={styles.aiLoading}>No insights available.</div>;
  }

  return (
    <div className={styles.aiRoot}>
      <h2 className={styles.aiTitle}>AI Insights</h2>

      <div className={styles.aiCard}>
        <div className={styles.aiMessage}>
          <div className={styles.aiBotAvatar}>🤖</div>

          <div className={styles.aiText}>
            <p>
              <b>1. Daily Performance:</b> {insights.summary}
            </p>
            <p>
              <b>2. Strongest Habit:</b> {insights.strongest}
            </p>
            <p>
              <b>3. Weakest Habit:</b> {insights.weakest}
            </p>
            <p>
              <b>4. Best Day of the Week:</b> {insights.bestDay}
            </p>

            <p>
              <b>5. Improvement Recommendations:</b>
            </p>
            <ul>
              {insights.recommendations?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>

            <p>
              <b>6. Motivation:</b> {insights.motivation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
