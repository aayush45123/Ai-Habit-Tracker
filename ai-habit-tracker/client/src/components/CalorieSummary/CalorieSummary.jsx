import { useEffect, useState } from "react";
import api from "../utils/api";
import styles from "./CalorieSummary.module.css";

export default function CalorieSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/calories/ai/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Error loading summary:", err);
      setError("Failed to load calorie summary");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!summary || !summary.items || summary.items.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Today's Summary</h3>
        <p className={styles.empty}>No food logged today</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Today's Summary</h3>
        <div className={styles.total}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>
            {summary.totalCalories} kcal
          </span>
        </div>
      </div>

      <ul className={styles.list}>
        {summary.items.map((f) => (
          <li key={f._id} className={styles.item}>
            <span className={styles.foodName}>{f.foodName}</span>
            <span className={styles.calories}>{f.calories} kcal</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
