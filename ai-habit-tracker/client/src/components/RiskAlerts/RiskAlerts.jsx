import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  FaExclamationTriangle,
  FaShieldAlt,
  FaExclamationCircle,
} from "react-icons/fa";
import styles from "./RiskAlerts.module.css";

export default function RiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    fetchRiskAnalysis();
  }, []);

  async function fetchRiskAnalysis() {
    try {
      setLoading(true);
      const res = await api.get("/ml/risk-analysis");
      const filtered = res.data.filter((item) => item.risk !== "LOW");
      setAlerts(filtered);
    } catch (err) {
      console.error("Error fetching risk analysis:", err);
    } finally {
      setLoading(false);
    }
  }

  function dismissAlert(index) {
    const newSet = new Set(dismissedAlerts);
    newSet.add(index);
    setDismissedAlerts(newSet);
  }

  function getRiskIcon(risk) {
    if (risk === "HIGH") {
      return <FaExclamationTriangle className={styles.iconHigh} />;
    } else if (risk === "MEDIUM") {
      return <FaExclamationCircle className={styles.iconMedium} />;
    }
    return <FaShieldAlt className={styles.iconLow} />;
  }

  function getRiskColor(risk) {
    if (risk === "HIGH") return "high";
    if (risk === "MEDIUM") return "medium";
    return "low";
  }

  const visibleAlerts = alerts.filter((_, idx) => !dismissedAlerts.has(idx));

  if (loading) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>AI Risk Alerts</h3>
        <div className={styles.loading}>Analyzing…</div>
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>AI Risk Alerts</h3>
        <div className={styles.noAlerts}>
          <FaShieldAlt size={32} />
          <p>All good!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <h3 className={styles.panelTitle}>AI Risk Alerts</h3>
        <span className={styles.badge}>{visibleAlerts.length}</span>
      </div>

      <div className={styles.alertsList}>
        {visibleAlerts.map((alert, idx) => (
          <div
            key={idx}
            className={`${styles.alertCard} ${styles[`alert-${getRiskColor(alert.risk)}`]}`}
          >
            <div className={styles.alertTop}>
              <div className={styles.habitInfo}>
                <div className={styles.iconBox}>{getRiskIcon(alert.risk)}</div>
                <div>
                  <h4 className={styles.habitName}>{alert.habit}</h4>
                  <span
                    className={`${styles.riskBadge} ${styles[`risk-${alert.risk.toLowerCase()}`]}`}
                  >
                    {alert.risk}
                  </span>
                </div>
              </div>
              <button
                className={styles.dismissBtn}
                onClick={() => dismissAlert(idx)}
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <div className={styles.metricsRow}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Streak</span>
                <span className={styles.metricValue}>{alert.streak}d</span>
              </div>
              <div className={styles.metricSeparator} />
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Completion</span>
                <span className={styles.metricValue}>
                  {alert.completionRate}%
                </span>
              </div>
              <div className={styles.metricSeparator} />
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Outlook</span>
                <span
                  className={`${styles.metricValue} ${
                    alert.prediction === "LIKELY_SUCCESS"
                      ? styles.success
                      : styles.failure
                  }`}
                >
                  {alert.prediction === "LIKELY_SUCCESS" ? "✓" : "⚠"}
                </span>
              </div>
            </div>

            <div className={styles.alertMessage}>
              {alert.risk === "HIGH" &&
                "⚠️ Needs attention. Keep the streak alive!"}
              {alert.risk === "MEDIUM" && "📈 Push for consistency this week."}
            </div>
          </div>
        ))}
      </div>

      <button className={styles.refreshBtn} onClick={fetchRiskAnalysis}>
        🔄 Refresh
      </button>
    </div>
  );
}
