import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Flame, Check, Circle, Trash2 } from "lucide-react";
import styles from "./HabitCard.module.css";

/**
 * Props:
 *  - habit
 *  - onToggle(done:boolean)
 *  - onDelete()
 */

export default function HabitCard({ habit, onToggle, onDelete }) {
  const doneToday =
    habit.lastDate === new Date().toISOString().split("T")[0] &&
    habit.lastStatus === "done";

  const frequencyText = useMemo(() => {
    if (!habit.frequency) return "Daily";
    return habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1);
  }, [habit.frequency]);

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`Delete "${habit.title}"?`);

    if (!confirmed) return;

    if (onDelete) {
      onDelete();
    }
  }

  return (
    <div className={`${styles.habitCard} ${doneToday ? styles.done : ""}`}>
      {/* LEFT */}
      <div className={styles.hcLeft}>
        <Link to={`/habit/${habit._id}`} className={styles.hcTitleLink}>
          <div className={styles.hcTitle}>
            {habit.title}

            {doneToday && (
              <Check className={styles.checkIcon} size={20} strokeWidth={3} />
            )}
          </div>
        </Link>

        <div className={`${styles.hcDesc} ${styles.muted}`}>
          {habit.description || frequencyText}
        </div>
      </div>

      {/* RIGHT */}
      <div className={styles.hcRight}>
        <button
          className={`${styles.toggle} ${doneToday ? styles.on : ""}`}
          onClick={() => onToggle(!doneToday)}
          title={doneToday ? "Mark as missed" : "Mark as done"}
        >
          {doneToday ? (
            <>
              <Check size={16} strokeWidth={3} />
              <span>Done</span>
            </>
          ) : (
            <>
              <Circle size={16} strokeWidth={2} />
              <span>Mark</span>
            </>
          )}
        </button>

        {/* DELETE BUTTON */}
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="Delete Habit"
        >
          <Trash2 size={18} strokeWidth={2.5} />
        </button>

        {/* STREAK */}
        <div className={styles.hcStreak}>
          <Flame size={18} strokeWidth={2.5} className={styles.flameIcon} />
          <span>{habit.streak || 0}</span>
        </div>
      </div>
    </div>
  );
}
