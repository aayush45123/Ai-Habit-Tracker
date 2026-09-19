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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(14);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [dailyRes, featureRes] = await Promise.all([
        api.get(`/admin/analytics/daily-usage?days=${days}`),
        api.get(`/admin/analytics/feature-usage?days=${days}`),
      ]);
      setDaily(dailyRes.data.dailyUsage || []);
      setFeatures(featureRes.data.features || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxFeatureCount = features.length > 0 ? Math.max(...features.map((f) => f.count)) : 1;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Usage Analytics</h2>
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
          <div className={styles.chartsGrid}>
            {/* DAU */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>Daily Active Users</div>
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
