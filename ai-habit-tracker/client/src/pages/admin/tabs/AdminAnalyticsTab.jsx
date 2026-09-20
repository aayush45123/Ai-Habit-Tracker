import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import styles from "../AdminDashboard.module.css";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const tooltipStyle = {
  border: "2px solid #000",
  borderRadius: 0,
  fontFamily: "Sora, sans-serif",
  fontSize: 11,
};

export default function AdminAnalyticsTab() {
  const [daily, setDaily] = useState([]);
  const [features, setFeatures] = useState([]);
  const [visitors, setVisitors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(14);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [dailyRes, featureRes, visitorRes] = await Promise.all([
        api.get(`/admin/analytics/daily-usage?days=${days}`),
        api.get(`/admin/analytics/feature-usage?days=${days}`),
        api.get(`/admin/analytics/visitors?days=${days}`),
      ]);
      setDaily(dailyRes.data.dailyUsage || []);
      setFeatures(featureRes.data.features || []);
      setVisitors(visitorRes.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxFeatureCount = features.length > 0 ? Math.max(...features.map((f) => f.count)) : 1;
  const maxPageView = visitors?.topPages?.length > 0 ? Math.max(...visitors.topPages.map((p) => p.views)) : 1;

  const visitorSummaryCards = visitors?.summary
    ? [
        {
          label: "Total Web Visitors",
          value: visitors.summary.totalVisitors,
          unit: `${visitors.summary.totalGuests} non-logged in`,
        },
        {
          label: "Visitors Today",
          value: visitors.summary.todayVisitors,
          unit: `${visitors.summary.todayGuests} guests today`,
        },
        {
          label: "Period Page Views",
          value: visitors.summary.periodPageViews,
          unit: `last ${days} days`,
        },
        {
          label: "Total Page Views",
          value: visitors.summary.totalPageViews,
          unit: "all-time",
        },
      ]
    : [];

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Usage & Web Visitor Analytics</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            className={styles.filterSelect}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : (
        <>
          {/* Visitor High-level Cards */}
          {visitorSummaryCards.length > 0 && (
            <div className={styles.statsGrid}>
              {visitorSummaryCards.map((card) => (
                <div key={card.label} className={styles.statCard}>
                  <div className={styles.statLabel}>{card.label}</div>
                  <div className={styles.statValue}>{card.value}</div>
                  <div className={styles.statUnit}>{card.unit}</div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.chartsGrid}>
            {/* Web Visitors & Guests Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Web Page Visitors & Non-Logged In Guests</div>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      name="Total Visitors"
                      stroke="#000000"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="guestVisitors"
                      name="Non-Logged In Guests"
                      stroke="#777777"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="pageViews"
                      name="Page Views"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DAU */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Daily Active Users (Authenticated)</div>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="dau" name="Active Users" stroke="#000" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Logins */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Daily Logins</div>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="logins" name="Logins" fill="#000" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Minutes */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Daily Active Minutes (Estimated)</div>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="activeMinutes" name="Active Minutes" fill="#2b2b2b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Events */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Total Activity Events</div>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="events" name="Events" stroke="#555" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Visited Pages */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Top Visited Web Pages</div>
              <div className={styles.featureBars}>
                {(!visitors?.topPages || visitors.topPages.length === 0) && (
                  <div className={styles.emptyState}>No page views recorded yet.</div>
                )}
                {visitors?.topPages?.map((p) => (
                  <div key={p.path} className={styles.featureRow}>
                    <span className={styles.featureLabel} title={p.path}>
                      {p.path === "/" ? "/ (Landing)" : p.path}
                    </span>
                    <div className={styles.featureBarTrack}>
                      <div
                        className={styles.featureBarFill}
                        style={{ width: `${(p.views / maxPageView) * 100}%` }}
                      />
                    </div>
                    <span className={styles.featureCount}>
                      {p.views} <small style={{ color: "#888", fontWeight: 400 }}>({p.uniqueVisitors} visitors)</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Breakdown */}
          <div className={styles.sectionHeader} style={{ marginTop: "1.5rem" }}>
            <h2 className={styles.sectionTitle}>Feature Usage Breakdown</h2>
          </div>
          <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
            <div className={styles.featureBars}>
              {features.length === 0 && <div className={styles.emptyState}>No events recorded in this period.</div>}
              {features.map((f) => (
                <div key={f.eventType} className={styles.featureRow}>
                  <span className={styles.featureLabel}>{f.eventType.replace(/_/g, " ")}</span>
                  <div className={styles.featureBarTrack}>
                    <div
                      className={styles.featureBarFill}
                      style={{ width: `${(f.count / maxFeatureCount) * 100}%` }}
                    />
                  </div>
                  <span className={styles.featureCount}>{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
