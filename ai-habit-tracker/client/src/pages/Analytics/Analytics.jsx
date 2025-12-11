import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./Analytics.module.css";

import { Line, Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Analytics() {
  const [weekly, setWeekly] = useState({});
  const [bestDay, setBestDay] = useState("");
  const [dayCount, setDayCount] = useState({});
  const [dailyCompletion, setDailyCompletion] = useState({});
  const [consistencyScore, setConsistencyScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await api.get("/habits/analytics/all");
      setWeekly(res.data.weekly);
      setBestDay(res.data.bestDay);
      setDayCount(res.data.dayCount);
      setDailyCompletion(res.data.dailyCompletion || {});
      setConsistencyScore(res.data.consistencyScore || 0);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className={styles.root}>Loading analytics…</div>;

  // WEEKLY CHART
  const weeklyLabels = Object.keys(weekly).map((d) =>
    new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  );
  const weeklyValues = Object.values(weekly);

  // PIE CHART DATA FOR DAY-WISE PERFORMANCE
  const pieLabels = Object.keys(dayCount);
  const pieValues = Object.values(dayCount);

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        label: "Habits Completed",
        data: pieValues,
        backgroundColor: [
          "#7C3AED",
          "#22D3EE",
          "#FACC15",
          "#FB7185",
          "#34D399",
          "#F472B6",
          "#60A5FA",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#475569", font: { size: 14 } },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // DAILY COMPLETION CALENDAR
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const lastDay = new Date(year, month + 1, 0).getDate();
  const todayISO = new Date().toISOString().split("T")[0];

  const monthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Create calendar grid with proper week layout
  const calendarWeeks = [];
  let currentWeek = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ isEmpty: true });
  }

  // Add all days of the month
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    let status = "empty";

    if (dailyCompletion[iso] !== undefined) {
      const percent = dailyCompletion[iso];
      status = percent >= 60 ? "good" : "bad";
    }

    if (iso > todayISO) status = "future";

    currentWeek.push({ iso, day: d, status });

    // If Sunday (end of week) or last day of month, push week and start new
    if (currentWeek.length === 7) {
      calendarWeeks.push([...currentWeek]);
      currentWeek = [];
    }
  }

  // Add remaining empty cells to complete last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ isEmpty: true });
    }
    calendarWeeks.push(currentWeek);
  }

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Analytics</h2>
        <p className={styles.subtitle}>Track your habit performance</p>
      </div>

      <div className={styles.chartsGrid}>
        {/* WEEKLY TREND LINE CHART */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Weekly Trend</h3>
            <span className={styles.badge}>LAST 7 DAYS</span>
          </div>

          <div className={styles.chartWrapper}>
            <Line
              data={{
                labels: weeklyLabels,
                datasets: [
                  {
                    label: "Completed",
                    data: weeklyValues,
                    borderColor: "#8b5cf6",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        {/* DAY-WISE PIE CHART */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Day-wise Performance</h3>
            <span className={styles.badge}>PIE CHART</span>
          </div>

          <div className={styles.chartWrapper}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* HABIT SUCCESS LEADERBOARD */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Habit Success Leaderboard</h3>
            <span className={styles.badge}>Top Performers</span>
          </div>

          <div className={styles.leaderboard}>
            {leaderboard.length > 0 ? (
              leaderboard.map((item, i) => (
                <div key={i} className={styles.leadRow}>
                  <span className={styles.leadRank}>{i + 1}</span>
                  <span className={styles.leadName}>{item.habit}</span>
                  <span className={styles.leadPercent}>
                    {item.completionRate}%
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.emptyLeaderboard}>
                No habits tracked yet
              </div>
            )}
          </div>
        </div>

        {/* CALENDAR */}
        <div className={styles.calendarCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Daily Completion Calendar</h3>
            <span className={styles.badge}>{monthName}</span>
          </div>

          {/* Day Headers */}
          <div className={styles.calendarDayHeaders}>
            <div className={styles.dayHeader}>SUN</div>
            <div className={styles.dayHeader}>MON</div>
            <div className={styles.dayHeader}>TUE</div>
            <div className={styles.dayHeader}>WED</div>
            <div className={styles.dayHeader}>THU</div>
            <div className={styles.dayHeader}>FRI</div>
            <div className={styles.dayHeader}>SAT</div>
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className={styles.calendarWeek}>
                {week.map((cell, cellIdx) => (
                  <div
                    key={cellIdx}
                    className={`${styles.calendarCell} ${
                      cell.isEmpty ? styles.emptyCell : ""
                    }`}
                  >
                    {!cell.isEmpty && (
                      <>
                        <div className={styles.calendarDate}>{cell.day}</div>
                        <div className={styles.calendarStatus}>
                          {cell.status === "good" && (
                            <div className={styles.checkMark}>✔</div>
                          )}
                          {cell.status === "bad" && (
                            <div className={styles.crossMark}>✖</div>
                          )}
                          {cell.status === "empty" && (
                            <div className={styles.emptyCircle}></div>
                          )}
                          {cell.status === "future" && (
                            <div className={styles.futureCircle}></div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BEST DAY */}
      <div className={styles.highlight}>
        <span className={styles.highlightIcon}></span>
        <span className={styles.highlightText}>
          Best Day: <strong className={styles.highlightValue}>{bestDay}</strong>
        </span>
      </div>
    </div>
  );
}
