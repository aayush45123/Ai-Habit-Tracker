import React from "react";
import { useGamification } from "../../context/GamificationContext";
import { Trophy, Zap, Coins, X, Sparkles } from "lucide-react";
import styles from "./AchievementModal.module.css";

const RARITY_COLORS = {
  common: { border: "#6b7280", badge: "#4b5563", label: "COMMON" },
  uncommon: { border: "#10b981", badge: "#059669", label: "UNCOMMON" },
  rare: { border: "#3b82f6", badge: "#2563eb", label: "RARE" },
  epic: { border: "#8b5cf6", badge: "#7c3aed", label: "EPIC" },
  legendary: { border: "#f59e0b", badge: "#d97706", label: "LEGENDARY" },
};

export default function AchievementModal() {
  const { achievementModal, closeAchievementModal } = useGamification();

  if (!achievementModal) return null;

  const rarityInfo = RARITY_COLORS[achievementModal.rarity] || RARITY_COLORS.common;

  return (
    <div className={styles.overlay} onClick={closeAchievementModal}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: rarityInfo.border }}
      >
        <button className={styles.closeBtn} onClick={closeAchievementModal}>
          <X size={18} />
        </button>

        <div className={styles.sparkleContainer}>
          <Sparkles className={styles.sparkleIcon} />
        </div>

        <span
          className={styles.rarityTag}
          style={{ backgroundColor: rarityInfo.badge }}
        >
          {rarityInfo.label}
        </span>

        <div className={styles.iconCircle}>
          <span className={styles.emojiIcon}>{achievementModal.icon || "??"}</span>
        </div>

        <h2 className={styles.title}>{achievementModal.name}</h2>
        <p className={styles.desc}>{achievementModal.description}</p>

        <div className={styles.rewardsRow}>
          {achievementModal.xpReward > 0 && (
            <div className={styles.rewardPill}>
              <Zap size={16} className={styles.xpIcon} />
              <span>+{achievementModal.xpReward} XP</span>
            </div>
          )}
          {achievementModal.coinReward > 0 && (
            <div className={styles.rewardPill}>
              <Coins size={16} className={styles.coinIcon} />
              <span>+{achievementModal.coinReward} Coins</span>
            </div>
          )}
        </div>

        <button className={styles.claimBtn} onClick={closeAchievementModal}>
          Continue Crushing It
        </button>
      </div>
    </div>
  );
}
