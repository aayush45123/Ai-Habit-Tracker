import { useState } from "react";
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
  FiMenu,
  FiX,
} from "react-icons/fi";
import styles from "./SideBar.module.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Menu Button - Only visible on mobile */}
      <button
        onClick={toggleSidebar}
        className={styles.hamburger}
        aria-label="Toggle menu"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay - Only visible on mobile when sidebar is open */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <FiZap className={styles.logoIcon} />
            <h2 className={styles.logoText}>HabitAI</h2>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiHome className={styles.navIcon} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/add"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiPlus className={styles.navIcon} />
            <span>Add Habit</span>
          </NavLink>

          <NavLink
            to="/analytics"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiBarChart2 className={styles.navIcon} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/ai"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiCpu className={styles.navIcon} />
            <span>AI Insights</span>
          </NavLink>

          <NavLink
            to="/challenge"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiClock className={styles.navIcon} />
            <span>21-Day Challenge</span>
          </NavLink>

          <NavLink
            to="/templates"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiLayers className={styles.navIcon} />
            <span>Habit Templates</span>
          </NavLink>

          <NavLink
            to="/focus"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <FiTarget className={styles.navIcon} />
            <span>Focus</span>
          </NavLink>

          <NavLink
            to="/about"
            onClick={closeSidebar}
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
    </>
  );
}

export default Sidebar;
