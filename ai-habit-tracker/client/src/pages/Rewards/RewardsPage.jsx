import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useGamification } from "../../context/GamificationContext";
import GamificationIcon from "../../components/GamificationIcon/GamificationIcon";
import { Coins, Shield, Check, AlertCircle } from "lucide-react";
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>HABIT REWARDS STORE</h1>
          <p className={styles.subtitle}>
            Spend hard-earned Habit Coins on streak protections, prestige titles, and power features.
          </p>
        </div>

        <div className={styles.balancesRow}>
          <div className={styles.balanceBox}>
            <Coins className={styles.coinIcon} size={28} />
            <div>
              <div className={styles.balanceVal}>{overview?.profile?.habitCoins ?? userCoins}</div>
              <div className={styles.balanceLabel}>AVAILABLE COINS</div>
            </div>
          </div>

          <div className={styles.balanceBox}>
            <Shield className={styles.shieldIcon} size={28} />
            <div>
              <div className={styles.balanceVal}>
                {overview?.profile?.streakFreezes ?? userFreezes} / 5
              </div>
              <div className={styles.balanceLabel}>STREAK FREEZES</div>
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
                className={`${styles.card} ${isRedeemed ? styles.redeemedCard : ""}`}
              >
                <div className={styles.cardTop}>
                  <span className={styles.catTag}>{item.category}</span>
                  <div className={styles.costTag}>
                    <Coins size={14} className={styles.coinIcon} />
                    <span>{item.coinCost} COINS</span>
                  </div>
                </div>

                <div className={styles.iconBox}>
                  <div className={styles.iconWrap}>
                    <GamificationIcon
                      name={item.icon}
                      fallbackKey={item.key}
                      size={36}
                      className={styles.itemSvg}
                    />
                  </div>
                </div>

                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemDesc}>{item.description}</p>

                <div className={styles.actionArea}>
                  {isRedeemed ? (
                    <button className={styles.ownedBtn} disabled>
                      <Check size={16} /> UNLOCKED
                    </button>
                  ) : isFullFreezes ? (
                    <button className={styles.ownedBtn} disabled>
                      INVENTORY FULL (5/5)
                    </button>
                  ) : (
                    <button
                      className={styles.redeemBtn}
                      disabled={!canAfford || redeemingKey === item.key}
                      onClick={() => handleRedeem(item.key)}
                    >
                      {redeemingKey === item.key
                        ? "REDEEMING..."
                        : canAfford
                        ? "REDEEM REWARD"
                        : "NEED MORE COINS"}
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