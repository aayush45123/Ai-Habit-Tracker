import React, { useState } from "react";
import api from "../../utils/api";
import styles from "./AddHabit.module.css";

export default function AddHabit() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await api.post("/habits/create", { title, description, frequency });
      window.location.href = "/";
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className={styles.layout}>

      <main className={styles.page}>
        <div className={styles.addHabitRoot}>
          <h2>Create a New Habit</h2>

          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.addForm} onSubmit={handleSubmit}>
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g., Read 20 min"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label>Description</label>
            <textarea
              placeholder="Why or how you want to do this..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>

            <button type="submit" className={styles.submitBtn}>
              Add Habit
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
