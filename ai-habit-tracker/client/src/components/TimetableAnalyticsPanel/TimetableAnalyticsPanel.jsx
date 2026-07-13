import React from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import styles from "./TimetableAnalyticsPanel.module.css";
import { Skeleton } from "../../components/Skeleton/Skeleton.jsx";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export default function TimetableAnalyticsPanel({ analytics, loading }) {
  const summary = analytics?.summary || {};
  const weeklyCompletionSeries = analytics?.weeklyCompletionSeries || [];
  const last8WeeksAdherenceTrend = analytics?.last8WeeksAdherenceTrend || [];
  const focusDistribution = analytics?.focusDistribution || {};

  if (loading && !analytics) {
    return (
      <section className={styles.root}>
        {/* Header skeleton */}
        <div className={styles.header}>
          <div className={styles.skeletonHeaderStack}>
            <Skeleton height="14px" width="140px" variant="rounded" />
            <Skeleton height="26px" width="260px" variant="rect" />
            <Skeleton height="14px" width="340px" variant="rounded" />
          </div>
        </div>

        {/* Metric cards skeleton */}
        <div className={styles.metricsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.metricCard}>
              <Skeleton height="14px" width="70%" variant="rounded" />
              <Skeleton height="32px" width="50%" variant="rect" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className={styles.chartsGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <Skeleton height="20px" width="55%" variant="rect" />
                <Skeleton height="20px" width="60px" variant="rect" />
              </div>
              <Skeleton height="220px" width="100%" variant="rect" />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (!analytics) {
    return (
      <section className={styles.root}>
        <div className={styles.header}>
          <span className={styles.kicker}>Workout Analytics</span>
          <h3 className={styles.title}>Adherence Intelligence</h3>
        </div>
        <div className={styles.emptyState}>
          Finalize a workout log to unlock weekly adherence and trend analysis.
        </div>
      </section>
    );
  }

  const weeklyCompletionData = {
    labels: weeklyCompletionSeries.map((day) => day.label),
    datasets: [
      {
        label: "Completion %",
        data: weeklyCompletionSeries.map((day) => day.percentage),
        backgroundColor: weeklyCompletionSeries.map((day) => {
          if (day.status === "rest") return "#64748b";
          if (day.status === "completed") return "#14532d";
          if (day.status === "partial") return "#b45309";
          if (day.status === "missed") return "#7f1d1d";
          return "#94a3b8";
        }),
        borderRadius: 8,
      },
    ],
  };

  const eightWeekTrendData = {
    labels: last8WeeksAdherenceTrend.map((week) => week.week),
    datasets: [
      {
        label: "Adherence %",
        data: last8WeeksAdherenceTrend.map((week) => week.adherence),
        borderColor: "#14532d",
        backgroundColor: "rgba(20, 83, 45, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 4,
      },
    ],
  };

  const focusDistributionData = {
    labels: Object.keys(focusDistribution),
    datasets: [
      {
        data: Object.values(focusDistribution),
        backgroundColor: [
          "#14532d",
          "#1d4ed8",
          "#c2410c",
          "#7c3aed",
          "#0f766e",
          "#dc2626",
          "#64748b",
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <span className={styles.kicker}>Workout Analytics</span>
          <h3 className={styles.title}>Adherence Intelligence</h3>
          <p className={styles.subtitle}>
            Stored workout logs power the key signals below: adherence, exercise
            completion, streak, missed workouts, and the 8-week trend.
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Weekly Adherence</span>
          <strong className={styles.metricValue}>
            {summary.weeklyAdherence || 0}%
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Exercise Completion</span>
          <strong className={styles.metricValue}>
            {summary.exerciseCompletionRate || 0}%
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Current Streak</span>
          <strong className={styles.metricValue}>
            {summary.currentWorkoutStreak || 0}
          </strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Missed Workouts</span>
          <strong className={styles.metricValue}>
            {summary.missedWorkouts || 0}
          </strong>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>Weekly Completion</h4>
            <span className={styles.chartBadge}>7 DAYS</span>
          </div>
          <div className={styles.chartWrap}>
            <Bar
              data={weeklyCompletionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (value) => `${value}%` },
                  },
                },
              }}
            />
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>8-Week Adherence Trend</h4>
            <span className={styles.chartBadge}>TREND</span>
          </div>
          <div className={styles.chartWrap}>
            <Line
              data={eightWeekTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (value) => `${value}%` },
                  },
                },
              }}
            />
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>Focus Distribution</h4>
            <span className={styles.chartBadge}>PLAN</span>
          </div>
          <div className={styles.chartWrap}>
            <Doughnut
              data={focusDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
