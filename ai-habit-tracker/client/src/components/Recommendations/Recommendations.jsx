import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  FaLightbulb,
  FaRocket,
  FaFire,
  FaTrophy,
  FaChartLine,
  FaChartBar,
  FaBullseye,
  FaStar,
  FaSyncAlt,
} from "react-icons/fa";
import styles from "./Recommendations.module.css";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommendations");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      const res = await api.get("/recommendations/recommendations");
      setRecommendations(res.data.recommendations || []);
      setInsights(res.data.insights || []);
      setChallenges(res.data.challenges || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  }

  function getIcon(type) {
    switch (type) {
      case "excellent":
      case "streak":
        return <FaFire className={styles.iconExcellent} />;
      case "good":
      case "trend":
        return <FaChartLine className={styles.iconGood} />;
      case "moderate":
      case "alert":
        return <FaLightbulb className={styles.iconModerate} />;
      case "best_habit":
        return <FaTrophy className={styles.iconBest} />;
      case "milestone":
        return <FaRocket className={styles.iconMilestone} />;
      default:
        return <FaLightbulb />;
    }
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <h3 className={styles.panelTitle}>
          <FaLightbulb /> Insights & Recommendations
        </h3>
        <div className={styles.loading}>Analyzing your habits...</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>
        <FaLightbulb /> Insights & Recommendations
      </h3>

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "recommendations" ? styles.active : ""}`}
          onClick={() => setActiveTab("recommendations")}
        >
          <FaLightbulb /> Ideas
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "insights" ? styles.active : ""}`}
          onClick={() => setActiveTab("insights")}
        >
          <FaChartBar /> Insights
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "challenges" ? styles.active : ""}`}
          onClick={() => setActiveTab("challenges")}
        >
          <FaBullseye /> Challenges
        </button>
      </div>

      <div className={styles.contentArea}>
        {/* RECOMMENDATIONS TAB */}
        {activeTab === "recommendations" && (
          <div className={styles.tabContent}>
            {recommendations.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No recommendations yet. Start tracking more habits!</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={styles.recommendationCard}>
                    <div className={styles.recHeader}>
                      <h4 className={styles.recTitle}>{rec.title}</h4>
                      <span className={styles.difficulty}>
                        {rec.difficulty}
                      </span>
                    </div>
                    <p className={styles.recDescription}>{rec.description}</p>
                    <div className={styles.recReason}>
                      <FaLightbulb className={styles.reasonIcon} /> {rec.reason}
                    </div>
                    <button className={styles.actionBtn}>
                      {rec.type === "starter" ? "Start Now" : "Learn More"} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div className={styles.tabContent}>
            {insights.length === 0 ? (
              <div className={styles.emptyState}>
                <p>
                  <FaChartBar /> Add more habits to unlock insights!
                </p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`${styles.insightCard} ${styles[`insight-${insight.type}`]}`}
                  >
                    <div className={styles.insightIcon}>
                      {getIcon(insight.type)}
                    </div>
                    <div className={styles.insightContent}>
                      <h4 className={styles.insightTitle}>{insight.title}</h4>
                      <p className={styles.insightMessage}>{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === "challenges" && (
          <div className={styles.tabContent}>
            {challenges.length === 0 ? (
              <div className={styles.emptyState}>
                <p>
                  <FaBullseye /> No challenges available yet.
                </p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {challenges.map((challenge, idx) => (
                  <div key={idx} className={styles.challengeCard}>
                    <div className={styles.chalHeader}>
                      <div className={styles.chalIconBox}>{challenge.icon}</div>
                      <div className={styles.chalInfo}>
                        <h4 className={styles.chalTitle}>{challenge.title}</h4>
                        <span className={styles.chalDifficulty}>
                          {challenge.difficulty}
                        </span>
                      </div>
                      <div className={styles.chalReward}>
                        <FaStar className={styles.rewardIcon} />
                        <span className={styles.rewardValue}>
                          {challenge.reward}
                        </span>
                      </div>
                    </div>
                    <p className={styles.chalDescription}>
                      {challenge.description}
                    </p>
                    <div className={styles.chalFooter}>
                      <div className={styles.targetProgress}>
                        Target: {challenge.target}
                        {challenge.type === "streak" && " days"}
                        {challenge.type === "consistency" && " days"}
                        {challenge.type === "perfect_week" && " days"}
                      </div>
                      <button className={styles.joinBtn}>
                        Start Challenge →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className={styles.refreshBtn} onClick={fetchRecommendations}>
        <FaSyncAlt className={styles.btnIcon} /> Refresh
      </button>
    </div>
  );
}
