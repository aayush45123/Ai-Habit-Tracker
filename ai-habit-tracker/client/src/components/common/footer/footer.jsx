import React from "react";
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <h2 className={styles.logo}>AI Habit Tracker</h2>

        <p className={styles.tagline}>
          Build habits. Track progress. Upgrade your life.
        </p>

        <div className={styles.links}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Feedback</a>
          <a href="#">Support</a>
        </div>

        <p className={styles.copy}>
          © {new Date().getFullYear()} AI Habit Tracker
        </p>
      </div>
    </footer>
  );
}
