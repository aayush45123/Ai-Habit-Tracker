import React, { lazy, Suspense, useEffect, useState, useMemo } from "react";
import api from "../../utils/api.js";
import styles from "./AnalyticsPage.module.css";
import { Skeleton } from "../../components/Skeleton/Skeleton.jsx";
import { TrendingUp, TrendingDown, Minus, Flame, Target, CheckSquare, Zap } from "lucide-react";

// Recharts only downloaded when Analytics is visited
const AnalyticsCharts = lazy(() => import("./AnalyticsCharts.jsx"));

function ChartSkeleton({ height = "220px" }) {
  return <Skeleton height={height} width="100%" variant="rect" style={{ flex: 1 }} />;
}

// ── 30-day heatmap cell ──────────────────────────────────────────────────────
function HeatmapCell({ date, count, maxCount }) {
  const intensity = maxCount > 0 ? count / maxCount : 0;
  const opacity = count === 0 ? 0.08 : 0.2 + intensity * 0.8;
  const label = new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  return (
    <div
      className={styles.heatCell}
      style={{ "--heat-opacity": opacity }}
      title={`${label}: ${count} completion${count !== 1 ? "s" : ""}`}
    />
  );
}

// ── streak bar row ───────────────────────────────────────────────────────────
function StreakRow({ item, rank, maxStreak }) {
  const pct = maxStreak > 0 ? Math.round((item.currentStreak / maxStreak) * 100) : 0;
  return (
    <div className={styles.streakRow}>
      <span className={styles.streakRank}>{rank}</span>
      <div className={styles.streakInfo}>
        <div className={styles.streakMeta}>
          <span className={styles.streakName}>{item.habit}</span>
          <span className={styles.streakValues}>
            <span className={styles.streakCurrent}>🔥 {item.currentStreak}d</span>
            <span className={styles.streakBest}>Best: {item.longestStreak}d</span>
          </span>
        </div>
        <div className={styles.streakBarTrack}>
          <div className={styles.streakBarFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={styles.streakDone}>{item.totalDone}</span>
    </div>
  );
}

// ── summary stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={accent ? { background: accent } : {}}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className={styles.statBody}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await api.get("/habits/analytics/all");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── derived chart data ─────────────────────────────────────────────────────
  const charts = useMemo(() => {
    if (!data) return null;

    // Weekly trend
    const weeklyLabels = Object.keys(data.weekly || {}).map((d) =>
      new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        timeZone: "Asia/Kolkata",
      }),
    );
    const weeklyValues = Object.values(data.weekly || {});

    // Weekday performance bar (Mon–Sun order)
    const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekdayLabels = DAY_SHORT;
    const weekdayValues = DAY_ORDER.map((d) => (data.dayCount || {})[d] || 0);

    // 4-week momentum
    const momentumLabels = (data.fourWeekTrend || []).map((w) => w.week);
    const momentumValues = (data.fourWeekTrend || []).map((w) => w.rate);

    // Heatmap max count
    const heatMax = Math.max(...(data.thirtyDayActivity || []).map((d) => d.count), 1);

    // Week-over-week indicator
    const wc = data.summaryStats?.weekChange ?? data.weekChange ?? 0;
    const wcLabel =
      wc > 0 ? `+${wc}% vs last week` : wc < 0 ? `${wc}% vs last week` : "Same as last week";
    const wcColor = wc > 0 ? "#22c55e" : wc < 0 ? "#ef4444" : "#6b7280";

    return {
      weeklyLabels,
      weeklyValues,
      weekdayLabels,
      weekdayValues,
      momentumLabels,
      momentumValues,
      heatMax,
      wc,
      wcLabel,
      wcColor,
    };
  }, [data]);

  // ── loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.skeletonHeader}>
          <Skeleton height="36px" width="200px" variant="rect" />
          <Skeleton height="20px" width="260px" variant="rounded" />
        </div>
        <div className={styles.statRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="90px" width="100%" variant="rect" />
          ))}
        </div>
        <div className={styles.chartsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonCardHeader}>
                <Skeleton height="22px" width="55%" variant="rect" />
                <Skeleton height="22px" width="80px" variant="rect" />
              </div>
              <Skeleton height="220px" width="100%" variant="rect" style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ss = data?.summaryStats || {
    totalDone: 0,
    consistencyScore: 0,
    weekChange: 0,
    bestStreak: 0,
  };
  const streakLb = data?.streakLeaderboard || [];
  const maxStreak = streakLb.reduce((m, r) => Math.max(m, r.currentStreak), 0);

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Analytics</h2>
        <p className={styles.subtitle}>Deep insights into your habit performance</p>
      </div>

      {/* ── SUMMARY STAT CARDS ── */}
      <div className={styles.statRow}>
        <StatCard
          icon={CheckSquare}
          label="Total Completions"
          value={ss.totalDone}
          sub="all-time habit logs"
          accent="#000000"
        />
        <StatCard
          icon={Target}
          label="Consistency Score"
          value={`${ss.consistencyScore}%`}
          sub="last 30 days"
          accent="#000000"
        />
        <StatCard
          icon={ss.weekChange > 0 ? TrendingUp : ss.weekChange < 0 ? TrendingDown : Minus}
          label="Week-over-Week"
          value={`${ss.weekChange > 0 ? "+" : ""}${ss.weekChange}%`}
          sub={ss.weekChange > 0 ? "improving ↑" : ss.weekChange < 0 ? "declining ↓" : "steady →"}
          accent="#000000"
        />
        <StatCard
          icon={Flame}
          label="Best Streak Ever"
          value={`${ss.bestStreak}d`}
          sub="longest streak across habits"
          accent="#000000"
        />
      </div>

      {/* ── MAIN CHARTS GRID ── */}
      <div className={styles.chartsGrid}>

        {/* WEEKLY TREND */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Weekly Trend</h3>
            <span className={styles.badge}>LAST 7 DAYS</span>
          </div>
          <p className={styles.chartHint}>
            How many habits you completed each day this past week.
          </p>
          <div className={styles.chartWrapper}>
            <Suspense fallback={<ChartSkeleton />}>
              <AnalyticsCharts
                type="line"
                labels={charts?.weeklyLabels || []}
                values={charts?.weeklyValues || []}
              />
            </Suspense>
          </div>
        </div>

        {/* 4-WEEK MOMENTUM */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>4-Week Momentum</h3>
            <span className={styles.badge}>COMPLETION %</span>
          </div>
          <p className={styles.chartHint}>
            Weekly habit completion rate over the past month. Spot improving or declining momentum.
          </p>
          <div className={styles.chartWrapper}>
            <Suspense fallback={<ChartSkeleton />}>
              <AnalyticsCharts
                type="bar"
                labels={charts?.momentumLabels || []}
                values={charts?.momentumValues || []}
                barColor="#000000"
                unit="%"
              />
            </Suspense>
          </div>
        </div>

        {/* WEEKDAY PATTERNS */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Best Days of Week</h3>
            <span className={styles.badge}>PATTERNS</span>
          </div>
          <p className={styles.chartHint}>
            Which days you complete the most habits. Plan around your strongest days.
          </p>
          <div className={styles.chartWrapper}>
            <Suspense fallback={<ChartSkeleton />}>
              <AnalyticsCharts
                type="bar"
                labels={charts?.weekdayLabels || []}
                values={charts?.weekdayValues || []}
                barColor="#7C3AED"
                unit=" done"
              />
            </Suspense>
          </div>
        </div>

        {/* STREAK LEADERBOARD */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Streak Rankings</h3>
            <span className={styles.badge}>ACTIVE STREAKS</span>
          </div>
          <p className={styles.chartHint}>
            Habits ranked by current streak. Bar width = streak relative to your best habit.
          </p>
          <div className={styles.streakList}>
            {streakLb.length > 0 ? (
              streakLb.slice(0, 6).map((item, i) => (
                <StreakRow key={i} item={item} rank={i + 1} maxStreak={maxStreak} />
              ))
            ) : (
              <div className={styles.emptyState}>No habits tracked yet</div>
            )}
          </div>
        </div>

      </div>

      {/* ── 30-DAY HEATMAP (full-width) ── */}
      <div className={styles.heatmapCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>30-Day Activity Heatmap</h3>
          <span className={styles.badge}>LAST 30 DAYS</span>
        </div>
        <p className={styles.chartHint}>
          Each square = one day. Darker = more habits completed. Hover for details.
        </p>
        <div className={styles.heatmapGrid}>
          {(data?.thirtyDayActivity || []).map((d) => (
            <HeatmapCell
              key={d.date}
              date={d.date}
              count={d.count}
              maxCount={charts?.heatMax || 1}
            />
          ))}
        </div>
        <div className={styles.heatmapLegend}>
          <span className={styles.legendLabel}>Less</span>
          {[0.08, 0.3, 0.55, 0.8, 1].map((o, i) => (
            <div
              key={i}
              className={styles.legendCell}
              style={{ "--heat-opacity": o }}
            />
          ))}
          <span className={styles.legendLabel}>More</span>
        </div>
      </div>

      {/* ── BEST DAY HIGHLIGHT ── */}
      <div className={styles.highlight}>
        <span className={styles.highlightIcon}><Zap size={22} /></span>
        <span className={styles.highlightText}>
          Your power day:{" "}
          <strong className={styles.highlightValue}>{data?.bestDay || "N/A"}</strong>
          {" "}— you complete the most habits on this day.
        </span>
      </div>
    </div>
  );
}
