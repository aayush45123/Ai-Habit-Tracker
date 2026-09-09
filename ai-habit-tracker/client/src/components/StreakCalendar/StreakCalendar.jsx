import React from "react";
import styles from "./StreakCalendar.module.css";

export default function StreakCalendar({ completionMap = {} }) {
  // Generate last 28 days
  const days = [];
  const today = new Date();

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayOfMonth = d.getDate();

    const isToday = i === 0;
    const isCompleted = Boolean(completionMap[dateStr]);

    days.push({
      dateStr,
      dayOfWeek,
      dayOfMonth,
      isToday,
      isCompleted,
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.title}>28-Day Consistency Matrix</span>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.completed}`}></span>
            <span>Completed</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.empty}`}></span>
            <span>Missed / Rest</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {days.map((day) => (
          <div
            key={day.dateStr}
            className={`${styles.dayBox} ${day.isCompleted ? styles.completedBox : ""} ${
              day.isToday ? styles.todayBox : ""
            }`}
            title={`${day.dateStr}: ${day.isCompleted ? "Completed" : "No Activity"}`}
          >
            <span className={styles.dayNum}>{day.dayOfMonth}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
