import React from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import styles from "./TimetableAnalyticsPanel.module.css";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function TimetableAnalyticsPanel({ analytics, loading }) {
  const summary = analytics?.summary || {};
  const recentTrend = analytics?.recentTrend || [];
  const weekdayPerformance = analytics?.weekdayPerformance || [];
  const focusAreaPerformance = analytics?.focusAreaPerformance || [];
  const insights = analytics?.insights || {};

  if (loading && !analytics) {
    return <div className={styles.loading}>Loading timetable analytics...</div>;
  }

  if (!analytics) {
    return (
      <section className={styles.root}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Analytics</span>
            <h3 className={styles.title}>Checkpoint Intelligence</h3>
          </div>
        </div>
        <div className={styles.emptyState}>
          Save a checkpoint to unlock timetable analytics.
        </div>
      </section>
    );
  }

  const trendData = {
    labels: recentTrend.map((item) => item.label),
    datasets: [
      {
        label: "Correct",
        data: recentTrend.map((item) => item.correct),
        borderColor: "#14532d",
        backgroundColor: "rgba(20, 83, 45, 0.12)",
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
      },
      {
        label: "Missed",
        data: recentTrend.map((item) => item.missed),
        borderColor: "#7f1d1d",
        backgroundColor: "rgba(127, 29, 29, 0.12)",
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
      },
    ],
  };

  const weekdayData = {
    labels: WEEKDAY_ORDER,
    datasets: [
      {
        label: "Correct",
        data: WEEKDAY_ORDER.map(
          (day) =>
            weekdayPerformance.find((item) => item.day === day)?.correct || 0,
        ),
        backgroundColor: "#14532d",
        borderRadius: 8,
      },
      {
        label: "Missed",
        data: WEEKDAY_ORDER.map(
          (day) =>
            weekdayPerformance.find((item) => item.day === day)?.missed || 0,
        ),
        backgroundColor: "#7f1d1d",
        borderRadius: 8,
      },
    ],
  };

  const focusData = {
    labels: focusAreaPerformance.map((item) => item.focusArea),
    datasets: [
      {
        data: focusAreaPerformance.map((item) => item.correct),
        backgroundColor: [
          "#14532d",
          "#1d4ed8",
          "#c2410c",
          "#7c3aed",
          "#0f766e",
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <span className={styles.kicker}>Analytics</span>
          <h3 className={styles.title}>Checkpoint Intelligence</h3>
          <p className={styles.subtitle}>
            Three views of the same timetable behavior: trend, weekday pattern,
            and focus-area performance.
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Adherence Rate</span>
          <strong className={styles.metricValue}>
            {summary.adherenceRate || 0}%
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Longest Streak</span>
          <strong className={styles.metricValue}>
            {summary.longestStreak || 0}
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Best Day</span>
          <strong className={styles.metricValue}>
            {insights.bestDay || "N/A"}
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Best Focus</span>
          <strong className={styles.metricValue}>
            {insights.bestFocusArea || "N/A"}
          </strong>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>7-Day Checkpoint Trend</h4>
            <span className={styles.chartBadge}>LINE</span>
          </div>
          <div className={styles.chartWrap}>
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>Weekday Compliance</h4>
            <span className={styles.chartBadge}>BAR</span>
          </div>
          <div className={styles.chartWrap}>
            <Bar
              data={weekdayData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: {
                  x: { stacked: true },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>Focus Area Conversion</h4>
            <span className={styles.chartBadge}>DOUGHNUT</span>
          </div>
          <div className={styles.chartWrap}>
            {focusAreaPerformance.length > 0 ? (
              <Doughnut
                data={focusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            ) : (
              <div className={styles.emptyChart}>No focus-area data yet.</div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
