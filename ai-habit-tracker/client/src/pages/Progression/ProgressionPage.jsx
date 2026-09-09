import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../../context/GamificationContext";
import StreakCalendar from "../../components/StreakCalendar/StreakCalendar";
import ChallengeCard from "../../components/ChallengeCard/ChallengeCard";
import api from "../../utils/api";
import {
  Zap,
  Coins,
  Shield,
  Trophy,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  Calendar,
} from "lucide-react";
import styles from "./ProgressionPage.module.css";

export default function ProgressionPage() {
  const {
    overview,
    loading,
    refreshOverview,
    joinChallenge,
    generateAIChallenges,
  } = useGamification();

  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadChallenges();
    loadAnalytics();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const res = await api.get("/gamification/challenges");
      if (res.data?.success) {
        setChallenges(res.data.data);
      }
    } catch (err) {
      console.error("Error loading challenges:", err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await api.get("/habits/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error loading habit analytics:", err);
    }
  };

  const handleJoinChallenge = async (id) => {
    setJoiningId(id);
    await joinChallenge(id);
    await loadChallenges();
    setJoiningId(null);
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    await generateAIChallenges();
    await loadChallenges();
    setGeneratingAI(false);
  };

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

  const recentTx = overview?.recentTransactions || [];

  return (
    <div className={styles.pageContainer}>
      {/* Header Banner */}
      <div className={styles.heroCard}>
        <div className={styles.heroMain}>
          <div className={styles.levelBadge}>
            <span className={styles.levelPrefix}>LEVEL</span>
            <span className={styles.levelNum}>{profile.level}</span>
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.titleRow}>
              <h1 className={styles.heroTitle}>{profile.levelTitle}</h1>
              <span className={styles.totalXPBadge}>{profile.totalXP} Total XP</span>
            </div>
            <p className={styles.heroSubtitle}>
              Keep completing daily habits to earn XP, level up, and unlock rewards.
            </p>
            <div className={styles.xpProgressWrapper}>
              <div className={styles.xpInfoRow}>
                <span>
                  {profile.currentXPInLevel} / {profile.xpForNextLevel} XP to Level {profile.level + 1}
                </span>
                <span className={styles.percentText}>{profile.progressPercent}%</span>
              </div>
              <div className={styles.xpTrack}>
                <div
                  className={styles.xpBar}
                  style={{ width: `${Math.min(100, Math.max(3, profile.progressPercent))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Inventory counters */}
        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Coins className={styles.coinIcon} />
            </div>
            <div>
              <div className={styles.statNum}>{profile.habitCoins}</div>
              <div className={styles.statName}>Habit Coins</div>
            </div>
            <Link to="/rewards" className={styles.storeLink}>
              Store <ArrowRight size={13} />
            </Link>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Shield className={styles.shieldIcon} />
            </div>
            <div>
              <div className={styles.statNum}>{profile.streakFreezes} / 5</div>
              <div className={styles.statName}>Streak Freezes</div>
            </div>
            <span className={styles.freezeHint}>Auto-shields missed days</span>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Trophy className={styles.trophyIcon} />
            </div>
            <div>
              <div className={styles.statNum}>Achievements</div>
              <div className={styles.statName}>Badges & Trophies</div>
            </div>
            <Link to="/achievements" className={styles.storeLink}>
              View <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Consistency & Streaks */}
      <div className={styles.sectionRow}>
        <div className={styles.calendarCol}>
          <StreakCalendar completionMap={analytics?.dailyCompletion || {}} />
        </div>
      </div>

      {/* Challenges Section */}
      <div className={styles.challengesSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Active & Available Challenges</h2>
            <p className={styles.sectionSubtitle}>
              Push your limits and claim bonus XP and coins by conquering challenges.
            </p>
          </div>

          <button
            className={styles.aiButton}
            onClick={handleGenerateAI}
            disabled={generatingAI}
          >
            <Sparkles size={16} />
            <span>{generatingAI ? "Groq AI Generating..." : "Generate AI Challenges"}</span>
          </button>
        </div>

        {loadingChallenges ? (
          <div className={styles.loadingGrid}>
            <div className={styles.cardSkeleton}></div>
            <div className={styles.cardSkeleton}></div>
          </div>
        ) : challenges.length === 0 ? (
          <div className={styles.emptyCard}>
            <Sparkles size={24} />
            <p>No challenges available right now. Click "Generate AI Challenges" to create personalized ones!</p>
          </div>
        ) : (
          <div className={styles.challengesGrid}>
            {challenges.map((ch) => (
              <ChallengeCard
                key={ch._id}
                challenge={ch}
                onJoin={handleJoinChallenge}
                joining={joiningId === ch._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* XP Transaction History */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <History size={18} />
          <h2 className={styles.historyTitle}>Recent XP Activity</h2>
        </div>

        {recentTx.length === 0 ? (
          <div className={styles.emptyHistory}>No XP transactions recorded yet. Complete a habit to get started!</div>
        ) : (
          <div className={styles.txList}>
            {recentTx.map((tx) => (
              <div key={tx._id} className={styles.txItem}>
                <div className={styles.txLeft}>
                  <div className={styles.txIconWrap}>
                    <Zap size={14} className={styles.txZap} />
                  </div>
                  <div>
                    <div className={styles.txSource}>
                      {tx.source.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div className={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString()} at{" "}
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                <div className={styles.txRight}>
                  <span className={styles.txAmount}>+{tx.amount} XP</span>
                  {tx.coins > 0 && <span className={styles.txCoins}>+{tx.coins} Coins</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
