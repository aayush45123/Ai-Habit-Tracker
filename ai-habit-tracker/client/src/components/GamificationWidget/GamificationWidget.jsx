import React from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../../context/GamificationContext";
import { Zap, Coins, Shield, Award, ArrowUpRight } from "lucide-react";
import styles from "./GamificationWidget.module.css";

export default function GamificationWidget() {
  const { overview, loading } = useGamification();

  if (loading && !overview) {
    return (
      <div className={styles.widgetSkeleton}>
        <div className={styles.skeletonLine}></div>
      </div>
    );
  }

  const profile = overview?.profile || {
    level: 1,
    levelTitle: "Novice",
    totalXP: 0,
    currentXPInLevel: 0,
    xpForNextLevel: 100,
    progressPercent: 0,
    habitCoins: 0,
    streakFreezes: 0,
  };

  return (
    <div className={styles.widgetCard}>
      <div className={styles.topRow}>
        <div className={styles.levelBadgeSection}>
          <div className={styles.levelCircle}>
            <span className={styles.lvlText}>LVL</span>
            <span className={styles.lvlNumber}>{profile.level}</span>
          </div>
          <div className={styles.levelDetails}>
            <span className={styles.levelTitle}>{profile.levelTitle}</span>
            <span className={styles.xpText}>
              {profile.currentXPInLevel} / {profile.xpForNextLevel} XP ({profile.progressPercent}%)
            </span>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statPill} title="Habit Coins - Spend in Rewards Shop">
            <Coins size={16} className={styles.coinIcon} />
            <span className={styles.statValue}>{profile.habitCoins}</span>
            <span className={styles.statLabel}>Coins</span>
          </div>

          <div className={styles.statPill} title="Streak Freezes - Auto protects streak if a day is missed">
            <Shield size={16} className={styles.freezeIcon} />
            <span className={styles.statValue}>{profile.streakFreezes}/5</span>
            <span className={styles.statLabel}>Freezes</span>
          </div>

          <Link to="/progression" className={styles.progressionLink}>
            <span>Progression Hub</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${Math.min(100, Math.max(2, profile.progressPercent))}%` }}
        ></div>
      </div>
    </div>
  );
}
