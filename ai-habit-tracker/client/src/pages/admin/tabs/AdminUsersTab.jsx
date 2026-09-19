import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import styles from "../AdminDashboard.module.css";

function fmtDuration(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersTab({ onSelectUser }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [role, setRole]         = useState("");
  const [sortBy, setSortBy]     = useState("lastActivityAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 15 });
  const LIMIT = 15;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        sortBy,
        sortOrder,
      });
      if (search.trim()) params.set("search", search.trim());
      if (role) params.set("role", role);

      const res = await api.get(`/admin/analytics/users?${params}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { total: 0, pages: 1, limit: LIMIT });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, role, sortBy, sortOrder]);

  useEffect(() => {
    const id = setTimeout(fetchUsers, 300);
    return () => clearTimeout(id);
  }, [fetchUsers]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const sortArrow = (field) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>User Analytics</h2>
        <span className={styles.sectionBadge}>{pagination.total} total</span>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <input
          className={styles.searchInput}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className={styles.filterSelect} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : (
        <>
          {users.length === 0 ? (
            <div className={styles.emptyState}>No users found matching your filters.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Name / Email</th>
                    <th onClick={() => handleSort("role")} style={{ cursor: "pointer" }}>Role{sortArrow("role")}</th>
                    <th>Status</th>
                    <th onClick={() => handleSort("totalActiveDurationSeconds")} style={{ cursor: "pointer" }}>
                      Est. Active Time{sortArrow("totalActiveDurationSeconds")}
                    </th>
                    <th onClick={() => handleSort("totalSessions")} style={{ cursor: "pointer" }}>
                      Sessions{sortArrow("totalSessions")}
                    </th>
                    <th onClick={() => handleSort("lastLoginAt")} style={{ cursor: "pointer" }}>
                      Last Login{sortArrow("lastLoginAt")}
                    </th>
                    <th onClick={() => handleSort("lastActivityAt")} style={{ cursor: "pointer" }}>
                      Last Active{sortArrow("lastActivityAt")}
                    </th>
                    <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer" }}>
                      Joined{sortArrow("createdAt")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className={styles.userNameCell}>{u.name}</div>
                        <div className={styles.userEmailCell}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`${styles.roleBadge} ${u.role !== "admin" ? styles.user : ""}`}>
                          {u.isAdmin || u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusDot} ${u.isActive !== false ? styles.active : styles.inactive}`} />
                        {u.isActive !== false ? "Active" : "Inactive"}
                      </td>
                      <td>{fmtDuration(u.totalActiveDurationSeconds)}</td>
                      <td>{u.totalSessions || 0}</td>
                      <td>{fmtDate(u.lastLoginAt)}</td>
                      <td>{fmtDate(u.lastActivityAt)}</td>
                      <td>{fmtDate(u.createdAt)}</td>
                      <td>
                        <button
                          className={styles.btnLink}
                          onClick={() => onSelectUser(u._id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={styles.pagination}>
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
