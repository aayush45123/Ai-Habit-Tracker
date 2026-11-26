import React, { useEffect, useState } from "react";
import { FiX, FiCopy } from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { formatDateISO } from "../../utils/dateHelpers";

export default function CloneDayModal({ isOpen, onClose, onCloneDay, currentSelectedDate }) {
  const [sourceDate, setSourceDate] = useState("");
  const [targetDate, setTargetDate] = useState(currentSelectedDate || formatDateISO());
  const sameDate = sourceDate && sourceDate === targetDate;

  useEffect(() => {
    if (!isOpen) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSourceDate(formatDateISO(yesterday));
    setTargetDate(currentSelectedDate || formatDateISO());
  }, [isOpen, currentSelectedDate]);

  if (!isOpen) return null;

  const handleClone = () => {
    onCloneDay(sourceDate, targetDate);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Duplicate Day Timetable</h3>
          <button className={styles.closeModalBtn} onClick={onClose} aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.emptyText} style={{ margin: 0 }}>
            Copy all scheduled time slots from an existing day to another day to quickly recreate your timetable:
          </p>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Copy From (Source Date)</label>
            <input
              type="date"
              className={styles.formInput}
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Paste To (Destination Date)</label>
            <input
              type="date"
              className={styles.formInput}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleClone}
            disabled={!sourceDate || !targetDate || sameDate}
          >
            <FiCopy size={16} />
            <span>Copy Timetable</span>
          </button>
        </div>
        {sameDate && (
          <p className={styles.formError} role="alert">
            Choose a different destination date to avoid duplicating events on the same day.
          </p>
        )}
      </div>
    </div>
  );
}

