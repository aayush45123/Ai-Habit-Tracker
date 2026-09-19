import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { FiShield, FiBarChart2, FiUsers, FiActivity, FiCopy, FiHome, FiArrowLeft } from "react-icons/fi";
import styles from "./AdminDashboard.module.css";
import PageLoader from "../../components/common/PageLoader/PageLoader";

const AdminOverviewTab    = lazy(() => import("./tabs/AdminOverviewTab"));
const AdminAnalyticsTab   = lazy(() => import("./tabs/AdminAnalyticsTab"));
const AdminUsersTab       = lazy(() => import("./tabs/AdminUsersTab"));
const AdminUserDetailTab  = lazy(() => import("./tabs/AdminUserDetailTab"));
const AdminActivityTab    = lazy(() => import("./tabs/AdminActivityTab"));
const AdminTemplates      = lazy(() => import("./AdminTemplates"));

const TABS = [
  { id: "overview",   label: "Overview",   Icon: FiHome },
  { id: "analytics",  label: "Analytics",  Icon: FiBarChart2 },
  { id: "users",      label: "Users",      Icon: FiUsers },
  { id: "activity",   label: "Activity",   Icon: FiActivity },
  { id: "templates",  label: "Templates",  Icon: FiCopy },
];

function getTabFromHash() {
  const hash = window.location.hash; // e.g. #/admin/analytics
  if (!hash) return "overview";
  const parts = hash.replace("#", "").replace(/^\/+/, "").split("/");
  // parts[0] = "admin", parts[1] = tab, parts[2] = userId
  const tabPart = parts[1];
  if (!tabPart || tabPart === "admin") return "overview";
  if (tabPart === "user") return "user-detail";
  return TABS.find((t) => t.id === tabPart)?.id || "overview";
}

function getUserIdFromHash() {
  const hash = window.location.hash;
  const parts = hash.replace("#", "").replace(/^\/+/, "").split("/");
  if (parts[1] === "user" && parts[2]) return parts[2];
  return null;
}

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [selectedUserId, setSelectedUserId] = useState(getUserIdFromHash);

  // Sync tab from hash on mount and on popstate (browser back/forward)
  useEffect(() => {
    const syncTab = () => {
      const tab = getTabFromHash();
      const uid = getUserIdFromHash();
      setActiveTab(tab);
      setSelectedUserId(uid);
    };
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  const navigateToTab = useCallback((tabId) => {
    window.location.hash = `/admin/${tabId}`;
    setActiveTab(tabId);
    setSelectedUserId(null);
  }, []);

  const openUserDetail = useCallback((userId) => {
    window.location.hash = `/admin/user/${userId}`;
    setActiveTab("user-detail");
    setSelectedUserId(userId);
  }, []);

  const backToUsers = useCallback(() => {
    window.location.hash = "/admin/users";
    setActiveTab("users");
    setSelectedUserId(null);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverviewTab onNavigate={navigateToTab} />;
      case "analytics":
        return <AdminAnalyticsTab />;
      case "users":
        return <AdminUsersTab onSelectUser={openUserDetail} />;
      case "user-detail":
        return <AdminUserDetailTab userId={selectedUserId} onBack={backToUsers} />;
      case "activity":
        return <AdminActivityTab />;
      case "templates":
        return <AdminTemplates />;
      default:
        return <AdminOverviewTab onNavigate={navigateToTab} />;
    }
  };

  return (
    <div className={styles.portal}>
      {/* Header */}
      <div className={styles.portalHeader}>
        <div>
          <h1 className={styles.portalTitle}>
            <FiShield />
            Admin Panel
          </h1>
          <p className={styles.portalSubtitle}>
            Platform Analytics & User Management
          </p>
        </div>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          <FiArrowLeft size={14} />
          Back to App
        </button>
      </div>

      {/* Tab Navigation */}
      <nav className={styles.tabNav} role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`${styles.tabBtn} ${activeTab === id || (activeTab === "user-detail" && id === "users") ? styles.activeTab : ""}`}
            onClick={() => navigateToTab(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        <Suspense fallback={<PageLoader />}>
          {renderTab()}
        </Suspense>
      </div>
    </div>
  );
}
