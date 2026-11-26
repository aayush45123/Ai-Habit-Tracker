import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { formatDateISO } from "../../utils/dateHelpers";
import JournalEntryDetail, { getTemplateDisplayName } from "./JournalEntryDetail";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiSmile,
  FiMeh,
  FiThumbsUp,
  FiThumbsDown,
  FiAlertCircle,
  FiFileText,
  FiZap,
  FiBook,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiX,
  FiTarget,
} from "react-icons/fi";

const MOOD_META = {
  great: { label: "Great", color: "#10b981", icon: <FiThumbsUp size={14} color="#10b981" /> },
  good: { label: "Good", color: "#3b82f6", icon: <FiSmile size={14} color="#3b82f6" /> },
  neutral: { label: "Neutral", color: "#f59e0b", icon: <FiMeh size={14} color="#f59e0b" /> },
  bad: { label: "Bad", color: "#ef4444", icon: <FiThumbsDown size={14} color="#ef4444" /> },
  terrible: { label: "Terrible", color: "#991b1b", icon: <FiAlertCircle size={14} color="#991b1b" /> },
};

function formatDateNice(dateStr) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function JournalCalendar({ onSelectDate, onChanged }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entriesMap, setEntriesMap] = useState({});
  const [templates, setTemplates] = useState({ systemTemplates: [], customTemplates: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadNonce, setLoadNonce] = useState(0);
  const monthRequestIdRef = useRef(0);

  // Selected date modal state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchMonthEntries();
  }, [currentMonth, loadNonce]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function fetchTemplates() {
    try {
      const res = await api.get("/journal/templates");
      setTemplates(res.data || { systemTemplates: [], customTemplates: [] });
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }

  async function fetchMonthEntries() {
    const requestId = ++monthRequestIdRef.current;
    try {
      setLoading(true);
      setLoadError("");
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
      if (requestId === monthRequestIdRef.current) setEntriesMap(map);
    } catch (err) {
      console.error("Error loading month entries:", err);
      if (requestId === monthRequestIdRef.current) {
        setLoadError(err.response?.data?.message || "Could not load journal entries for this month.");
      }
    } finally {
      if (requestId === monthRequestIdRef.current) setLoading(false);
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleCellClick = (dateStr) => {
    setSelectedDate(dateStr);
    const entry = entriesMap[dateStr] || null;
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedEntry(null);
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    if (!window.confirm(`Delete journal entry for ${selectedDate}?`)) return;

    try {
      await api.delete(`/journal/entries/${selectedEntry._id}`);
      setEntriesMap((prev) => {
        const next = { ...prev };
        delete next[selectedDate];
        return next;
      });
      setIsModalOpen(false);
      onChanged?.();
    } catch (err) {
      console.error("Failed to delete entry:", err);
      alert("Failed to delete entry. Please try again.");
    }
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

  const todayStr = formatDateISO();

  return (
    <div className={styles.formCard}>
      {/* ── HEADER ── */}
      <div className={styles.formHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <FiCalendar size={22} />
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{monthName}</h2>
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
      ) : loadError ? (
        <div className={styles.errorNotice} role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => setLoadNonce((value) => value + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Day Names */}
          <div className={styles.calendarWeekdays}>
            {weekDays.map((w) => (
              <div key={w} className={styles.calendarWeekday}>
                {w}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className={styles.calendarGrid}>
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty_${idx}`} className={styles.calendarDayEmpty} aria-hidden="true" />;
              }

              const entry = entriesMap[cell.dateStr];
              const isToday = cell.dateStr === todayStr;
              const moodInfo = entry ? MOOD_META[entry.mood] || MOOD_META.good : null;

              return (
                <button
                  type="button"
                  key={cell.dateStr}
                  onClick={() => handleCellClick(cell.dateStr)}
                  className={`${styles.calendarCellActive} ${isToday ? styles.calendarDayToday : ""} ${entry ? styles.calendarDayHasEntry : ""}`}
                  title={
                    entry
                      ? `Click to view entry for ${cell.dateStr}: ${entry.title || "Logged"}`
                      : `Click to log entry for ${cell.dateStr}`
                  }
                  aria-label={
                    entry
                      ? `${cell.dateStr}: ${entry.title || "Journal entry"}, mood ${moodInfo.label}`
                      : `${cell.dateStr}: no journal entry`
                  }
                >
                  {/* Top row: day number + mood icon */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontWeight: isToday ? 900 : 800,
                        fontSize: "0.95rem",
                        color: isToday ? "var(--color-accent-primary, #10b981)" : "inherit",
                      }}
                    >
                      {cell.day}
                    </span>

                    {entry && moodInfo && (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                        title={`Mood: ${moodInfo.label}`}
                      >
                        {moodInfo.icon}
                      </span>
                    )}
                  </div>

                  {/* Middle / Bottom info */}
                  {entry ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.74rem" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.title || "Daily Log"}
                      </span>

                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                        {entry.productivityHours > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700 }}>
                            <FiZap size={10} color="#10b981" /> {entry.productivityHours}h
                          </span>
                        )}
                        {entry.learningHours > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700 }}>
                            <FiBook size={10} color="#3b82f6" /> {entry.learningHours}h
                          </span>
                        )}
                        {entry.content && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "var(--color-text-secondary)" }}>
                            <FiFileText size={10} /> note
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", alignSelf: "flex-start" }}>
                      + Add
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAY DETAILS MODAL ── */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.25rem" }}>
                  {selectedEntry
                    ? selectedEntry.title || `Journal Entry - ${selectedDate}`
                    : `Journal for ${formatDateNice(selectedDate)}`}
                </h3>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span className={styles.subtitle} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
                    <FiCalendar size={13} /> {formatDateNice(selectedDate)}
                  </span>
                  {selectedEntry && (
                    <span className={styles.subtitle} style={{ fontWeight: 600 }}>
                      • Template: <strong>{getTemplateDisplayName(selectedEntry, templates)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {selectedEntry && (
                  <span
                    className={styles.badge}
                    style={{
                      background: (MOOD_META[selectedEntry.mood] || MOOD_META.good).color,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    {(MOOD_META[selectedEntry.mood] || MOOD_META.good).icon}
                    {(MOOD_META[selectedEntry.mood] || MOOD_META.good).label}
                    {selectedEntry.moodScore ? ` (${selectedEntry.moodScore}/5)` : ""}
                  </span>
                )}
                <button className={styles.closeBtn} onClick={handleCloseModal} title="Close modal">
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {selectedEntry ? (
                /* Full details of everything noted */
                <JournalEntryDetail entry={selectedEntry} templates={templates} />
              ) : (
                /* Empty state */
                <div style={{ textAlign: "center", padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "2.5rem" }}>📝</div>
                  <h3 style={{ margin: 0 }}>No Journal Entry for this Date</h3>
                  <p className={styles.subtitle} style={{ maxWidth: "420px" }}>
                    You haven't logged notes, reflections, or habits for {formatDateNice(selectedDate)}.
                  </p>
                  <button
                    className={`${styles.tabBtn} ${styles.tabActive}`}
                    onClick={() => {
                      setIsModalOpen(false);
                      onSelectDate(selectedDate);
                    }}
                  >
                    <FiPlus size={16} /> Write Daily Journal Entry
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              {selectedEntry ? (
                <>
                  <button
                    className={styles.tabBtn}
                    style={{ background: "#ef4444", color: "#ffffff" }}
                    onClick={handleDeleteEntry}
                  >
                    <FiTrash2 size={15} /> Delete Entry
                  </button>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className={styles.tabBtn} onClick={handleCloseModal}>
                      Close
                    </button>
                    <button
                      className={`${styles.tabBtn} ${styles.tabActive}`}
                      onClick={() => {
                        setIsModalOpen(false);
                        onSelectDate(selectedDate);
                      }}
                    >
                      <FiEdit3 size={15} /> Edit in Daily Journal
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                  <button className={styles.tabBtn} onClick={handleCloseModal}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
