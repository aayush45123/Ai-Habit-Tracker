import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import styles from "./AddHabitModal.module.css";

const EMPTY_HABIT = () => ({
  id: Math.random().toString(36).slice(2),
  title: "",
  description: "",
  frequency: "daily",
});

/**
 * AddHabitModal
 * Props:
 *  open        {boolean}  – whether the modal is visible
 *  onClose     {fn}       – called when the user dismisses without saving
 *  onSuccess   {fn}       – called with the array of created habit objects
 */
export default function AddHabitModal({ open, onClose, onSuccess }) {
  const [entries, setEntries] = useState([EMPTY_HABIT()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const firstInputRef = useRef(null);

  // Reset state every time modal opens
  useEffect(() => {
    if (open) {
      setEntries([EMPTY_HABIT()]);
      setError("");
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function updateEntry(id, field, value) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function addAnotherHabit() {
    setEntries((prev) => [...prev, EMPTY_HABIT()]);
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validate – every entry needs a title
    for (const entry of entries) {
      if (!entry.title.trim()) {
        setError("Each habit must have a title.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = entries.map(({ title, description, frequency }) => ({
        title: title.trim(),
        description: description.trim(),
        frequency,
      }));

      const res = await api.post("/habits/add-bulk", { habits: payload });
      const created = res.data?.habits || [];
      onSuccess(created);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Add Habits">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>✦</span>
            <div>
              <h2 className={styles.title}>Add New Habits</h2>
              <p className={styles.subtitle}>Add one or multiple habits at once</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.entriesList}>
            {entries.map((entry, index) => (
              <div key={entry.id} className={styles.habitEntry}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryNum}>Habit {index + 1}</span>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeEntry(entry.id)}
                      aria-label={`Remove habit ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Title *</label>
                  <input
                    ref={index === 0 ? firstInputRef : null}
                    className={styles.input}
                    type="text"
                    placeholder="e.g., Read 20 min, Morning run…"
                    value={entry.title}
                    onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Why or how you want to do this…"
                    value={entry.description}
                    onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Frequency</label>
                  <select
                    className={styles.select}
                    value={entry.frequency}
                    onChange={(e) => updateEntry(entry.id, "frequency", e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Add another */}
          <button
            type="button"
            className={styles.addMoreBtn}
            onClick={addAnotherHabit}
            disabled={submitting}
          >
            <span className={styles.plusIcon}>+</span>
            Add Another Habit
          </button>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting
                ? "Adding…"
                : entries.length === 1
                ? "Add Habit"
                : `Add ${entries.length} Habits`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
