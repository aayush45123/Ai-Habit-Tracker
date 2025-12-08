import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./HabitCard.module.css";

/**
 * Props:
 *  - habit: object { _id, title, description, frequency, lastDate, lastStatus, streak }
 *  - onToggle(done:boolean)
 */
export default function HabitCard({ habit, onToggle }) {
  const doneToday =
    habit.lastDate === new Date().toISOString().split("T")[0] &&
    habit.lastStatus === "done";

  const frequencyText = useMemo(() => {
    if (!habit.frequency) return "Daily";
    return habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1);
  }, [habit.frequency]);

  return (
    <div className={`${styles.habitCard} ${doneToday ? styles.done : ""}`}>
      {/* LEFT SECTION – clickable title */}
      <div className={styles.hcLeft}>
        <Link to={`/habit/${habit._id}`} className={styles.hcTitleLink}>
          <div className={styles.hcTitle}>{habit.title}</div>
        </Link>

        <div className={`${styles.hcDesc} ${styles.muted}`}>
          {habit.description || frequencyText}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className={styles.hcRight}>
        <button
          className={`${styles.toggle} ${doneToday ? styles.on : ""}`}
          onClick={() => onToggle(!doneToday)}
          title={doneToday ? "Mark as missed" : "Mark as done"}
        >
          {doneToday ? "Done" : "Mark"}
        </button>

        <div className={styles.hcStreak}>{habit.streak || 0} 🔥</div>
      </div>
    </div>
  );
}
