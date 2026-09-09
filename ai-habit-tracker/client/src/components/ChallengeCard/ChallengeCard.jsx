import React from "react";
import { Zap, Coins, CheckCircle, Clock, Sparkles } from "lucide-react";
import styles from "./ChallengeCard.module.css";

export default function ChallengeCard({ challenge, onJoin, joining = false }) {
  const isJoined = challenge.isJoined;
  const isCompleted = challenge.status === "completed";
  const progress = challenge.progress || 0;

  return (
    <div className={`${styles.card} ${isCompleted ? styles.completedCard : ""}`}>
      <div className={styles.topRow}>
        <div className={styles.tags}>
          <span className={`${styles.difficultyTag} ${styles[challenge.difficulty || "medium"]}`}>
            {challenge.difficulty}
          </span>
          <span className={styles.categoryTag}>{challenge.category}</span>
          {challenge.isAIGenerated && (
            <span className={styles.aiTag}>
              <Sparkles size={12} /> AI Tailored
            </span>
          )}
        </div>

        <div className={styles.rewards}>
          {challenge.xpReward > 0 && (
            <div className={styles.rewardItem}>
              <Zap size={14} className={styles.xpIcon} />
              <span>+{challenge.xpReward} XP</span>
            </div>
          )}
          {challenge.coinReward > 0 && (
            <div className={styles.rewardItem}>
              <Coins size={14} className={styles.coinIcon} />
              <span>+{challenge.coinReward}</span>
            </div>
          )}
        </div>
      </div>

      <h3 className={styles.title}>{challenge.title}</h3>
      <p className={styles.desc}>{challenge.description}</p>

      {isJoined && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabelRow}>
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <div className={styles.actionRow}>
        {isCompleted ? (
          <div className={styles.completedBadge}>
            <CheckCircle size={16} />
            <span>Completed</span>
          </div>
        ) : isJoined ? (
          <div className={styles.activeBadge}>
            <Clock size={15} />
            <span>Active Challenge</span>
          </div>
        ) : (
          <button
            className={styles.joinBtn}
            onClick={() => onJoin(challenge._id)}
            disabled={joining}
          >
            {joining ? "Joining..." : "Accept Challenge"}
          </button>
        )}
      </div>
    </div>
  );
}
