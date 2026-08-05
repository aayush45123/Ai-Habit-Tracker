// client/src/components/RiskAlerts/RiskAlerts.jsx
import React, { memo, useEffect, useState } from "react";
import api from "../../utils/api";
import {
  FaExclamationTriangle,
  FaShieldAlt,
  FaExclamationCircle,
  FaSyncAlt,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaLightbulb,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import styles from "./RiskAlerts.module.css";

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

function FactorBar({ label, value, weight, description }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.min(Math.max(value, 0), 100);
  const fillColor =
    pct >= 70
      ? "var(--factor-good)"
      : pct >= 40
        ? "var(--factor-medium)"
        : "var(--factor-bad)";

  return (
    <div className={styles.factorRow} title={description}>
      <div className={styles.factorHeader}>
        <span className={styles.factorLabel}>{label}</span>
        <div className={styles.factorMeta}>
          <span className={styles.factorWeight}>{weight}% weight</span>
          <span className={styles.factorPct} style={{ color: fillColor }}>
            {pct}%
          </span>
        </div>
      </div>
      <div className={styles.factorTrack}>
        <div
          className={styles.factorFill}
          style={{
            width: animated ? `${pct}%` : "0%",
            backgroundColor: fillColor,
          }}
        />
      </div>
      {description && <p className={styles.factorDesc}>{description}</p>}
    </div>
  );
}

function ExplainPanel({ alert }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.explainWrapper}>
      <button
        className={styles.explainToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <FaLightbulb className={styles.explainIcon} />
        <span>Why this alert?</span>
        {open ? (
          <FaChevronUp className={styles.chevron} />
        ) : (
          <FaChevronDown className={styles.chevron} />
        )}
      </button>

      {open && (
        <div className={styles.explainBody}>
          {alert.reasons?.length > 0 && (
            <div className={styles.reasonsSection}>
              <p className={styles.reasonsTitle}>Evidence</p>
              <ul className={styles.reasonsList}>
                {alert.reasons.map((r, i) => (
                  <li key={i} className={styles.reasonItem}>
                    <span className={styles.reasonBullet}>⚡</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alert.factorWeights?.length > 0 && (
            <div className={styles.factorsSection}>
              <p className={styles.reasonsTitle}>
                How the score was calculated
              </p>
              <div className={styles.factorsList}>
                {alert.factorWeights.map((f, i) => (
                  <FactorBar
                    key={i}
                    label={f.label}
                    value={f.value}
                    weight={f.weight}
                    description={f.description}
                  />
                ))}
              </div>
              <p className={styles.confidenceNote}>
                Prediction confidence:{" "}
                <strong
                  style={{
                    color:
                      alert.confidence >= 70
                        ? "var(--factor-good)"
                        : alert.confidence >= 40
                          ? "var(--factor-medium)"
                          : "var(--factor-bad)",
                  }}
                >
                  {alert.confidence}%
                </strong>
              </p>
            </div>
          )}

          {alert.actionSuggestion && (
            <div className={styles.actionBox}>
              <span className={styles.actionLabel}>Recommended Action</span>
              <p className={styles.actionText}>{alert.actionSuggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT (Carousel)
───────────────────────────────────────── */

function RiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [filter, setFilter] = useState("ALL"); // ALL | HIGH | MEDIUM
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchRiskAnalysis();
  }, []);

  async function fetchRiskAnalysis() {
    try {
      setLoading(true);
      const res = await api.get("/ml/risk-analysis");
      setAlerts(res.data || []);
      setActiveIndex(0);
    } catch (err) {
      console.error("Error fetching risk analysis:", err);
    } finally {
      setLoading(false);
    }
  }

  function dismissAlert(habitId) {
    setDismissedIds((prev) => new Set([...prev, habitId]));
    setActiveIndex((i) => Math.max(0, i - 1));
  }

  function getRiskIcon(risk) {
    if (risk === "HIGH")
      return <FaExclamationTriangle className={styles.iconHigh} />;
    if (risk === "MEDIUM")
      return <FaExclamationCircle className={styles.iconMedium} />;
    return <FaShieldAlt className={styles.iconLow} />;
  }

  function getTrendIcon(trend) {
    if (trend === "improving") return <FaArrowUp className={styles.trendUp} />;
    if (trend === "declining")
      return <FaArrowDown className={styles.trendDown} />;
    return <FaMinus className={styles.trendStable} />;
  }

  const visibleAlerts = alerts.filter(
    (a) =>
      !dismissedIds.has(a.habitId) && (filter === "ALL" || a.risk === filter),
  );

  const highCount = alerts.filter(
    (a) => !dismissedIds.has(a.habitId) && a.risk === "HIGH",
  ).length;
  const mediumCount = alerts.filter(
    (a) => !dismissedIds.has(a.habitId) && a.risk === "MEDIUM",
  ).length;
  const lowCount = alerts.filter(
    (a) => !dismissedIds.has(a.habitId) && a.risk === "LOW",
  ).length;

  // Clamp activeIndex whenever the visible list shrinks/changes
  const safeIndex = visibleAlerts.length
    ? Math.min(activeIndex, visibleAlerts.length - 1)
    : 0;

  function goPrev() {
    setActiveIndex(
      (i) => (i - 1 + visibleAlerts.length) % visibleAlerts.length,
    );
  }

  function goNext() {
    setActiveIndex((i) => (i + 1) % visibleAlerts.length);
  }

  function changeFilter(key) {
    setFilter(key);
    setActiveIndex(0);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>
          <FaShieldAlt className={styles.titleIcon} /> AI Risk Alerts
        </h3>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Analyzing your habits…</p>
        </div>
      </div>
    );
  }

  /* ── All clear ── */
  if (visibleAlerts.length === 0 && filter === "ALL") {
    return (
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>
          <FaShieldAlt className={styles.titleIcon} /> AI Risk Alerts
        </h3>
        <div className={styles.noAlerts}>
          <FaShieldAlt size={32} />
          <p>All habits look healthy!</p>
          <span>No risks detected based on your current data.</span>
          <button className={styles.refreshBtn} onClick={fetchRiskAnalysis}>
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>
    );
  }

  const alert = visibleAlerts[safeIndex];

  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.titleRow}>
        <h3 className={styles.panelTitle}>
          <FaShieldAlt className={styles.titleIcon} /> AI Risk Alerts
        </h3>
        {highCount > 0 && (
          <span className={styles.badgeHigh}>{highCount} HIGH</span>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className={styles.filterRow}>
        {[
          { key: "ALL", label: `All (${highCount + mediumCount + lowCount})` },
          { key: "HIGH", label: `High (${highCount})` },
          { key: "MEDIUM", label: `Medium (${mediumCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filter === key ? styles.filterActive : ""}`}
            onClick={() => changeFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Carousel ── */}
      {visibleAlerts.length === 0 ? (
        <div className={styles.emptyFilter}>
          No {filter.toLowerCase()} risk habits.
        </div>
      ) : (
        <>
          <div className={styles.carouselNav}>
            <button
              className={styles.navBtn}
              onClick={goPrev}
              disabled={visibleAlerts.length <= 1}
              aria-label="Previous alert"
            >
              <FaChevronLeft />
            </button>

            <span className={styles.carouselCounter}>
              {safeIndex + 1} / {visibleAlerts.length}
            </span>

            <button
              className={styles.navBtn}
              onClick={goNext}
              disabled={visibleAlerts.length <= 1}
              aria-label="Next alert"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className={styles.carouselTrack}>
            <div
              key={alert.habitId}
              className={`${styles.alertCard} ${styles[`alert-${alert.risk.toLowerCase()}`]}`}
            >
              {/* Card header */}
              <div className={styles.alertTop}>
                <div className={styles.habitInfo}>
                  <div className={styles.iconBox}>
                    {getRiskIcon(alert.risk)}
                  </div>
                  <div className={styles.habitMeta}>
                    <h4 className={styles.habitName}>{alert.habit}</h4>
                    <div className={styles.habitTags}>
                      <span
                        className={`${styles.riskBadge} ${styles[`risk-${alert.risk.toLowerCase()}`]}`}
                      >
                        {alert.risk}
                      </span>
                      {alert.category && (
                        <span className={styles.categoryTag}>
                          {alert.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className={styles.dismissBtn}
                  onClick={() => dismissAlert(alert.habitId)}
                  title="Dismiss this alert"
                >
                  ✕
                </button>
              </div>

              {/* Metrics row */}
              <div className={styles.metricsRow}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Streak</span>
                  <span className={styles.metricValue}>{alert.streak}d</span>
                </div>
                <div className={styles.metricSeparator} />
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>All-time</span>
                  <span className={styles.metricValue}>
                    {alert.completionRate}%
                  </span>
                </div>
                <div className={styles.metricSeparator} />
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Last 7d</span>
                  <span className={styles.metricValue}>
                    {alert.recentRate ?? "—"}%
                  </span>
                </div>
                <div className={styles.metricSeparator} />
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>Trend</span>
                  <span className={styles.metricValue}>
                    {getTrendIcon(alert.trend)}
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
                    {alert.prediction === "LIKELY_SUCCESS"
                      ? "✓ Good"
                      : "⚠ At risk"}
                  </span>
                </div>
              </div>

              {/* Completion mini-bar */}
              <div className={styles.completionBar}>
                <div
                  className={styles.completionFill}
                  style={{
                    width: `${alert.completionRate}%`,
                    backgroundColor:
                      alert.risk === "HIGH"
                        ? "#ef4444"
                        : alert.risk === "MEDIUM"
                          ? "#f59e0b"
                          : "#10b981",
                  }}
                />
              </div>
              <div className={styles.completionBarLabels}>
                <span>0%</span>
                <span className={styles.completionBarTarget}>70% target</span>
                <span>100%</span>
              </div>

              {/* Explainable AI panel */}
              <ExplainPanel alert={alert} />
            </div>
          </div>

          {/* ── Dot indicators ── */}
          {visibleAlerts.length > 1 && (
            <div className={styles.dotsRow}>
              {visibleAlerts.map((a, i) => (
                <button
                  key={a.habitId}
                  className={`${styles.dot} ${i === safeIndex ? styles.dotActive : ""}`}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to alert ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <button className={styles.refreshBtn} onClick={fetchRiskAnalysis}>
        <FaSyncAlt className={styles.btnIcon} /> Refresh Analysis
      </button>
    </div>
  );
}

export default memo(RiskAlerts);
