import React from "react";
import { FiPlus, FiClock } from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { formatTime12, getWeekDays } from "../../utils/dateHelpers";

export default function WeeklyGridView({
  weekEvents = [],
  selectedDate,
  onSelectDate,
  onEditEvent,
  onAddForDate,
}) {
  const weekDays = getWeekDays(selectedDate);

  // Group events by date
  const eventsByDate = {};
  for (const day of weekDays) {
    eventsByDate[day.dateStr] = [];
  }
  for (const ev of weekEvents) {
    if (eventsByDate[ev.date]) {
      eventsByDate[ev.date].push(ev);
    }
  }

  return (
    <div className={styles.weeklyContainer}>
      <div className={styles.weekGrid}>
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const dayItems = eventsByDate[day.dateStr] || [];

          return (
            <div key={day.dateStr} className={styles.weekDayCol}>
              <div
                className={`${styles.weekColHeader} ${
                  day.isToday ? styles.colHeaderToday : ""
                } ${isSelected && !day.isToday ? styles.colHeaderSelected : ""}`}
                onClick={() => onSelectDate(day.dateStr)}
              >
                <div className={styles.colDayName}>{day.dayName}</div>
                <div className={styles.colDayNumber}>{day.dayNumber}</div>
                {day.isToday && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 800 }}>TODAY</span>
                )}
              </div>

              <div className={styles.weekEventsList}>
                {dayItems.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--color-text-secondary, #777)",
                      fontSize: "0.75rem",
                      padding: "1rem 0",
                    }}
                  >
                    No slots
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <div
                      key={item._id}
                      className={`${styles.weekMiniCard} ${
                        item.status === "completed" ? styles.weekMiniCardDone : ""
                      }`}
                      onClick={() => onEditEvent(item)}
                      title={`${item.title} (${item.startTime} - ${item.endTime})`}
                    >
                      <div className={styles.weekCardTime}>
                        {formatTime12(item.startTime)}
                      </div>
                      <div className={styles.weekCardTitle}>{item.title}</div>
                    </div>
                  ))
                )}
              </div>

              <button
                className={styles.addQuickDayBtn}
                onClick={() => onAddForDate(day.dateStr)}
                title={`Add slot to ${day.dateStr}`}
              >
                <FiPlus size={14} />
                <span>Add Slot</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

