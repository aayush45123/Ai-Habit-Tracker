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
  const [error, setError] = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    fetchRiskAnalysis();
  }, []);

  async function fetchRiskAnalysis() {
    try {
      setLoading(true);
      const res = await api.get("/ml/risk-analysis");

      // Filter for HIGH and MEDIUM risk only
      const filtered = res.data.filter((item) => item.risk !== "LOW");
      setAlerts(filtered);
    } catch (err) {
      console.error("Error fetching risk analysis:", err);
      setError("");
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
      <div className={styles.container}>
        <h3 className={styles.title}>AI Risk Alerts</h3>
        <div className={styles.loading}>Analyzing your habits…</div>
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>AI Risk Alerts</h3>
        <div className={styles.noAlerts}>
          <FaShieldAlt size={24} />
          <p>All habits are performing well!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        AI Risk Alerts{" "}
        <span className={styles.badge}>{visibleAlerts.length}</span>
      </h3>

      <div className={styles.alertsList}>
        {visibleAlerts.map((alert, idx) => (
          <div
            key={idx}
            className={`${styles.alertCard} ${styles[`alert-${getRiskColor(alert.risk)}`]}`}
          >
            <div className={styles.alertHeader}>
              <div className={styles.iconWrapper}>
                {getRiskIcon(alert.risk)}
              </div>
              <div className={styles.alertTitle}>
                <h4>{alert.habit}</h4>
                <span
                  className={`${styles.riskBadge} ${styles[`risk-${alert.risk.toLowerCase()}`]}`}
                >
                  {alert.risk} RISK
                </span>
              </div>
              <button
                className={styles.dismissBtn}
                onClick={() => dismissAlert(idx)}
                title="Dismiss alert"
              >
                ✕
              </button>
            </div>

            <div className={styles.alertBody}>
              <div className={styles.metric}>
                <span className={styles.label}>Current Streak:</span>
                <span className={styles.value}>{alert.streak} days</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Completion Rate:</span>
                <span className={styles.value}>{alert.completionRate}%</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Prediction:</span>
                <span
                  className={`${styles.value} ${
                    alert.prediction === "LIKELY_SUCCESS"
                      ? styles.predictionSuccess
                      : styles.predictionFailure
                  }`}
                >
                  {alert.prediction}
                </span>
              </div>
            </div>

            <div className={styles.alertFooter}>
              {alert.risk === "HIGH" && (
                <p className={styles.recommendation}>
                  ⚠️ This habit needs immediate attention. Focus on completing
                  it daily to build momentum.
                </p>
              )}
              {alert.risk === "MEDIUM" && (
                <p className={styles.recommendation}>
                  📈 Good progress! Push for consistent completion to reach your
                  goals.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className={styles.refreshBtn} onClick={fetchRiskAnalysis}>
        🔄 Refresh Analysis
      </button>
    </div>
  );
}
