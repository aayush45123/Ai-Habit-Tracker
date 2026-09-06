import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import styles from "./AddHabit.module.css";

const EMPTY_HABIT = () => ({
  id: Math.random().toString(36).slice(2),
  title: "",
  description: "",
  frequency: "daily",
});

export default function AddHabit() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([EMPTY_HABIT()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

      await api.post("/habits/add-bulk", { habits: payload });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.layout}>
      <main className={styles.page}>
        <div className={styles.addHabitRoot}>
          <div className={styles.pageHeader}>
            <h2>Add New Habits</h2>
            <p className={styles.pageSubtitle}>
              Fill in one or more habits below — they'll all be added at once.
            </p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.addForm} onSubmit={handleSubmit}>
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
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Read 20 min"
                    value={entry.title}
                    onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                    maxLength={100}
                  />

                  <label>Description</label>
                  <textarea
                    placeholder="Why or how you want to do this..."
                    value={entry.description}
                    onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
                  />

                  <label>Frequency</label>
                  <select
                    value={entry.frequency}
                    onChange={(e) => updateEntry(entry.id, "frequency", e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={addAnotherHabit}
              disabled={submitting}
            >
              + Add Another Habit
            </button>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate("/dashboard")}
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
      </main>
    </div>
  );
}
