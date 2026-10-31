import React, { useState } from "react";
import { FiX, FiCheck, FiSliders, FiClock } from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { formatTime12 } from "../../utils/dateHelpers";

const LOCAL_PRESETS = [
  {
    key: "productive_workday",
    name: "💼 Productive Workday",
    description: "Deep work blocks, dedicated communication windows, balanced breaks, and structured closeout.",
    sample: [
      { time: "08:30 - 09:00", title: "Morning Planning & Priorities" },
      { time: "09:00 - 11:30", title: "Deep Work - Core Objectives" },
      { time: "11:30 - 12:00", title: "Active Rest & Rehydration" },
      { time: "12:00 - 13:00", title: "Collaborative Sync & Comms" },
      { time: "14:00 - 16:30", title: "Deep Work - Feature Development" },
      { time: "17:30 - 18:45", title: "Physical Exercise & Mobility" },
    ],
  },
  {
    key: "student_study",
    name: "📚 Student Exam Prep & Study",
    description: "Active recall blocks, intensive theory, problem-solving drills, and revision pauses.",
    sample: [
      { time: "08:30 - 09:15", title: "Flashcard Recall & Concepts Review" },
      { time: "09:30 - 11:30", title: "Core Subject Intensive Session" },
      { time: "11:45 - 13:00", title: "Problem Solving & Exercises" },
      { time: "14:30 - 16:30", title: "Secondary Subject / Lecture Review" },
      { time: "17:00 - 18:00", title: "Outdoor Walk & Sports" },
      { time: "20:00 - 21:00", title: "Summary & Day Reflection" },
    ],
  },
  {
    key: "wellness_balance",
    name: "🧘 Healthy Balanced Routine",
    description: "Mindful wellness, physical movement, focused execution burst, and digital sunset.",
    sample: [
      { time: "07:00 - 07:30", title: "Morning Sunlight & Hydration" },
      { time: "07:30 - 08:30", title: "Morning Workout / Yoga" },
      { time: "09:30 - 12:30", title: "Top Priority Deep Focus" },
      { time: "14:00 - 16:30", title: "Afternoon Tasks & Creative Projects" },
      { time: "21:00 - 22:00", title: "Evening Wind Down & Journaling" },
    ],
  },
];

export default function PresetModal({ isOpen, onClose, onApplyPreset, targetDate }) {
  const [selectedKey, setSelectedKey] = useState("productive_workday");
  const [clearExisting, setClearExisting] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyPreset(selectedKey, targetDate, clearExisting);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Daily Timetable Templates</h3>
          <button className={styles.closeModalBtn} onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.emptyText} style={{ margin: 0 }}>
            Populate your schedule for <strong>{targetDate}</strong> with an industry-tested time-blocked template:
          </p>

          <div className={styles.presetsGrid}>
            {LOCAL_PRESETS.map((p) => {
              const isSelected = selectedKey === p.key;
              return (
                <div
                  key={p.key}
                  className={`${styles.presetCard} ${isSelected ? styles.presetCardSelected : ""}`}
                  onClick={() => setSelectedKey(p.key)}
                >
                  <div className={styles.presetHeader}>
                    <h4 className={styles.presetName}>{p.name}</h4>
                    {isSelected && <span className={styles.presetCount}>Selected</span>}
                  </div>
                  <p className={styles.presetDesc}>{p.description}</p>

                  <div className={styles.presetTimelinePreview}>
                    {p.sample.map((item, idx) => (
                      <div key={idx} className={styles.presetItemMini}>
                        <FiClock size={12} />
                        <strong>{item.time}:</strong> {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.88rem",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
            />
            <span>Clear existing events on {targetDate} before applying</span>
          </label>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleApply}>
            <FiCheck size={16} />
            <span>Apply to {targetDate}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

