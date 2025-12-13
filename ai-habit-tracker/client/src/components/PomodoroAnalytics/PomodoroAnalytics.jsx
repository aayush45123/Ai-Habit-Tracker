// src/pages/Focus/PomodoroAnalytics.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./PomodoroAnalytics.module.css";

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function formatDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function PomodoroAnalytics() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchStats();
  }, [days]);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await api.get(`/focus/stats?days=${days}`);
      setStats(res.data.docs || []);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalSessions = stats.reduce((acc, s) => acc + (s.count || 0), 0);
  // Total minutes should only include completed sessions
  const totalMinutes = stats.reduce((acc, s) => acc + (s.totalMin || 0), 0);
  const totalSkipped = stats.reduce((acc, s) => acc + (s.skipped || 0), 0);
  // Use the selected days count for average calculation, not stats.length
  const avgPerDay = days > 0 ? (totalSessions / days).toFixed(1) : 0;

  // Calculate max for progress bar scaling
  const maxSessions = Math.max(
    ...stats.map((s) => (s.count || 0) + (s.skipped || 0)),
    1
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Focus Analytics</h2>
        <div className={styles.controls}>
          <button
            className={`${styles.btn} ${days === 7 ? styles.btnActive : ""}`}
            onClick={() => setDays(7)}
          >
            7 Days
          </button>
          <button
            className={`${styles.btn} ${days === 14 ? styles.btnActive : ""}`}
            onClick={() => setDays(14)}
          >
            14 Days
          </button>
          <button
            className={`${styles.btn} ${days === 30 ? styles.btnActive : ""}`}
            onClick={() => setDays(30)}
          >
            30 Days
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading analytics...</div>
      ) : stats.length === 0 ? (
        <div className={styles.empty}>
          No focus sessions recorded yet. Start your first Pomodoro session!
        </div>
      ) : (
        <div className={styles.statsContainer}>
          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Sessions</div>
              <div className={styles.summaryValue}>{totalSessions}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Minutes</div>
              <div className={styles.summaryValue}>{totalMinutes}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Skipped Sessions</div>
              <div className={styles.summaryValue}>{totalSkipped}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Avg Per Day</div>
              <div className={styles.summaryValue}>{avgPerDay}</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.colDate}>Date</div>
              <div className={styles.colStat}>Minutes</div>
              <div className={styles.colStat}>Completed</div>
              <div className={styles.colStat}>Skipped</div>
              <div className={styles.colProgress}>Progress</div>
            </div>

            {stats.map((stat) => {
              const completed = stat.count || 0;
              const skipped = stat.skipped || 0;
              const total = completed + skipped;
              const completedPercent =
                total > 0 ? (completed / maxSessions) * 100 : 0;
              const skippedPercent =
                total > 0 ? (skipped / maxSessions) * 100 : 0;

              const isToday =
                stat._id === new Date().toISOString().split("T")[0];

              return (
                <div
                  key={stat._id}
                  className={`${styles.tableRow} ${
                    isToday ? styles.tableRowToday : ""
                  }`}
                >
                  <div className={styles.colDate}>
                    <div className={styles.dateMain}>
                      {formatDate(stat._id)}
                      {isToday && (
                        <span className={styles.todayBadge}>Today</span>
                      )}
                    </div>
                    <div className={styles.dateSub}>
                      {formatDayOfWeek(stat._id)}
                    </div>
                  </div>
                  <div className={styles.colStat}>
                    <div className={styles.statValue}>{stat.totalMin || 0}</div>
                    <div className={styles.statLabel}>min</div>
                  </div>
                  <div className={styles.colStat}>
                    <div className={styles.statValue}>{completed}</div>
                    <div className={styles.statLabel}>sessions</div>
                  </div>
                  <div className={styles.colStat}>
                    <div className={styles.statValue}>{skipped}</div>
                    <div className={styles.statLabel}>sessions</div>
                  </div>
                  <div className={styles.colProgress}>
                    <div className={styles.progressBarContainer}>
                      {completed > 0 && (
                        <div
                          className={`${styles.progressBarFill} ${styles.progressBarCompleted}`}
                          style={{ width: `${completedPercent}%` }}
                        >
                          <span className={styles.progressLabel}>
                            {completed}
                          </span>
                        </div>
                      )}
                      {skipped > 0 && (
                        <div
                          className={`${styles.progressBarFill} ${styles.progressBarSkipped}`}
                          style={{ width: `${skippedPercent}%` }}
                        >
                          <span className={styles.progressLabel}>
                            {skipped}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div
                className={`${styles.legendColor} ${styles.legendCompleted}`}
              ></div>
              <span>Completed Sessions</span>
            </div>
            <div className={styles.legendItem}>
              <div
                className={`${styles.legendColor} ${styles.legendSkipped}`}
              ></div>
              <span>Skipped Sessions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
