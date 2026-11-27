import React, { lazy, Suspense } from "react";
import styles from "./TimetableAnalyticsPanel.module.css";
import { Skeleton } from "../../components/Skeleton/Skeleton.jsx";

// ── chart.js is HUGE — lazy-load it so Timetable page stays fast ─────────────
const TimetableCharts = lazy(() => import("./TimetableCharts.jsx"));

function ChartSkeleton() {
  return <Skeleton height="220px" width="100%" variant="rect" />;
}

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
          if (day.status === "rest") return "#d4d4d4";
          if (day.status === "completed") return "#000000";
          if (day.status === "partial") return "#555555";
          if (day.status === "missed") return "#a3a3a3";
          return "#888888";
        }),
        borderRadius: 4,
      },
    ],
  };

  const eightWeekTrendData = {
    labels: last8WeeksAdherenceTrend.map((week) => week.week),
    datasets: [
      {
        label: "Adherence %",
        data: last8WeeksAdherenceTrend.map((week) => week.adherence),
        borderColor: "#000000",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
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
          "#000000",
          "#2b2b2b",
          "#525252",
          "#737373",
          "#999999",
          "#bfbfbf",
          "#e5e5e5",
        ],
        borderWidth: 1,
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
            <Suspense fallback={<ChartSkeleton />}>
              <TimetableCharts type="bar" data={weeklyCompletionData} />
            </Suspense>
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>8-Week Adherence Trend</h4>
            <span className={styles.chartBadge}>TREND</span>
          </div>
          <div className={styles.chartWrap}>
            <Suspense fallback={<ChartSkeleton />}>
              <TimetableCharts type="line" data={eightWeekTrendData} />
            </Suspense>
          </div>
        </article>

        <article className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h4 className={styles.chartTitle}>Focus Distribution</h4>
            <span className={styles.chartBadge}>PLAN</span>
          </div>
          <div className={styles.chartWrap}>
            <Suspense fallback={<ChartSkeleton />}>
              <TimetableCharts type="doughnut" data={focusDistributionData} />
            </Suspense>
          </div>
        </article>
      </div>
    </section>
  );
}
