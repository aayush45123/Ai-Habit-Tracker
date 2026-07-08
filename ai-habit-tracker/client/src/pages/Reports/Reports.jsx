// client/src/pages/Reports/Reports.jsx
import React, { useState } from "react";
import { FiCalendar, FiDownload, FiFileText } from "react-icons/fi";
import api from "../../utils/api";
import styles from "./Reports.module.css";

export default function Reports() {
  const [loadingType, setLoadingType] = useState(null); // 'weekly' | 'monthly' | null
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: string } | null

  // Helper to trigger toast notifications
  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleDownload = async (type) => {
    setLoadingType(type);
    try {
      // Fetch binary PDF data from API
      const response = await api.get(`/reports/${type}`, {
        responseType: "blob",
      });

      // Build blob URL for the download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Habit_Tracker_${type === "weekly" ? "Weekly" : "Monthly"}_Report.pdf`
      );
      document.body.appendChild(link);
      link.click();

      // Clean up DOM and memory
      link.remove();
      window.URL.revokeObjectURL(url);

      triggerNotification(
        "success",
        `Successfully generated and downloaded your ${type} report!`
      );
    } catch (err) {
      console.error(`Error downloading ${type} report:`, err);
      triggerNotification(
        "error",
        `Failed to download ${type} report. Please ensure you have configured habits and try again.`
      );
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>Download your progress reports</p>
      </div>

      {/* Cards Layout */}
      <div className={styles.cardGrid}>
        {/* Weekly Card */}
        <div className={styles.reportCard}>
          <div className={styles.cardAccent} />
          <div className={styles.cardBody}>
            <div className={styles.iconWrapper}>
              <FiCalendar size={32} />
            </div>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardTitle}>Weekly Report</h2>
              <p className={styles.cardDescription}>
                Download a premium report analyzing your habit consistency, progress charts, achievements, and tips for the last 7 days.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDownload("weekly")}
            disabled={loadingType !== null}
            className={styles.downloadBtn}
          >
            {loadingType === "weekly" ? (
              <>
                <div className={styles.spinner} />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <FiDownload size={18} />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Monthly Card */}
        <div className={styles.reportCard}>
          <div className={`${styles.cardAccent} ${styles.monthlyAccent}`} />
          <div className={styles.cardBody}>
            <div className={`${styles.iconWrapper} ${styles.monthlyIcon}`}>
              <FiFileText size={32} />
            </div>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardTitle}>Monthly Report</h2>
              <p className={styles.cardDescription}>
                Download a complete breakdown of the current calendar month containing overall statistics, daily completion trends, and recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDownload("monthly")}
            disabled={loadingType !== null}
            className={styles.downloadBtn}
          >
            {loadingType === "monthly" ? (
              <>
                <div className={styles.spinner} />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <FiDownload size={18} />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helpful Info Section */}
      <div className={styles.helpTextCard}>
        <h3 className={styles.helpTitle}>How Reports Work</h3>
        <p className={styles.helpContent}>
          Our analytics service queries your local check-ins recorded in MongoDB. The system parses your streak lengths, completion percentages, and computes habit-wise insights. Using these figures, the server creates dynamic charts and formats a clean, print-ready document utilizing custom palettes, tables, and earned badges.
        </p>
      </div>

      {/* Toast Notifications */}
      {notification && (
        <div
          className={`${styles.notification} ${
            notification.type === "success"
              ? styles.successNotification
              : styles.errorNotification
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}
