import React from "react";
import {
  FiClock,
  FiCheck,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiPlus,
  FiSliders,
  FiCopy,
} from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import {
  formatTime12,
  calculateDuration,
  isCurrentTimeInRange,
} from "../../utils/dateHelpers";

const CATEGORY_ICONS = {
  work: "💼",
  study: "📚",
  fitness: "🏋️",
  meeting: "🤝",
  routine: "🔄",
  personal: "👤",
  break: "☕",
  other: "📌",
};

export default function DailyTimelineView({
  events = [],
  selectedDate,
  onEditEvent,
  onDeleteEvent,
  onToggleStatus,
  onOpenAddModal,
  onOpenPresetModal,
  onOpenCloneModal,
}) {
  if (events.length === 0) {
    return (
      <div className={styles.timelineEmpty}>
        <FiClock className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>No Time Slots Scheduled</h3>
        <p className={styles.emptyText}>
          You have no events scheduled for <strong>{selectedDate}</strong>. Add tasks with start and end times or choose a pre-built daily routine.
        </p>
        <div className={styles.emptyActions}>
          <button className={styles.btnPrimary} onClick={onOpenAddModal}>
            <FiPlus size={16} />
            <span>Add First Slot</span>
          </button>
          <button className={styles.btnSecondary} onClick={onOpenPresetModal}>
            <FiSliders size={16} />
            <span>Use Template</span>
          </button>
          <button className={styles.btnSecondary} onClick={onOpenCloneModal}>
            <FiCopy size={16} />
            <span>Copy From Another Day</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineList}>
        {events.map((event) => {
          const isCompleted = event.status === "completed";
          const isHappeningNow = isCurrentTimeInRange(
            event.startTime,
            event.endTime,
            selectedDate
          );
          const durationStr = calculateDuration(event.startTime, event.endTime);
          const catIcon = CATEGORY_ICONS[event.category] || "📌";

          return (
            <div
              key={event._id}
              className={`${styles.timelineItem} ${isHappeningNow ? styles.itemActive : ""} ${
                isCompleted ? styles.itemCompleted : ""
              }`}
            >
              {/* Time column */}
              <div className={styles.timeCol}>
                <div className={styles.timeSpan}>
                  <FiClock size={16} />
                  <span>
                    {formatTime12(event.startTime)}
                  </span>
                </div>
                <div className={styles.durationBadge}>
                  to {formatTime12(event.endTime)} ({durationStr})
                </div>
              </div>

              {/* Info Column */}
              <div className={styles.infoCol}>
                <div className={styles.titleRow}>
                  <h4
                    className={`${styles.eventTitle} ${
                      isCompleted ? styles.completedText : ""
                    }`}
                  >
                    {event.title}
                  </h4>
                  {isHappeningNow && (
                    <span className={styles.liveTag}>LIVE NOW</span>
                  )}
                  {event.hasConflict && (
                    <span className={styles.conflictBadge}>
                      <FiAlertTriangle size={12} />
                      <span>Time Conflict</span>
                    </span>
                  )}
                </div>

                {event.description && (
                  <p
                    className={`${styles.eventDesc} ${
                      isCompleted ? styles.completedText : ""
                    }`}
                  >
                    {event.description}
                  </p>
                )}

                <div className={styles.badgesRow}>
                  <span className={styles.categoryTag}>
                    <span>{catIcon}</span>
                    <span>{event.category}</span>
                  </span>

                  <span
                    className={`${styles.priorityTag} ${
                      event.priority === "urgent" ? styles.priorityUrgent : ""
                    }`}
                  >
                    {event.priority}
                  </span>

                  {event.reminderMinutesBefore !== undefined && (
                    <span className={styles.categoryTag}>
                      🔔 {event.reminderMinutesBefore === 0 ? "At start" : `${event.reminderMinutesBefore}m before`}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Column */}
              <div className={styles.actionsCol}>
                <button
                  className={`${styles.actionBtn} ${
                    isCompleted ? styles.checkBtnCompleted : ""
                  }`}
                  onClick={() => onToggleStatus(event._id)}
                  title={isCompleted ? "Mark incomplete" : "Mark completed"}
                >
                  <FiCheck size={18} />
                </button>

                <button
                  className={styles.actionBtn}
                  onClick={() => onEditEvent(event)}
                  title="Edit time slot"
                >
                  <FiEdit2 size={16} />
                </button>

                <button
                  className={styles.actionBtn}
                  onClick={() => onDeleteEvent(event._id)}
                  title="Delete time slot"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

