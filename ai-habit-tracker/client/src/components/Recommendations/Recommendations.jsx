import React, { memo, useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import {
  FaLightbulb,
  FaRocket,
  FaFire,
  FaTrophy,
  FaChartLine,
  FaBullseye,
  FaStar,
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaBolt,
  FaLayerGroup,
  FaShieldAlt,
  FaKey,
  FaTools,
  FaLink,
  FaPuzzlePiece,
  FaCalendarCheck,
  FaQuestionCircle,
  FaListUl,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaFlag,
  FaChartBar,
  FaTimes,
} from "react-icons/fa";
import styles from "./Recommendations.module.css";

/* ── Icon resolver ── */
function resolveIcon(iconName, className = "") {
  const map = {
    FaFire: <FaFire className={className} />,
    FaRocket: <FaRocket className={className} />,
    FaTrophy: <FaTrophy className={className} />,
    FaChartLine: <FaChartLine className={className} />,
    FaBullseye: <FaBullseye className={className} />,
    FaCheckCircle: <FaCheckCircle className={className} />,
    FaExclamationTriangle: <FaExclamationTriangle className={className} />,
    FaArrowDown: <FaArrowDown className={className} />,
    FaArrowUp: <FaArrowUp className={className} />,
    FaLayerGroup: <FaLayerGroup className={className} />,
    FaShieldAlt: <FaShieldAlt className={className} />,
    FaKey: <FaKey className={className} />,
    FaTools: <FaTools className={className} />,
    FaLink: <FaLink className={className} />,
    FaPuzzlePiece: <FaPuzzlePiece className={className} />,
    FaCalendarCheck: <FaCalendarCheck className={className} />,
    FaLightbulb: <FaLightbulb className={className} />,
  };
  return map[iconName] || <FaLightbulb className={className} />;
}

/* ── Priority badge colours ── */
function getPriorityClass(priority) {
  switch (priority) {
    case "HIGH": return styles.priorityHigh;
    case "MEDIUM": return styles.priorityMedium;
    case "LOW": return styles.priorityLow;
    default: return styles.priorityMedium;
  }
}

/* ── Coaching Summary Card ── */
function CoachingSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className={styles.coachingPanel}>
      <div className={styles.coachingHeader}>
        <FaChartBar className={styles.coachingHeaderIcon} />
        <span>Weekly Coaching Summary</span>
      </div>
      <div className={styles.coachingGrid}>
        <div className={styles.coachingStat}>
          <div className={styles.coachingStatIcon + " " + styles.iconGreen}>
            <FaCheckCircle />
          </div>
          <div className={styles.coachingStatBody}>
            <span className={styles.coachingStatLabel}>Strongest Area</span>
            <span className={styles.coachingStatValue}>{summary.strongestArea}</span>
          </div>
        </div>
        <div className={styles.coachingStat}>
          <div className={styles.coachingStatIcon + " " + styles.iconOrange}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.coachingStatBody}>
            <span className={styles.coachingStatLabel}>Biggest Weakness</span>
            <span className={styles.coachingStatValue}>{summary.biggestWeakness}</span>
          </div>
        </div>
        <div className={styles.coachingStat}>
          <div className={styles.coachingStatIcon + " " + styles.iconBlue}>
            <FaBullseye />
          </div>
          <div className={styles.coachingStatBody}>
            <span className={styles.coachingStatLabel}>Highest Priority</span>
            <span className={styles.coachingStatValue}>{summary.highestPriority}</span>
          </div>
        </div>
        <div className={styles.coachingStat}>
          <div className={styles.coachingStatIcon + " " + styles.iconRed}>
            <FaFire />
          </div>
          <div className={styles.coachingStatBody}>
            <span className={styles.coachingStatLabel}>Best Achievement</span>
            <span className={styles.coachingStatValue}>{summary.bestAchievement}</span>
          </div>
        </div>
        <div className={styles.coachingStat + " " + styles.coachingStatWide}>
          <div className={styles.coachingStatIcon + " " + styles.iconPurple}>
            <FaChartLine />
          </div>
          <div className={styles.coachingStatBody}>
            <span className={styles.coachingStatLabel}>Overall Progress</span>
            <span className={styles.coachingStatValue}>{summary.overallProgress}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Recommendation Card ── */
function RecommendationCard({ rec }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const [progress] = useState({
    percent: Math.floor(Math.random() * 30) + 40,
    streak: Math.floor(Math.random() * 5) + 1,
    improvement: `+${Math.floor(Math.random() * 15) + 5}%`,
    started: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  });

  const handleAction = useCallback(() => {
    setActivated(true);
  }, []);

  return (
    <div className={`${styles.recCard} ${activated ? styles.recCardActivated : ""}`}>
      {/* Header */}
      <div className={styles.recCardHeader}>
        <div className={styles.recCardIconWrap}>
          {resolveIcon(rec.icon, styles.recCardIconSvg)}
        </div>
        <div className={styles.recCardTitleGroup}>
          <h4 className={styles.recCardTitle}>{rec.title}</h4>
          {rec.priority && (
            <span className={`${styles.priorityBadge} ${getPriorityClass(rec.priority)}`}>
              <FaFlag /> {rec.priority}
            </span>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {(rec.estimatedTime || rec.expectedBenefit || rec.difficulty || rec.priority) && (
        <div className={styles.metricsGrid}>
          {rec.priority && (
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Priority</span>
              <span className={`${styles.metricValue} ${getPriorityClass(rec.priority)}`}>
                {rec.priority}
              </span>
            </div>
          )}
          {rec.estimatedTime && (
            <div className={styles.metricBox}>
              <FaClock className={styles.metricIcon} />
              <span className={styles.metricLabel}>Est. Time</span>
              <span className={styles.metricValue}>{rec.estimatedTime}</span>
            </div>
          )}
          {rec.expectedBenefit && (
            <div className={styles.metricBox}>
              <FaBolt className={styles.metricIcon} />
              <span className={styles.metricLabel}>Benefit</span>
              <span className={styles.metricValue}>{rec.expectedBenefit}</span>
            </div>
          )}
          {rec.difficulty && (
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Difficulty</span>
              <span className={styles.metricValue}>{rec.difficulty}</span>
            </div>
          )}
        </div>
      )}

      {/* Why am I seeing this */}
      {rec.why && (
        <div className={styles.whySection}>
          <button
            className={styles.whyToggle}
            onClick={() => setWhyOpen((p) => !p)}
          >
            <FaQuestionCircle className={styles.whyIcon} />
            Why am I seeing this?
            {whyOpen ? <FaChevronUp className={styles.chevron} /> : <FaChevronDown className={styles.chevron} />}
          </button>
          {whyOpen && (
            <div className={styles.whyContent}>
              <p className={styles.whyText}>{rec.why.text}</p>
              <p className={styles.whyMetric}>{rec.why.metric}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Plan */}
      {rec.actionPlan && rec.actionPlan.length > 0 && (
        <div className={styles.actionPlanSection}>
          <button
            className={styles.actionPlanToggle}
            onClick={() => setActionPlanOpen((p) => !p)}
          >
            <FaListUl className={styles.whyIcon} />
            Action Plan
            {actionPlanOpen ? <FaChevronUp className={styles.chevron} /> : <FaChevronDown className={styles.chevron} />}
          </button>
          {actionPlanOpen && (
            <ul className={styles.actionPlanList}>
              {rec.actionPlan.map((step, i) => (
                <li key={i} className={styles.actionPlanItem}>
                  <span className={styles.actionPlanBullet}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Progress state after activation */}
      {activated ? (
        <div className={styles.progressPanel}>
          <div className={styles.progressHeader}>
            <FaCheckCircle className={styles.progressHeaderIcon} /> Recommendation In Progress
          </div>
          <div className={styles.progressBarWrap}>
            <div className={styles.progressBar} style={{ width: `${progress.percent}%` }} />
          </div>
          <div className={styles.progressPercent}>{progress.percent}%</div>
          <div className={styles.progressStats}>
            <div className={styles.progressStat}>
              <span className={styles.progressStatLabel}>Current Streak</span>
              <span className={styles.progressStatValue}><FaFire className={styles.progressStatIcon} /> {progress.streak} Days</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.progressStatLabel}>Started</span>
              <span className={styles.progressStatValue}>{progress.started}</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.progressStatLabel}>Improvement</span>
              <span className={styles.progressStatValue + " " + styles.progressImprove}>{progress.improvement}</span>
            </div>
          </div>
          <button className={styles.deactivateBtn} onClick={() => setActivated(false)}>
            <FaTimes /> Dismiss
          </button>
        </div>
      ) : (
        <button className={styles.primaryActionBtn} onClick={handleAction}>
          <FaPlus className={styles.primaryActionIcon} />
          {rec.buttonLabel || "Take Action"}
        </button>
      )}
    </div>
  );
}

/* ── Challenge Card ── */
function ChallengeCard({ challenge }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress] = useState({
    percent: Math.floor(Math.random() * 25) + 10,
    streak: Math.floor(Math.random() * 4) + 1,
    started: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  });

  return (
    <div className={`${styles.chalCard} ${started ? styles.chalCardStarted : ""}`}>
      {/* Header */}
      <div className={styles.chalCardHeader}>
        <div className={styles.chalIconBox}>
          {resolveIcon(challenge.icon, styles.chalIconSvg)}
        </div>
        <div className={styles.chalTitleGroup}>
          <h4 className={styles.chalTitle}>{challenge.title}</h4>
          <div className={styles.chalMeta}>
            {challenge.priority && (
              <span className={`${styles.priorityBadge} ${getPriorityClass(challenge.priority)}`}>
                <FaFlag /> {challenge.priority}
              </span>
            )}
            <span className={styles.chalDifficulty}>{challenge.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {(challenge.estimatedTime || challenge.expectedBenefit) && (
        <div className={styles.metricsGrid}>
          {challenge.estimatedTime && (
            <div className={styles.metricBox}>
              <FaClock className={styles.metricIcon} />
              <span className={styles.metricLabel}>Time</span>
              <span className={styles.metricValue}>{challenge.estimatedTime}</span>
            </div>
          )}
          {challenge.expectedBenefit && (
            <div className={styles.metricBox}>
              <FaBolt className={styles.metricIcon} />
              <span className={styles.metricLabel}>Benefit</span>
              <span className={styles.metricValue}>{challenge.expectedBenefit}</span>
            </div>
          )}
          {challenge.difficulty && (
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Difficulty</span>
              <span className={styles.metricValue}>{challenge.difficulty}</span>
            </div>
          )}
        </div>
      )}

      {/* Why */}
      {challenge.why && (
        <div className={styles.whySection}>
          <button className={styles.whyToggle} onClick={() => setWhyOpen((p) => !p)}>
            <FaQuestionCircle className={styles.whyIcon} />
            Why this challenge?
            {whyOpen ? <FaChevronUp className={styles.chevron} /> : <FaChevronDown className={styles.chevron} />}
          </button>
          {whyOpen && (
            <div className={styles.whyContent}>
              <p className={styles.whyText}>{challenge.why.text}</p>
              <p className={styles.whyMetric}>{challenge.why.metric}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Plan */}
      {challenge.actionPlan && challenge.actionPlan.length > 0 && (
        <div className={styles.actionPlanSection}>
          <button className={styles.actionPlanToggle} onClick={() => setActionPlanOpen((p) => !p)}>
            <FaListUl className={styles.whyIcon} />
            Action Plan
            {actionPlanOpen ? <FaChevronUp className={styles.chevron} /> : <FaChevronDown className={styles.chevron} />}
          </button>
          {actionPlanOpen && (
            <ul className={styles.actionPlanList}>
              {challenge.actionPlan.map((step, i) => (
                <li key={i} className={styles.actionPlanItem}>
                  <span className={styles.actionPlanBullet}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Progress or Start */}
      {started ? (
        <div className={styles.progressPanel}>
          <div className={styles.progressHeader}>
            <FaFire className={styles.progressHeaderIcon} /> Challenge Active
          </div>
          <div className={styles.progressBarWrap}>
            <div className={`${styles.progressBar} ${styles.progressBarChallenge}`} style={{ width: `${progress.percent}%` }} />
          </div>
          <div className={styles.progressPercent}>{progress.percent}%</div>
          <div className={styles.progressStats}>
            <div className={styles.progressStat}>
              <span className={styles.progressStatLabel}>Streak</span>
              <span className={styles.progressStatValue}><FaFire className={styles.progressStatIcon} /> {progress.streak} Days</span>
            </div>
            <div className={styles.progressStat}>
              <span className={styles.progressStatLabel}>Started</span>
              <span className={styles.progressStatValue}>{progress.started}</span>
            </div>
          </div>
          <button className={styles.deactivateBtn} onClick={() => setStarted(false)}>
            <FaTimes /> Abandon
          </button>
        </div>
      ) : (
        <button className={styles.primaryActionBtn} onClick={() => setStarted(true)}>
          <FaRocket className={styles.primaryActionIcon} />
          {challenge.buttonLabel || "Start Challenge"}
        </button>
      )}
    </div>
  );
}

/* ── Main Component ── */
function Recommendations() {
  const [data, setData] = useState({ coachingSummary: null, recommendations: [], challenges: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommendations");

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/recommendations/recommendations");
      setData({
        coachingSummary: res.data.coachingSummary || null,
        recommendations: res.data.recommendations || [],
        challenges: res.data.challenges || [],
      });
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Analyzing your habit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelTopRow}>
        <h3 className={styles.panelTitle}>
          <FaBullseye className={styles.panelTitleIcon} /> AI Habit Coach
        </h3>
        <button className={styles.refreshBtn} onClick={fetchRecommendations}>
          <FaSyncAlt className={styles.refreshIcon} />
        </button>
      </div>

      {/* Coaching Summary */}
      <CoachingSummary summary={data.coachingSummary} />

      {/* Tab bar */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "recommendations" ? styles.active : ""}`}
          onClick={() => setActiveTab("recommendations")}
        >
          <FaLightbulb /> Recommendations
          {data.recommendations.length > 0 && (
            <span className={styles.tabBadge}>{data.recommendations.length}</span>
          )}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "challenges" ? styles.active : ""}`}
          onClick={() => setActiveTab("challenges")}
        >
          <FaBullseye /> Challenges
          {data.challenges.length > 0 && (
            <span className={styles.tabBadge}>{data.challenges.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className={styles.contentArea}>
        {activeTab === "recommendations" && (
          <div className={styles.tabContent}>
            {data.recommendations.length === 0 ? (
              <div className={styles.emptyState}>
                <FaLightbulb className={styles.emptyStateIcon} />
                <p>Start tracking habits to unlock personalized coaching recommendations.</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {data.recommendations.map((rec, idx) => (
                  <RecommendationCard key={idx} rec={rec} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "challenges" && (
          <div className={styles.tabContent}>
            {data.challenges.length === 0 ? (
              <div className={styles.emptyState}>
                <FaBullseye className={styles.emptyStateIcon} />
                <p>No challenges available yet. Add more habits to unlock challenges!</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {data.challenges.map((challenge, idx) => (
                  <ChallengeCard key={idx} challenge={challenge} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Recommendations);
