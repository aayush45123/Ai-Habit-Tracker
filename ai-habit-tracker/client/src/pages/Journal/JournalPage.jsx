import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "../../components/Journal/Journal.module.css";
import JournalEntryForm from "../../components/Journal/JournalEntryForm";
import JournalFeed from "../../components/Journal/JournalFeed";
import JournalCalendar from "../../components/Journal/JournalCalendar";
import JournalAnalytics from "../../components/Journal/JournalAnalytics";
import JournalReports from "../../components/Journal/JournalReports";
import JournalTemplatesManager from "../../components/Journal/JournalTemplatesManager";

import {
  FiBookOpen,
  FiList,
  FiCalendar,
  FiTrendingUp,
  FiFileText,
  FiSliders,
  FiZap,
  FiAward,
} from "react-icons/fi";

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState("form");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState({
    totalEntries: 0,
    currentStreak: 0,
    avgMoodScore: 0,
    avgProductivity: 0,
  });

  useEffect(() => {
    fetchHeaderSummary();
  }, []);

  async function fetchHeaderSummary() {
    try {
      const res = await api.get("/journal/analytics");
      if (res.data && res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to load journal summary:", err);
    }
  }

  const handleSelectDateForEdit = (dateStr) => {
    setTargetDate(dateStr);
    setActiveTab("form");
  };

  return (
    <div className={styles.journalContainer}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Growth Journal & Intelligence</h1>
          <p className={styles.subtitle}>
            Transform your daily reflections, study notes, fitness, and mood logs into intelligent, data-driven self-improvement insights.
          </p>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{summary.totalEntries}</span>
          <span className={styles.statLabel}>Journal Entries</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>🔥 {summary.currentStreak} Days</span>
          <span className={styles.statLabel}>Journaling Streak</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>⭐ {summary.avgMoodScore} / 5</span>
          <span className={styles.statLabel}>Avg Mood Score</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>⚡ {summary.avgProductivity} h</span>
          <span className={styles.statLabel}>Avg Daily Productivity</span>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === "form" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("form")}
        >
          <FiBookOpen size={16} /> Daily Journal
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "feed" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          <FiList size={16} /> Timeline Feed
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "calendar" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          <FiCalendar size={16} /> Calendar View
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "analytics" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <FiTrendingUp size={16} /> Intelligence & Correlations
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "reports" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <FiFileText size={16} /> Reports
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === "templates" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <FiSliders size={16} /> Templates
        </button>
      </div>

      {/* ── TAB CONTENT RENDER ── */}
      {activeTab === "form" && (
        <JournalEntryForm initialDate={targetDate} onSaved={fetchHeaderSummary} />
      )}

      {activeTab === "feed" && <JournalFeed onSelectEdit={handleSelectDateForEdit} />}

      {activeTab === "calendar" && <JournalCalendar onSelectDate={handleSelectDateForEdit} />}

      {activeTab === "analytics" && <JournalAnalytics />}

      {activeTab === "reports" && <JournalReports />}

      {activeTab === "templates" && <JournalTemplatesManager />}
    </div>
  );
}
