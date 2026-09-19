import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import styles from "../AdminDashboard.module.css";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

// Simple inline chart components to avoid heavy re-imports
function TrendChart({ data, dataKey, label }) {
  if (!data || data.length === 0) return <div className={styles.emptyState}>No data</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          labelStyle={{ fontFamily: "Sora, sans-serif", fontSize: 11 }}
          contentStyle={{ border: "2px solid #000", borderRadius: 0, fontFamily: "Sora, sans-serif", fontSize: 11 }}
        />
        <Line type="monotone" dataKey={dataKey} name={label} stroke="#000000" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartBlock({ data, dataKey, label }) {
  if (!data || data.length === 0) return <div className={styles.emptyState}>No data</div>;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ border: "2px solid #000", borderRadius: 0, fontFamily: "Sora, sans-serif", fontSize: 11 }}
        />
        <Bar dataKey={dataKey} name={label} fill="#000000" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function fmtTime(seconds) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AdminOverviewTab({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/analytics/overview");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (error) return <div className={styles.errorBanner}>{error}</div>;
  if (!data) return null;

  const { summary, featureUsage, dailyTrend, deviceBreakdown, browserBreakdown } = data;
  const maxFeature = Math.max(...Object.values(featureUsage));

  const summaryCards = [
    { label: "Total Users",         value: summary.totalUsers,                     unit: "registered" },
    { label: "Active Today (DAU)",  value: summary.dau,                            unit: "users" },
    { label: "Active This Month",   value: summary.mau,                            unit: "MAU" },
    { label: "Logins Today",        value: summary.loginsToday,                    unit: "sessions" },
    { label: "Live Sessions",       value: summary.activeSessionsCount,            unit: "right now" },
    { label: "Total Active Time",   value: fmtTime(summary.totalActiveMinutes * 60), unit: "est." },
    { label: "Avg Session",         value: fmtTime(summary.avgSessionDurationSeconds), unit: "est." },
    { label: "Total Sessions",      value: summary.totalSessions,                  unit: "all-time" },
  ];

  const featureRows = [
    { label: "Habits Completed",    count: featureUsage.habitsCompleted },
    { label: "Habits Created",      count: featureUsage.habitsCreated },
    { label: "Challenge Habits",    count: featureUsage.challengeHabitsCompleted },
    { label: "Focus Sessions",      count: featureUsage.focusSessions },
    { label: "Challenges Started",  count: featureUsage.challengesStarted },
    { label: "AI Insights",         count: featureUsage.aiInsights },
  ];

  return (
    <div>
      {/* Summary Cards */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Platform Overview</h2>
        <span className={styles.sectionBadge}>Live</span>
      </div>
      <div className={styles.statsGrid}>
        {summaryCards.map((card) => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={styles.statValue}>{card.value}</div>
            <div className={styles.statUnit}>{card.unit}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsGrid}>
        {/* DAU Trend */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Daily Active Users (14 days)</div>
          <div className={styles.chartWrapper}>
            <TrendChart data={dailyTrend} dataKey="activeUsers" label="Active Users" />
          </div>
        </div>

        {/* Logins Trend */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Daily Logins (14 days)</div>
          <div className={styles.chartWrapper}>
            <BarChartBlock data={dailyTrend} dataKey="logins" label="Logins" />
          </div>
        </div>

        {/* Feature Usage */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Feature Usage (30 days)</div>
          <div className={styles.featureBars}>
            {featureRows.map((f) => (
              <div key={f.label} className={styles.featureRow}>
                <span className={styles.featureLabel}>{f.label}</span>
                <div className={styles.featureBarTrack}>
                  <div
                    className={styles.featureBarFill}
                    style={{ width: maxFeature > 0 ? `${(f.count / maxFeature) * 100}%` : "0%" }}
                  />
                </div>
                <span className={styles.featureCount}>{f.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device/Browser Breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>Device & Browser Breakdown</div>
          <div className={styles.featureBars} style={{ marginBottom: "1rem" }}>
            {deviceBreakdown.map((d) => (
              <div key={d.name} className={styles.featureRow}>
                <span className={styles.featureLabel}>{d.name}</span>
                <div className={styles.featureBarTrack}>
                  <div className={styles.featureBarFill}
                    style={{ width: summary.totalSessions > 0 ? `${(d.count / summary.totalSessions) * 100}%` : "0%" }} />
                </div>
                <span className={styles.featureCount}>{d.count}</span>
              </div>
            ))}
          </div>
          {browserBreakdown.slice(0, 4).map((b) => (
            <div key={b.name} className={styles.featureRow}>
              <span className={styles.featureLabel}>{b.name}</span>
              <div className={styles.featureBarTrack}>
                <div className={styles.featureBarFill}
                  style={{ width: summary.totalSessions > 0 ? `${(b.count / summary.totalSessions) * 100}%` : "0%" }} />
              </div>
              <span className={styles.featureCount}>{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Minutes Chart */}
      <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
        <div className={styles.chartTitle}>Daily Active Minutes (14 days)</div>
        <div className={styles.chartWrapper}>
          <BarChartBlock data={dailyTrend} dataKey="activeMinutes" label="Active Minutes" />
        </div>
      </div>
    </div>
  );
}
