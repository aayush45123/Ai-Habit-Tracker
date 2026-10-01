import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import JournalEntryDetail, { getTemplateDisplayName, getFieldLabel } from "./JournalEntryDetail";
import {
  FiSearch,
  FiTrash2,
  FiDownload,
  FiEdit3,
  FiCalendar,
  FiSmile,
  FiThumbsUp,
  FiMeh,
  FiThumbsDown,
  FiAlertCircle,
} from "react-icons/fi";

const MOOD_META = {
  great: { label: "Great", color: "#10b981", bg: "#d1fae5", icon: <FiThumbsUp size={13} /> },
  good: { label: "Good", color: "#3b82f6", bg: "#dbeafe", icon: <FiSmile size={13} /> },
  neutral: { label: "Neutral", color: "#f59e0b", bg: "#fef3c7", icon: <FiMeh size={13} /> },
  bad: { label: "Bad", color: "#ef4444", bg: "#fee2e2", icon: <FiThumbsDown size={13} /> },
  terrible: { label: "Terrible", color: "#991b1b", bg: "#fee2e2", icon: <FiAlertCircle size={13} /> },
};

function formatDateNice(dateStr) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function JournalFeed({ onSelectEdit }) {
  const [entries, setEntries] = useState([]);
  const [templates, setTemplates] = useState({ systemTemplates: [], customTemplates: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [search, moodFilter, tagFilter]);

  async function fetchTemplates() {
    try {
      const res = await api.get("/journal/templates");
      setTemplates(res.data || { systemTemplates: [], customTemplates: [] });
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }

  async function fetchFeed() {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (moodFilter) params.mood = moodFilter;
      if (tagFilter) params.tag = tagFilter;

      const res = await api.get("/journal/entries", { params });
      setEntries(res.data.entries || []);
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await api.delete(`/journal/entries/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  }

  function exportMarkdown() {
    const mdContent = entries
      .map((e) => {
        const priorities = Array.isArray(e.topPriorities)
          ? e.topPriorities.filter(Boolean)
          : typeof e.topPriorities === "string"
          ? e.topPriorities.split("\n").filter(Boolean)
          : [];

        const gratitudeList = Array.isArray(e.gratitude)
          ? e.gratitude.filter(Boolean)
          : typeof e.gratitude === "string"
          ? e.gratitude.split("\n").filter(Boolean)
          : [];

        const customLines =
          e.customFieldsData && typeof e.customFieldsData === "object"
            ? Object.entries(e.customFieldsData)
                .filter(([_, v]) => v !== undefined && v !== null && v !== "")
                .map(([k, v]) => `**${getFieldLabel(k, templates)}:** ${v}`)
                .join("\n")
            : "";

        return `# Journal Entry - ${e.date} (${formatDateNice(e.date)})
**Title:** ${e.title || "Untitled"}
**Template:** ${getTemplateDisplayName(e, templates)}
**Mood:** ${e.mood} (${e.moodScore || 4}/5) | **Energy:** ${e.energyLevel || 3}/5 | **Stress:** ${e.stressLevel || 2}/5
**Productivity:** ${e.productivityHours || 0} hrs | **Study:** ${e.learningHours || 0} hrs | **Sleep:** ${e.sleepHours || 0} hrs
${e.waterIntake ? `**Water Intake:** ${e.waterIntake} L\n` : ""}${e.weight ? `**Weight:** ${e.weight} kg\n` : ""}${e.steps ? `**Steps:** ${e.steps}\n` : ""}${e.caloriesBurned ? `**Calories Burned:** ${e.caloriesBurned} kcal\n` : ""}
${e.todayGoal ? `## Today's Goal\n${e.todayGoal}\n` : ""}
${priorities.length > 0 ? `## Top Priorities\n${priorities.map((p) => `- [ ] ${p}`).join("\n")}\n` : ""}
${e.content ? `## Notes & Reflections\n${e.content}\n` : ""}
${e.biggestAchievement ? `**Biggest Achievement:** ${e.biggestAchievement}\n` : ""}${e.learningLog ? `**Learning Log:** ${e.learningLog}\n` : ""}${e.lessonsLearned ? `**Lessons Learned:** ${e.lessonsLearned}\n` : ""}${e.mistakesMade ? `**Mistakes Made:** ${e.mistakesMade}\n` : ""}${e.challengesFaced ? `**Challenges Faced:** ${e.challengesFaced}\n` : ""}${e.workoutSummary ? `**Workout:** ${e.workoutSummary}\n` : ""}${gratitudeList.length > 0 ? `**Gratitude:**\n${gratitudeList.map((g) => `- ${g}`).join("\n")}\n` : ""}${e.tomorrowsFocus ? `**Tomorrow's Focus:** ${e.tomorrowsFocus}\n` : ""}
${customLines ? `## Template Specific Details\n${customLines}\n` : ""}
${e.tags && e.tags.length > 0 ? `**Tags:** ${e.tags.map((t) => `#${t}`).join(" ")}\n` : ""}
---
`;
      })
      .join("\n\n");

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HabitAI_Journal_Export_${new Date().toISOString().split("T")[0]}.md`;
    a.click();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HabitAI_Journal_Export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Controls Bar */}
      <div className={styles.feedControls}>
        <div style={{ flex: 1, position: "relative", minWidth: "240px" }}>
          <input
            type="text"
            className={styles.input}
            style={{ width: "100%" }}
            placeholder="Search entries by title, notes, achievements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className={styles.select} value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}>
          <option value="">All Moods</option>
          <option value="great">Great</option>
          <option value="good">Good</option>
          <option value="neutral">Neutral</option>
          <option value="bad">Bad</option>
          <option value="terrible">Terrible</option>
        </select>

        <button className={styles.tabBtn} onClick={exportMarkdown} title="Export as Markdown">
          <FiDownload /> Export MD
        </button>

        <button className={styles.tabBtn} onClick={exportJSON} title="Export as JSON">
          <FiDownload /> Export JSON
        </button>
      </div>

      {/* Feed List */}
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading journal feed...</div>
      ) : entries.length === 0 ? (
        <div className={styles.formCard} style={{ textAlign: "center" }}>
          <h3>No Journal Entries Found</h3>
          <p className={styles.subtitle}>Try clearing your filters or create your first daily entry!</p>
        </div>
      ) : (
        <div className={styles.feedGrid}>
          {entries.map((e) => {
            const moodInfo = MOOD_META[e.mood] || MOOD_META.good;
            const tplName = getTemplateDisplayName(e, templates);

            return (
              <div key={e._id} className={styles.feedCard}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div>
                    <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.3rem" }}>
                      {e.title || `Journal Entry - ${e.date}`}
                    </h3>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span
                        className={styles.subtitle}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}
                      >
                        <FiCalendar size={13} /> {formatDateNice(e.date)}
                      </span>
                      <span className={styles.subtitle} style={{ fontWeight: 600 }}>
                        • Template: <strong>{tplName}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span
                      className={styles.badge}
                      style={{
                        background: moodInfo.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      {moodInfo.icon}
                      {moodInfo.label} {e.moodScore ? `(${e.moodScore}/5)` : ""}
                    </span>

                    <button
                      className={styles.tabBtn}
                      style={{ padding: "0.45rem 0.65rem" }}
                      onClick={() => onSelectEdit(e.date)}
                      title="Edit Entry"
                    >
                      <FiEdit3 size={15} />
                    </button>
                    <button
                      className={styles.tabBtn}
                      style={{ padding: "0.45rem 0.65rem", background: "#ef4444", color: "#fff" }}
                      onClick={() => handleDelete(e._id)}
                      title="Delete Entry"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Proper full content details */}
                <JournalEntryDetail entry={e} templates={templates} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
