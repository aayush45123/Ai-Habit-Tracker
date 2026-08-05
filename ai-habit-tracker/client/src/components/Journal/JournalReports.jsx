import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { FiFileText, FiAward, FiAlertCircle, FiCheckCircle, FiCalendar, FiTrendingUp } from "react-icons/fi";

export default function JournalReports() {
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState("weekly");

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      const [wRes, mRes] = await Promise.all([
        api.get("/journal/reports/weekly"),
        api.get("/journal/reports/monthly"),
      ]);
      setWeekly(wRes.data);
      setMonthly(mRes.data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Generating reports...</div>;
  }

  const report = activeReport === "weekly" ? weekly : monthly;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Report Toggle */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          className={`${styles.tabBtn} ${activeReport === "weekly" ? styles.tabActive : ""}`}
          onClick={() => setActiveReport("weekly")}
        >
          <FiCalendar size={15} /> Weekly Performance Report
        </button>
        <button
          className={`${styles.tabBtn} ${activeReport === "monthly" ? styles.tabActive : ""}`}
          onClick={() => setActiveReport("monthly")}
        >
          <FiTrendingUp size={15} /> Monthly Growth Summary
        </button>
      </div>

      {report && (
        <div className={styles.reportCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 style={{ margin: "0 0 0.25rem 0", textTransform: "uppercase" }}>
                {activeReport === "weekly" ? "Weekly Executive Report" : "Monthly Progress Review"}
              </h2>
              <span className={styles.subtitle}>{report.period}</span>
            </div>
            <span className={styles.badge} style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>
              {activeReport === "weekly"
                ? `${report.habitCompletionRate}% Habit Rate`
                : `${report.habitConsistency}% Consistency`}
            </span>
          </div>

          {/* Key Metric Highlights */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Study Hours</span>
              <span className={styles.statValue}>{report.studyHours} hrs</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Workouts Completed</span>
              <span className={styles.statValue}>{report.workoutSessions || report.workoutsCount || 0}</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Weight Change</span>
              <span className={styles.statValue}>
                {report.weightChange > 0 ? `+${report.weightChange}` : report.weightChange} kg
              </span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Journal Entries</span>
              <span className={styles.statValue}>{report.entriesLogged || report.journalEntriesCount || 0}</span>
            </div>
          </div>

          {/* Wins & Accomplishments */}
          {report.wins && report.wins.length > 0 && (
            <div className={styles.fieldGroup}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <FiAward color="#10b981" /> Top Achievements This Week
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: "1.6" }}>
                {report.wins.map((w, idx) => (
                  <li key={idx}>
                    <strong>{w}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement / Common Mistakes */}
          {((report.improvements && report.improvements.length > 0) ||
            (report.commonMistakes && report.commonMistakes.length > 0)) && (
            <div className={styles.fieldGroup}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <FiAlertCircle color="#f59e0b" /> Key Takeaways & Lessons
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: "1.6" }}>
                {(report.improvements || report.commonMistakes).map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
