import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { FiSearch, FiTrash2, FiDownload, FiEdit3, FiSmile, FiZap, FiBookOpen } from "react-icons/fi";

export default function JournalFeed({ onSelectEdit }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    fetchFeed();
  }, [search, moodFilter, tagFilter]);

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
      .map(
        (e) => `# Journal Entry - ${e.date}
**Title:** ${e.title || "Untitled"}
**Mood:** ${e.mood} | **Energy:** ${e.energyLevel}/5 | **Stress:** ${e.stressLevel}/5
**Productivity:** ${e.productivityHours} hrs | **Study:** ${e.learningHours} hrs | **Sleep:** ${e.sleepHours} hrs

${e.content ? `## Notes\n${e.content}\n` : ""}
${e.biggestAchievement ? `**Biggest Achievement:** ${e.biggestAchievement}\n` : ""}
${e.learningLog ? `**Learning Log:** ${e.learningLog}\n` : ""}
${e.lessonsLearned ? `**Lessons Learned:** ${e.lessonsLearned}\n` : ""}
---
`
      )
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
          {entries.map((e) => (
            <div key={e._id} className={styles.feedCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0" }}>{e.title || `Entry for ${e.date}`}</h3>
                  <span className={styles.subtitle}>{e.date} • Template: {e.templateType}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className={styles.badge}>{e.mood || "good"}</span>
                  <button
                    className={styles.tabBtn}
                    style={{ padding: "0.4rem 0.6rem" }}
                    onClick={() => onSelectEdit(e.date)}
                    title="Edit Entry"
                  >
                    <FiEdit3 size={14} />
                  </button>
                  <button
                    className={styles.tabBtn}
                    style={{ padding: "0.4rem 0.6rem", background: "#ef4444", color: "#fff" }}
                    onClick={() => handleDelete(e._id)}
                    title="Delete Entry"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", fontWeight: 700 }}>
                <span>⚡ Productivity: {e.productivityHours || 0}h</span>
                <span>📚 Study: {e.learningHours || 0}h</span>
                <span>😴 Sleep: {e.sleepHours || 0}h</span>
                <span>💧 Water: {e.waterIntake || 0}L</span>
                {e.weight > 0 && <span>⚖️ Weight: {e.weight}kg</span>}
                {e.steps > 0 && <span>👟 Steps: {e.steps}</span>}
              </div>

              {/* Text content preview */}
              {e.content && (
                <div style={{ background: "var(--color-bg-primary)", padding: "1rem", border: "1px solid var(--color-border)" }}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{e.content}</p>
                </div>
              )}

              {/* Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.85rem" }}>
                {e.biggestAchievement && (
                  <div>
                    <strong>🏆 Achievement:</strong> {e.biggestAchievement}
                  </div>
                )}
                {e.learningLog && (
                  <div>
                    <strong>💡 Learning:</strong> {e.learningLog}
                  </div>
                )}
                {e.workoutSummary && (
                  <div>
                    <strong>🏋️ Workout:</strong> {e.workoutSummary}
                  </div>
                )}
                {e.lessonsLearned && (
                  <div>
                    <strong>📖 Lesson:</strong> {e.lessonsLearned}
                  </div>
                )}
              </div>

              {/* Tags */}
              {e.tags && e.tags.length > 0 && (
                <div className={styles.tagList}>
                  {e.tags.map((t, idx) => (
                    <span key={idx} className={styles.tagItem}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
