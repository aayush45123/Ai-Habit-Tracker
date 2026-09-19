import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import styles from "../AdminDashboard.module.css";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const EVENT_TYPES = [
  "",
  "LOGIN_SUCCESS", "LOGOUT", "SESSION_EXPIRED",
  "HABIT_CREATED", "HABIT_COMPLETED", "HABIT_DELETED",
  "CHALLENGE_STARTED", "CHALLENGE_HABIT_COMPLETED",
  "FOCUS_SESSION_COMPLETED", "AI_INSIGHTS_GENERATED",
];

export default function AdminActivityTab() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [eventType, setEventType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]   = useState("");
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const LIMIT = 25;

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (eventType) params.set("eventType", eventType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await api.get(`/admin/analytics/activity?${params}`);
      setEvents(res.data.events || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, eventType, startDate, endDate]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Activity Logs</h2>
        <span className={styles.sectionBadge}>{pagination.total} total</span>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <select
          className={styles.filterSelect}
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1); }}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t || "All Event Types"}</option>
          ))}
        </select>
        <input
          type="date"
          className={styles.dateInput}
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          placeholder="Start date"
        />
        <input
          type="date"
          className={styles.dateInput}
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          placeholder="End date"
        />
        {(eventType || startDate || endDate) && (
          <button
            className={styles.btnLink}
            onClick={() => { setEventType(""); setStartDate(""); setEndDate(""); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : (
        <>
          {events.length === 0 ? (
            <div className={styles.emptyState}>No activity events found for the selected filters.</div>
          ) : (
            <div className={styles.eventList}>
              {events.map((e) => (
                <div key={e._id} className={styles.eventItem}>
                  <span className={styles.eventType}>{e.eventType.replace(/_/g, " ")}</span>
                  {e.user && (
                    <span className={styles.eventMeta} style={{ minWidth: 140, flexShrink: 0 }}>
                      {e.user.name} · <span style={{ color: "#888" }}>{e.user.email}</span>
                    </span>
                  )}
                  <span className={styles.eventMeta}>
                    {e.metadata && Object.keys(e.metadata).length > 0
                      ? Object.entries(e.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ")
                      : ""}
                  </span>
                  <span className={styles.eventTime}>{fmtDate(e.timestamp)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={styles.pagination} style={{ marginTop: "1rem" }}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pg = Math.max(1, page - 2) + i;
                if (pg > pagination.pages) return null;
                return (
                  <button
                    key={pg}
                    className={`${styles.pageBtn} ${pg === page ? styles.activePage : ""}`}
                    onClick={() => setPage(pg)}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                className={styles.pageBtn}
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
              <span className={styles.pageInfo}>
                {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
