import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiClock, FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { timeToMinutes } from "../../utils/dateHelpers";

const CATEGORIES = [
  { value: "work", label: "💼 Work" },
  { value: "study", label: "📚 Study" },
  { value: "fitness", label: "🏋️ Fitness / Health" },
  { value: "meeting", label: "🤝 Meeting" },
  { value: "routine", label: "🔄 Daily Routine" },
  { value: "personal", label: "👤 Personal" },
  { value: "break", label: "☕ Break / Rest" },
  { value: "other", label: "📌 Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent Priority" },
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  editEvent = null,
  existingEvents = [],
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [category, setCategory] = useState("work");
  const [priority, setPriority] = useState("medium");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || "");
      setDescription(editEvent.description || "");
      setDate(editEvent.date || initialDate);
      setStartTime(editEvent.startTime || "09:00");
      setEndTime(editEvent.endTime || "10:00");
      setCategory(editEvent.category || "work");
      setPriority(editEvent.priority || "medium");
      setReminderMinutesBefore(
        editEvent.reminderMinutesBefore !== undefined ? editEvent.reminderMinutesBefore : 15
      );
    } else {
      setTitle("");
      setDescription("");
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setEndTime("10:00");
      setCategory("work");
      setPriority("medium");
      setReminderMinutesBefore(15);
    }
    setError("");
  }, [editEvent, initialDate, isOpen]);

  if (!isOpen) return null;

  // Live conflict preview
  const currentStart = timeToMinutes(startTime);
  const currentEnd = timeToMinutes(endTime);
  const conflicting = (existingEvents || []).filter((ev) => {
    if (editEvent && ev._id === editEvent._id) return false;
    if (ev.date !== date) return false;
    return Math.max(currentStart, ev.startMinutes) < Math.min(currentEnd, ev.endMinutes);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a task or event title.");
      return;
    }

    if (currentStart >= currentEnd) {
      setError("End time must be later than start time.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      category,
      priority,
      reminderMinutesBefore: Number(reminderMinutesBefore),
    };

    onSave(payload, editEvent?._id);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editEvent ? "Edit Scheduled Slot" : "Add Time Slot"}
          </h3>
          <button className={styles.closeModalBtn} onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.conflictBadge} style={{ padding: "0.5rem" }}>
                <FiAlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Task / Event Title *</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Deep Work: Module Refactor, Client Call, Math Study"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Scheduled Date *</label>
              <input
                type="date"
                className={styles.formInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>From (Start Time) *</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>To (End Time) *</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Overlap notification */}
            {conflicting.length > 0 && (
              <div className={styles.conflictBadge}>
                <FiAlertTriangle size={14} />
                <span>
                  Overlaps with: {conflicting.map((c) => `${c.title} (${c.startTime}-${c.endTime})`).join(", ")}
                </span>
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select
                  className={styles.formSelect}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <select
                  className={styles.formSelect}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reminder Alert</label>
              <select
                className={styles.formSelect}
                value={reminderMinutesBefore}
                onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
              >
                <option value={0}>At time of event (0m before)</option>
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before (Recommended)</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes & Objectives (Optional)</label>
              <textarea
                className={styles.formTextarea}
                rows={3}
                placeholder="Specific goals, checklist, link to files or meeting room..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            {editEvent && onDelete && (
              <button
                type="button"
                className={styles.btnSecondary}
                style={{ marginRight: "auto", color: "#b91c1c", borderColor: "#b91c1c" }}
                onClick={() => onDelete(editEvent._id)}
              >
                <FiTrash2 size={16} />
                <span>Delete</span>
              </button>
            )}

            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className={styles.btnPrimary}>
              <FiCheck size={16} />
              <span>{editEvent ? "Save Changes" : "Add to Timetable"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

