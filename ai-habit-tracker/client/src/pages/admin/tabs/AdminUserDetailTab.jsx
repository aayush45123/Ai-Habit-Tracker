import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import styles from "../AdminDashboard.module.css";
import { FiArrowLeft } from "react-icons/fi";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function fmtDuration(seconds) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

const tooltipStyle = {
  border: "2px solid #000", borderRadius: 0,
  fontFamily: "Sora, sans-serif", fontSize: 11,
};

export default function AdminUserDetailTab({ userId, onBack }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/admin/analytics/user/${userId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (!userId) return <div className={styles.emptyState}>No user selected.</div>;

  return (
    <div>
      <button className={styles.backBtn} onClick={onBack}>
        <FiArrowLeft size={14} />
        Back to Users
      </button>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : data ? (
        <>
          {/* User Profile Card */}
          <div className={styles.userProfileCard}>
            <div className={styles.userAvatar}>
              {data.user.profileImage
                ? <img src={data.user.profileImage} alt={data.user.name} width={56} height={56} style={{ objectFit: "cover" }} />
                : data.user.name?.slice(0, 2).toUpperCase()
              }
            </div>
            <div className={styles.userMeta}>
              <p className={styles.userName}>{data.user.name}</p>
              <p className={styles.userEmail}>{data.user.email}</p>
              <div className={styles.userTags}>
                <span className={styles.tag}>{data.user.isAdmin || data.user.role === "admin" ? "Admin" : "User"}</span>
                <span className={styles.tag}>Joined {new Date(data.user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              </div>
            </div>

            {/* Stats Inline */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginLeft: "auto" }}>
              {[
                { label: "Total Sessions", value: data.stats.totalSessions },
                { label: "Est. Active Time", value: fmtDuration(data.stats.totalActiveMinutes * 60) },
                { label: "Avg Session", value: `${data.stats.avgSessionMinutes}m` },
                { label: "Last Login", value: fmtDate(data.stats.lastLogin) },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div className={styles.statLabel}>{s.label}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Usage Chart */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Daily Usage (14 days)</h2>
          </div>
          <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyUsage} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e6e6e6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="activeMinutes" name="Active Minutes" fill="#000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Sessions</h2>
          </div>
          <div className={styles.tableWrapper} style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Login At</th>
                  <th>Logout At</th>
                  <th>Duration</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "#888" }}>No sessions yet.</td></tr>
                ) : data.recentSessions.map((s) => (
                  <tr key={s.sessionId}>
                    <td>{fmtDate(s.loginAt)}</td>
                    <td>{fmtDate(s.logoutAt)}</td>
                    <td>{fmtDuration(s.activeDurationSeconds)}</td>
                    <td>{s.deviceType || "—"}</td>
                    <td>{s.browser || "—"}</td>
                    <td>
                      <span className={`${styles.sessionChip} ${styles[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Activity Events */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
          </div>
          <div className={styles.eventList}>
            {data.recentEvents.length === 0 && (
              <div className={styles.emptyState}>No activity events recorded.</div>
            )}
            {data.recentEvents.map((e) => (
              <div key={e._id} className={styles.eventItem}>
                <span className={styles.eventType}>{e.eventType.replace(/_/g, " ")}</span>
                <span className={styles.eventMeta}>
                  {e.metadata && Object.keys(e.metadata).length > 0
                    ? Object.entries(e.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ")
                    : ""}
                </span>
                <span className={styles.eventTime}>{fmtDate(e.timestamp)}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
