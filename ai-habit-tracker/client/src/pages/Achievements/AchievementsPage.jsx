import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { Trophy, Zap, Coins, Lock, CheckCircle, Filter } from "lucide-react";
import styles from "./AchievementsPage.module.css";

const CATEGORIES = [
  { id: "all", label: "All Badges" },
  { id: "streak", label: "Streaks" },
  { id: "consistency", label: "Consistency" },
  { id: "mastery", label: "Levels & Mastery" },
];

const RARITY_COLORS = {
  common: { border: "#9ca3af", badge: "#6b7280", label: "COMMON" },
  uncommon: { border: "#34d399", badge: "#059669", label: "UNCOMMON" },
  rare: { border: "#60a5fa", badge: "#2563eb", label: "RARE" },
  epic: { border: "#a78bfa", badge: "#7c3aed", label: "EPIC" },
  legendary: { border: "#fbbf24", badge: "#d97706", label: "LEGENDARY" },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterUnlocked, setFilterUnlocked] = useState("all"); // 'all', 'unlocked', 'locked'

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
    <div className={styles.pageContainer}>
      {/* Header Banner */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.trophyCircle}>
            <Trophy size={36} className={styles.headerTrophy} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Badge & Achievement Showcase</h1>
            <p className={styles.headerSubtitle}>
              Unlock milestones across streaks, mastery, and daily dedication.
            </p>
          </div>
        </div>

        <div className={styles.progressCard}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>Collection Progress</span>
            <span className={styles.progressVal}>
              {unlockedCount} / {totalCount} ({unlockedPercent}%)
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${unlockedPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filtersBar}>
        <div className={styles.categoryTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.tabBtn} ${selectedCategory === cat.id ? styles.activeTab : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.statusFilters}>
          <button
            className={`${styles.pillBtn} ${filterUnlocked === "all" ? styles.activePill : ""}`}
            onClick={() => setFilterUnlocked("all")}
          >
            All
          </button>
          <button
            className={`${styles.pillBtn} ${filterUnlocked === "unlocked" ? styles.activePill : ""}`}
            onClick={() => setFilterUnlocked("unlocked")}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            className={`${styles.pillBtn} ${filterUnlocked === "locked" ? styles.activePill : ""}`}
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
        <div className={styles.emptyState}>No achievements match the selected filters.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((ach) => {
            const rarity = RARITY_COLORS[ach.rarity] || RARITY_COLORS.common;
            return (
              <div
                key={ach.key}
                className={`${styles.badgeCard} ${ach.isUnlocked ? styles.unlockedCard : styles.lockedCard}`}
                style={{
                  borderColor: ach.isUnlocked ? rarity.border : "#e4e4e7",
                }}
              >
                <div className={styles.badgeTop}>
                  <span
                    className={styles.rarityBadge}
                    style={{ backgroundColor: rarity.badge }}
                  >
                    {rarity.label}
                  </span>

                  {ach.isUnlocked ? (
                    <div className={styles.unlockedIndicator}>
                      <CheckCircle size={14} />
                      <span>Unlocked</span>
                    </div>
                  ) : (
                    <div className={styles.lockedIndicator}>
                      <Lock size={13} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>

                <div className={styles.iconArea}>
                  <div className={`${styles.iconWrap} ${ach.isUnlocked ? styles.unlockedIconWrap : ""}`}>
                    <span className={styles.badgeEmoji}>{ach.icon || "??"}</span>
                  </div>
                </div>

                <h3 className={styles.badgeTitle}>{ach.name}</h3>
                <p className={styles.badgeDesc}>{ach.description}</p>

                <div className={styles.rewardFooter}>
                  {ach.xpReward > 0 && (
                    <div className={styles.rewardTag}>
                      <Zap size={13} className={styles.xpIcon} />
                      <span>+{ach.xpReward} XP</span>
                    </div>
                  )}
                  {ach.coinReward > 0 && (
                    <div className={styles.rewardTag}>
                      <Coins size={13} className={styles.coinIcon} />
                      <span>+{ach.coinReward} Coins</span>
                    </div>
                  )}
                </div>

                {ach.unlockedAt && (
                  <div className={styles.unlockDate}>
                    Unlocked on {new Date(ach.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
