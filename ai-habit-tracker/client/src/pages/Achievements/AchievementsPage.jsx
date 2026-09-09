import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import GamificationIcon from "../../components/GamificationIcon/GamificationIcon";
import { Trophy, Zap, Coins, Lock, CheckCircle } from "lucide-react";
import styles from "./AchievementsPage.module.css";

const CATEGORIES = [
  { id: "all", label: "All Badges" },
  { id: "streak", label: "Streaks" },
  { id: "consistency", label: "Consistency" },
  { id: "mastery", label: "Levels & Mastery" },
];

const RARITY_INFO = {
  common: { label: "COMMON", color: "#4b5563", border: "#000000" },
  uncommon: { label: "UNCOMMON", color: "#059669", border: "#000000" },
  rare: { label: "RARE", color: "#2563eb", border: "#000000" },
  epic: { label: "EPIC", color: "#7c3aed", border: "#000000" },
  legendary: { label: "LEGENDARY", color: "#d97706", border: "#000000" },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterUnlocked, setFilterUnlocked] = useState("all");

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/gamification/achievements");
      if (res.data?.success) {
        setAchievements(res.data.data);
      }
    } catch (err) {
      console.error("Error loading achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const unlockedPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filtered = achievements.filter((ach) => {
    if (selectedCategory !== "all" && ach.category !== selectedCategory) return false;
    if (filterUnlocked === "unlocked" && !ach.isUnlocked) return false;
    if (filterUnlocked === "locked" && ach.isUnlocked) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header matching dashboard/calories header style */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>BADGE & ACHIEVEMENT SHOWCASE</h1>
          <p className={styles.subtitle}>
            Unlock milestones automatically by maintaining streaks, consistency, and daily habits.
          </p>
        </div>

        <div className={styles.progressBox}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>COLLECTION PROGRESS</span>
            <span className={styles.progressVal}>
              {unlockedCount}/{totalCount} ({unlockedPercent}%)
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${unlockedPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Filters Bar with Neo-brutalist buttons */}
      <div className={styles.filtersRow}>
        <div className={styles.categoryButtons}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.filterBtn} ${selectedCategory === cat.id ? styles.activeFilter : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.statusButtons}>
          <button
            className={`${styles.statusBtn} ${filterUnlocked === "all" ? styles.activeStatus : ""}`}
            onClick={() => setFilterUnlocked("all")}
          >
            All ({totalCount})
          </button>
          <button
            className={`${styles.statusBtn} ${filterUnlocked === "unlocked" ? styles.activeStatus : ""}`}
            onClick={() => setFilterUnlocked("unlocked")}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            className={`${styles.statusBtn} ${filterUnlocked === "locked" ? styles.activeStatus : ""}`}
            onClick={() => setFilterUnlocked("locked")}
          >
            Locked ({totalCount - unlockedCount})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.loadingGrid}>
          <div className={styles.cardSkeleton}></div>
          <div className={styles.cardSkeleton}></div>
          <div className={styles.cardSkeleton}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyCard}>No achievements found for this filter.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((ach) => {
            const rarity = RARITY_INFO[ach.rarity] || RARITY_INFO.common;
            return (
              <div
                key={ach.key}
                className={`${styles.card} ${ach.isUnlocked ? styles.unlockedCard : styles.lockedCard}`}
              >
                <div className={styles.cardTop}>
                  <span
                    className={styles.rarityTag}
                    style={{ borderColor: rarity.color, color: rarity.color }}
                  >
                    {rarity.label}
                  </span>

                  {ach.isUnlocked ? (
                    <div className={styles.statusUnlocked}>
                      <CheckCircle size={15} />
                      <span>UNLOCKED</span>
                    </div>
                  ) : (
                    <div className={styles.statusLocked}>
                      <Lock size={14} />
                      <span>LOCKED</span>
                    </div>
                  )}
                </div>

                <div className={styles.iconBox}>
                  <div className={`${styles.iconWrap} ${ach.isUnlocked ? styles.iconWrapActive : ""}`}>
                    <GamificationIcon
                      name={ach.icon}
                      fallbackKey={ach.key}
                      size={34}
                      className={ach.isUnlocked ? styles.activeIconSvg : styles.lockedIconSvg}
                    />
                  </div>
                </div>

                <h3 className={styles.badgeName}>{ach.name}</h3>
                <p className={styles.badgeDesc}>{ach.description}</p>

                <div className={styles.cardBottom}>
                  <div className={styles.rewardsRow}>
                    {ach.xpReward > 0 && (
                      <span className={styles.xpPill}>
                        <Zap size={13} /> +{ach.xpReward} XP
                      </span>
                    )}
                    {ach.coinReward > 0 && (
                      <span className={styles.coinPill}>
                        <Coins size={13} /> +{ach.coinReward} Coins
                      </span>
                    )}
                  </div>

                  {ach.unlockedAt && (
                    <div className={styles.unlockedDate}>
                      Achieved {new Date(ach.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}