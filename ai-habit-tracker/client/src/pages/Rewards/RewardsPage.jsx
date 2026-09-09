import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useGamification } from "../../context/GamificationContext";
import { Coins, Shield, Sparkles, Check, AlertCircle } from "lucide-react";
import styles from "./RewardsPage.module.css";

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "functional", label: "Functional & Shields" },
  { id: "recognition", label: "Prestige Titles" },
  { id: "cosmetic", label: "Themes & Frames" },
];

export default function RewardsPage() {
  const { overview, refreshOverview, redeemReward } = useGamification();
  const [catalog, setCatalog] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [userFreezes, setUserFreezes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [redeemingKey, setRedeemingKey] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadRewards();
  }, [overview]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const res = await api.get("/gamification/rewards");
      if (res.data?.success) {
        setCatalog(res.data.data.rewards);
        setUserCoins(res.data.data.habitCoins);
        setUserFreezes(res.data.data.streakFreezes);
      }
    } catch (err) {
      console.error("Error loading rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (key) => {
    setRedeemingKey(key);
    setFeedback(null);
    const res = await redeemReward(key);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      await loadRewards();
      await refreshOverview();
    } else {
      setFeedback({ type: "error", message: res.message });
    }
    setRedeemingKey(null);
  };

  const filtered = catalog.filter((rew) => {
    if (selectedCategory === "all") return true;
    return rew.category === selectedCategory;
  });

  return (
    <div className={styles.pageContainer}>
      {/* Balance Bar */}
      <div className={styles.balanceHeader}>
        <div>
          <h1 className={styles.title}>Habit Rewards Store</h1>
          <p className={styles.subtitle}>
            Spend hard-earned Habit Coins on streak protections, prestige titles, and power features.
          </p>
        </div>

        <div className={styles.balances}>
          <div className={styles.coinCard}>
            <Coins className={styles.coinIcon} size={28} />
            <div>
              <div className={styles.coinVal}>{overview?.profile?.habitCoins ?? userCoins}</div>
              <div className={styles.coinLabel}>Available Coins</div>
            </div>
          </div>

          <div className={styles.shieldCard}>
            <Shield className={styles.shieldIcon} size={26} />
            <div>
              <div className={styles.shieldVal}>
                {overview?.profile?.streakFreezes ?? userFreezes} / 5
              </div>
              <div className={styles.shieldLabel}>Streak Freezes</div>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`${styles.feedbackBanner} ${styles[feedback.type]}`}>
          {feedback.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className={styles.tabsRow}>
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

      {/* Grid */}
      {loading ? (
        <div className={styles.loadingGrid}>
          <div className={styles.cardSkeleton}></div>
          <div className={styles.cardSkeleton}></div>
          <div className={styles.cardSkeleton}></div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item) => {
            const isRedeemed = item.isRedeemed && !item.isRepeatable;
            const canAfford = (overview?.profile?.habitCoins ?? userCoins) >= item.coinCost;
            const isFullFreezes =
              item.key === "streak_freeze_pack" &&
              (overview?.profile?.streakFreezes ?? userFreezes) >= 5;

            return (
              <div
                key={item.key}
                className={`${styles.rewardCard} ${isRedeemed ? styles.redeemedCard : ""}`}
              >
                <div className={styles.itemTop}>
                  <span className={styles.catTag}>{item.category}</span>
                  <div className={styles.costBadge}>
                    <Coins size={14} className={styles.coinIcon} />
                    <span>{item.coinCost}</span>
                  </div>
                </div>

                <div className={styles.iconCircle}>
                  <span className={styles.itemEmoji}>{item.icon || "??"}</span>
                </div>

                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemDesc}>{item.description}</p>

                <div className={styles.actionArea}>
                  {isRedeemed ? (
                    <button className={styles.ownedBtn} disabled>
                      <Check size={16} /> Unlocked
                    </button>
                  ) : isFullFreezes ? (
                    <button className={styles.ownedBtn} disabled>
                      Inventory Full (5/5)
                    </button>
                  ) : (
                    <button
                      className={styles.redeemBtn}
                      disabled={!canAfford || redeemingKey === item.key}
                      onClick={() => handleRedeem(item.key)}
                    >
                      {redeemingKey === item.key
                        ? "Redeeming..."
                        : canAfford
                        ? "Redeem Reward"
                        : "Need More Coins"}
                    </button>
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
