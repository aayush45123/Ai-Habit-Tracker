// client/src/pages/Habits/HabitDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import styles from "./HabitDetail.module.css";

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [habit, setHabit] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    frequency: "daily",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function fetchDetail() {
    try {
      setLoading(true);
      const res = await api.get(`/habits/${id}/logs`);

      setHabit(res.data.habit);
      setLogs(res.data.logs || []);

      setForm({
        title: res.data.habit.title,
        description: res.data.habit.description,
        frequency: res.data.habit.frequency,
      });
    } catch (err) {
      setError("Failed to load habit");
    } finally {
      setLoading(false);
    }
  }

  // ⭐ IMPORTANT FIX — ALWAYS SEND INDIA NORMALIZED DATE
  function getTodayISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }

  async function addLog(status) {
    try {
      const date = getTodayISO(); // FIXED
      await api.post(`/habits/${id}/log`, { status, date });

      await fetchDetail();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add log");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete habit?")) return;

    await api.delete(`/habits/${id}`);
    navigate("/");
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.patch(`/habits/${id}`, form);
      setHabit(res.data.habit);
      setEditMode(false);
    } catch {
      setError("Failed to update habit");
    }
  }

  if (loading) return <div className={styles.hdRoot}>Loading…</div>;
  if (!habit) return <div className={styles.hdRoot}>Habit not found</div>;

  return (
    <div className={styles.hdRoot}>
      {/* Header */}
      <div className={`${styles.panel} ${styles.headerPanel}`}>
        <h2>{habit.title}</h2>
        <p>{habit.description}</p>
        <p>
          Frequency: {habit.frequency} • Streak: {habit.streak || 0}🔥 • Last:{" "}
          {habit.lastDate || "—"}
        </p>

        <div className={styles.hdActions}>
          <button
            className={`${styles.btn} ${styles.danger}`}
            onClick={handleDelete}
          >
            Delete
          </button>
          <button className={styles.btn} onClick={() => setEditMode(!editMode)}>
            {editMode ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editMode && (
        <div className={styles.panel}>
          <form onSubmit={handleEditSubmit} className={styles.editForm}>
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <label>Frequency</label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>

            <button className={styles.btn}>Save</button>
          </form>
        </div>
      )}

      {/* Logs */}
      <div className={`${styles.panel} ${styles.logsPanel}`}>
        <div className={styles.logsHeader}>
          <h3>History</h3>
          <div>
            <button className={styles.btn} onClick={() => addLog("done")}>
              Mark Done (Today)
            </button>
            <button className={styles.btn} onClick={() => addLog("missed")}>
              Mark Missed (Today)
            </button>
          </div>
        </div>

        <ul className={styles.logsList}>
          {logs.map((l) => (
            <li key={l._id} className={styles[l.status]}>
              <span>{l.date}</span>
              <span>{l.status.toUpperCase()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
