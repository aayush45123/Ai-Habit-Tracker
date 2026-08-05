import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  FiZap,
  FiGrid,
  FiPlusCircle,
  FiTrendingUp,
  FiCpu,
  FiCalendar,
  FiCopy,
  FiTarget,
  FiActivity,
  FiInfo,
  FiLogOut,
  FiMenu,
  FiX,
  FiClock,
  FiUser,
  FiLock,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";
import styles from "./SideBar.module.css";

function Sidebar() {
  const { isProfileCompleted, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleLogoutClick = () => {
    logout();
    window.location.href = "/";
  };

  const renderNavLink = (to, Icon, label) => {
    const isAboutOrProfile = to === "/about" || to === "/profile";
    const isLocked = !isProfileCompleted && !isAboutOrProfile;
    const IconComponent = isLocked ? FiLock : Icon;

    return (
      <NavLink
        to={isLocked ? "#" : to}
        onClick={(e) => {
          if (isLocked) {
            e.preventDefault();
            alert(`Please complete your profile details to unlock the ${label} section!`);
          } else {
            closeSidebar();
          }
        }}
        className={({ isActive }) => {
          if (isLocked) return `${styles.navLink} ${styles.locked}`;
          return isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;
        }}
      >
        <IconComponent className={styles.navIcon} />
        <span>{label}</span>
        {isLocked && <span className={styles.lockBadge}>LOCKED</span>}
      </NavLink>
    );
  };

  return (
    <>
      {/* Hamburger Menu (Mobile) */}
      <button
        onClick={toggleSidebar}
        className={styles.hamburger}
        aria-label="Toggle menu"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <FiZap className={styles.logoIcon} />
            <h2 className={styles.logoText}>HabitAI</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {renderNavLink("/dashboard", FiGrid, "Dashboard")}
          {renderNavLink("/add", FiPlusCircle, "Add Habit")}
          {renderNavLink("/analytics", FiTrendingUp, "Analytics")}
          {renderNavLink("/dashboard/reports", FiFileText, "Reports")}
          {renderNavLink("/ai", FiCpu, "AI Insights")}
          {renderNavLink("/challenge", FiCalendar, "21-Day Challenge")}
          {renderNavLink("/templates", FiCopy, "Habit Templates")}
          {renderNavLink("/journal", FiBookOpen, "Growth Journal")}
          {renderNavLink("/focus", FiTarget, "Focus")}
          {renderNavLink("/calories", FiActivity, "Calorie Tracker")}
          {renderNavLink("/timetable", FiClock, "Timetable Section")}
          {renderNavLink("/profile", FiUser, "Profile Settings")}
          {renderNavLink("/about", FiInfo, "About Us")}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogoutClick}>
            <FiLogOut />
            Logout
          </button>

          <div className={styles.footerContent}>
            <div className={styles.userAvatar}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className={styles.userAvatarImg} />
              ) : user?.name ? (
                user.name.slice(0, 2).toUpperCase()
              ) : (
                "AI"
              )}
            </div>
            <div className={styles.footerText}>
              <p className={styles.userName}>{user?.name || "Your Assistant"}</p>
              <p className={styles.userStatus}>
                {isProfileCompleted ? "Profile Active" : "Setup Incomplete"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
