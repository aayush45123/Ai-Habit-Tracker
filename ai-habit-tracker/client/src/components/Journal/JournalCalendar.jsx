import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { FiChevronLeft, FiChevronRight, FiCalendar, FiSmile, FiMeh, FiThumbsUp, FiThumbsDown, FiAlertCircle, FiFileText, FiZap } from "react-icons/fi";

const MOOD_ICONS = {
  great: <FiThumbsUp size={14} color="#10b981" />,
  good: <FiSmile size={14} color="#3b82f6" />,
  neutral: <FiMeh size={14} color="#f59e0b" />,
  bad: <FiThumbsDown size={14} color="#ef4444" />,
  terrible: <FiAlertCircle size={14} color="#991b1b" />,
};

export default function JournalCalendar({ onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entriesMap, setEntriesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthEntries();
  }, [currentMonth]);

  async function fetchMonthEntries() {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const res = await api.get("/journal/entries", {
        params: { startDate, endDate, limit: 100 },
      });

      const map = {};
      (res.data.entries || []).forEach((e) => {
        map[e.date] = e;
      });
      setEntriesMap(map);
    } catch (err) {
      console.error("Error loading month entries:", err);
    } finally {
      setLoading(false);
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({ day: d, dateStr });
  }

  return (
    <div className={styles.formCard}>
      {/* Header */}
      <div className={styles.formHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <FiCalendar size={22} />
          <h2 style={{ margin: 0 }}>{monthName}</h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className={styles.tabBtn} onClick={prevMonth}>
            <FiChevronLeft size={18} /> Prev
          </button>
          <button className={styles.tabBtn} onClick={nextMonth}>
            Next <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading calendar...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Day Names */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem", textAlign: "center", fontWeight: 800 }}>
            {weekDays.map((w) => (
              <div key={w} style={{ padding: "0.5rem", textTransform: "uppercase", fontSize: "0.85rem" }}>
                {w}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty_${idx}`} style={{ minHeight: "80px", background: "rgba(0,0,0,0.02)" }} />;
              }

              const entry = entriesMap[cell.dateStr];
              const isToday = cell.dateStr === new Date().toISOString().split("T")[0];

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => onSelectDate(cell.dateStr)}
                  style={{
                    minHeight: "85px",
                    padding: "0.5rem",
                    border: isToday ? "3px solid var(--color-accent-primary)" : "2px solid var(--color-border)",
                    background: entry ? "var(--color-bg-secondary)" : "var(--color-bg-primary)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.15s ease",
                  }}
                  title={entry ? `Logged: ${entry.title || "Entry"}` : `Click to create entry for ${cell.dateStr}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{cell.day}</span>
                    {entry && <span style={{ fontSize: "1rem", display: "flex", alignItems: "center" }}>{MOOD_ICONS[entry.mood] || <FiFileText size={14} />}</span>}
                  </div>

                  {entry ? (
                    <div style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.title || "Logged"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><FiZap size={10} /> {entry.productivityHours}h prod</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>+ Add</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
