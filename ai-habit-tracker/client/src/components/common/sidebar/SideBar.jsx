import { NavLink } from "react-router-dom";
import {
  FiZap,
  FiHome,
  FiPlus,
  FiBarChart2,
  FiCpu,
  FiClock,
  FiLayers,
  FiTarget,
  FiInfo,
  FiLogOut,
} from "react-icons/fi";
import styles from "./sidebar.module.css";

function Sidebar() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <FiZap className={styles.logoIcon} />
          <h2 className={styles.logoText}>HabitAI</h2>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiHome className={styles.navIcon} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/add"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiPlus className={styles.navIcon} />
          <span>Add Habit</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiBarChart2 className={styles.navIcon} />
          <span>Analytics</span>
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiCpu className={styles.navIcon} />
          <span>AI Insights</span>
        </NavLink>

        <NavLink
          to="/challenge"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiClock className={styles.navIcon} />
          <span>21-Day Challenge</span>
        </NavLink>

        <NavLink
          to="/templates"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiLayers className={styles.navIcon} />
          <span>Habit Templates</span>
        </NavLink>

        <NavLink
          to="/focus"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiTarget className={styles.navIcon} />
          <span>Focus</span>
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <FiInfo className={styles.navIcon} />
          <span>About Us</span>
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={logout}>
          <FiLogOut />
          Logout
        </button>

        <div className={styles.footerContent}>
          <div className={styles.userAvatar}>AI</div>
          <div className={styles.footerText}>
            <p className={styles.userName}>Your Assistant</p>
            <p className={styles.userStatus}>Always Learning</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
