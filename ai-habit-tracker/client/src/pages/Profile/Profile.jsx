import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useGamification } from "../../context/GamificationContext.jsx";
import api from "../../utils/api";
import GamificationIcon from "../../components/GamificationIcon/GamificationIcon";
import {
  FiUser,
  FiActivity,
  FiTarget,
  FiAlertCircle,
  FiCheckCircle,
  FiCamera,
  FiUploadCloud,
  FiBell,
  FiMail,
  FiClock,
  FiChevronRight,
  FiAward,
  FiGift,
  FiSettings,
  FiCheck,
  FiLock,
  FiZap,
} from "react-icons/fi";
import {
  Trophy,
  Flame,
  Coins,
  Shield,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Layers,
  TrendingUp,
} from "lucide-react";
import styles from "./Profile.module.css";

// Helper: relative time formatter (e.g. "2 hours ago", "Yesterday")
function formatTimeAgo(dateInput) {
  if (!dateInput) return "Recently";
  const now = new Date();
  const past = new Date(dateInput);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  if (diffDays > 30) {
    return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffHour >= 1) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffMin >= 1) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  return "Just now";
}

// Helper: format YYYY-MM-DD in local time
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Profile = () => {
  const { user, profile, refreshProfile, refreshUser } = useAuth();
  const { overview, refreshOverview, redeemReward } = useGamification();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab in the bottom card ("recent", "badges", "rewards", "settings")
  const currentTabParam = searchParams.get("tab") || "recent";
  const [activeTab, setActiveTab] = useState(
    ["recent", "badges", "rewards", "settings"].includes(currentTabParam)
      ? currentTabParam
      : "recent"
  );

  const settingsRef = useRef(null);

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // State for achievements & rewards
  const [achievements, setAchievements] = useState([]);
  const [rewardsCatalog, setRewardsCatalog] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState("all");
  const [selectedRewardCat, setSelectedRewardCat] = useState("all");
  const [redeemingKey, setRedeemingKey] = useState(null);
  const [rewardsFeedback, setRewardsFeedback] = useState(null);

  // User habits list for stats & category breakdown
  const [habits, setHabits] = useState([]);
  const [loadingHabits, setLoadingHabits] = useState(false);

  // Profile Settings Form State
  const [formData, setFormData] = useState({
    age: "",
    height: "",
    weight: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain",
    dailyGoal: "",
    proteinGoal: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email reminder preferences
  const [reminderPrefs, setReminderPrefs] = useState({
    emailNotifications: true,
    isReminderEnabled: true,
    dailyReminderTime: "20:00",
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState({ type: "", text: "" });

  // Avatar upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Load Achievements
  const loadAchievements = async () => {
    try {
      setLoadingAchievements(true);
      const res = await api.get("/gamification/achievements");
      if (res.data?.success) {
        setAchievements(res.data.data);
      }
    } catch (err) {
      console.error("Error loading achievements:", err);
    } finally {
      setLoadingAchievements(false);
    }
  };

  // Load Rewards Catalog
  const loadRewards = async () => {
    try {
      setLoadingRewards(true);
      const res = await api.get("/gamification/rewards");
      if (res.data?.success) {
        setRewardsCatalog(res.data.data.rewards || []);
      }
    } catch (err) {
      console.error("Error loading rewards:", err);
    } finally {
      setLoadingRewards(false);
    }
  };

  // Load Habits
  const loadHabits = async () => {
    try {
      setLoadingHabits(true);
      const res = await api.get("/habits/all");
      if (res.data) {
        setHabits(Array.isArray(res.data) ? res.data : res.data.habits || []);
      }
    } catch (err) {
      console.error("Error loading habits:", err);
    } finally {
      setLoadingHabits(false);
    }
  };

  useEffect(() => {
    loadAchievements();
    loadRewards();
    loadHabits();
  }, []);

  // Prepopulate form if profile details already exist
  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age || "",
        height: profile.height || "",
        weight: profile.weight || "",
        gender: profile.gender || "male",
        activityLevel: profile.activityLevel || "moderate",
        goal: profile.goal || "maintain",
        dailyGoal: profile.dailyGoal || "",
        proteinGoal: profile.proteinGoal || "",
      });
    }
  }, [profile]);

  // Prepopulate reminder prefs from user document
  useEffect(() => {
    if (user) {
      setReminderPrefs({
        emailNotifications: user.emailNotifications ?? true,
        isReminderEnabled: user.isReminderEnabled ?? true,
        dailyReminderTime: user.dailyReminderTime || "20:00",
      });
    }
  }, [user]);

  // Handle avatar file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please select a valid image file." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image file size must be less than 5MB." });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage({ type: "", text: "" });
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    setIsUploadingAvatar(true);
    setMessage({ type: "", text: "" });

    try {
      const data = new FormData();
      data.append("image", selectedFile);

      const res = await api.post("/profile/upload-avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.profileImage) {
        setMessage({ type: "success", text: "Profile picture updated successfully!" });
        if (refreshUser) await refreshUser();
        setSelectedFile(null);
        setPreviewUrl("");
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to upload avatar. Please try again.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      const payload = {
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      };

      if (formData.dailyGoal) payload.dailyGoal = parseInt(formData.dailyGoal);
      if (formData.proteinGoal) payload.proteinGoal = parseInt(formData.proteinGoal);

      const res = await api.post("/profile", payload);

      if (res.status === 200 || res.status === 201) {
        setMessage({ type: "success", text: "Profile configuration saved successfully!" });
        await refreshProfile();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("Error saving profile details:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReminderPrefs = async () => {
    setIsSavingPrefs(true);
    setPrefsMessage({ type: "", text: "" });
    try {
      await api.patch("/auth/reminder-preferences", reminderPrefs);
      if (refreshUser) await refreshUser();
      setPrefsMessage({ type: "success", text: "Reminder preferences saved!" });
      setTimeout(() => setPrefsMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setPrefsMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save preferences.",
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Redeem reward
  const handleRedeemReward = async (key) => {
    setRedeemingKey(key);
    setRewardsFeedback(null);
    const res = await redeemReward(key);
    if (res.success) {
      setRewardsFeedback({ type: "success", message: res.message });
      await loadRewards();
      await refreshOverview();
    } else {
      setRewardsFeedback({ type: "error", message: res.message });
    }
    setRedeemingKey(null);
  };

  // Compute stats
  const profileStats = overview?.profile?.stats || {};
  const totalHabitsCount = habits.length;
  const activeHabitsCount = habits.filter((h) => h.isActive !== false).length;
  const totalCompletedLogs = profileStats.totalCompletedLogs || 0;
  const maxStreak = Math.max(
    profileStats.maxStreak || 0,
    ...habits.map((h) => Math.max(h.streak || 0, h.longestStreak || 0, 0))
  );

  const userLevel = overview?.profile?.level || 1;
  const levelTitle = overview?.profile?.levelTitle || "Novice";
  const totalXP = overview?.profile?.totalXP || 0;
  const habitCoins = overview?.profile?.habitCoins || 0;
  const streakFreezes = overview?.profile?.streakFreezes || 0;
  const currentXPInLevel = overview?.profile?.currentXPInLevel || 0;
  const xpForNextLevel = overview?.profile?.xpForNextLevel || 100;
  const progressPercent = overview?.profile?.progressPercent || 0;

  // Unlocked & locked badges
  const unlockedBadges = useMemo(
    () => achievements.filter((a) => a.isUnlocked),
    [achievements]
  );
  const mostRecentBadge = useMemo(() => {
    if (!unlockedBadges.length) return null;
    return [...unlockedBadges].sort(
      (a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0)
    )[0];
  }, [unlockedBadges]);

  // Today completed habits
  const todayStr = toLocalDateString(new Date());
  const todayCompletedCount = habits.filter((h) => {
    if (!h.lastDate) return false;
    const lastDStr = typeof h.lastDate === "string" ? h.lastDate.split("T")[0] : toLocalDateString(new Date(h.lastDate));
    return lastDStr === todayStr && h.lastStatus === "done";
  }).length;

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const map = {};
    habits.forEach((h) => {
      const cat = h.category || "General";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [habits]);

  // Heatmap generation (52 weeks of days)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const map = overview?.activityHeatmap || {};
    const days = [];

    // Find the Sunday 52 weeks ago
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    // Align to Sunday
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);

    let curr = new Date(start);
    let totalSubmissions = 0;
    let activeDays = 0;

    while (curr <= today) {
      const dateStr = toLocalDateString(curr);
      const count = map[dateStr] || 0;
      if (count > 0) {
        totalSubmissions += count;
        activeDays += 1;
      }

      // Intensity level: 0 to 4
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count >= 3) level = 3;

      days.push({
        date: dateStr,
        count,
        level,
        dayOfWeek: curr.getDay(),
        month: curr.toLocaleString("en-US", { month: "short" }),
      });

      curr.setDate(curr.getDate() + 1);
    }

    return { days, totalSubmissions, activeDays };
  }, [overview?.activityHeatmap]);

  // Recent activity list
  const recentActivity = overview?.recentActivity || [];

  return (
    <div className={styles.profileContainer}>
      {/* 2-Column LeetCode-Inspired Layout */}
      <div className={styles.leetcodeLayout}>
        {/* ── LEFT SIDEBAR / IDENTITY CARD ── */}
        <aside className={styles.leftSidebar}>
          {/* Identity Card */}
          <div className={styles.identityCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className={styles.avatarImg} />
                ) : user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : <FiUser size={38} />}
                  </div>
                )}
                <label htmlFor="avatarInput" className={styles.cameraBtn} title="Upload Profile Picture">
                  <FiCamera size={16} />
                </label>
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.hiddenInput}
                />
              </div>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className={styles.uploadAvatarBtn}
                >
                  <FiUploadCloud size={14} />
                  {isUploadingAvatar ? "Saving..." : "Save Picture"}
                </button>
              )}
            </div>

            <div className={styles.userInfo}>
              <div className={styles.nameRow}>
                <h2 className={styles.displayName}>{user?.name || "Habit Master"}</h2>
                <span className={styles.verifiedBadge} title="Verified Active User">
                  ✓
                </span>
              </div>
              <p className={styles.username}>
                @{user?.email ? user.email.split("@")[0] : "user"}
              </p>

              <div className={styles.rankBadge}>
                <span className={styles.rankLabel}>Rank</span>
                <span className={styles.rankValue}>
                  {userLevel >= 10 ? `#${100 - userLevel}` : `#${1000 - userLevel * 50}`}
                </span>
                <span className={styles.tierPill}>Level {userLevel} • {levelTitle}</span>
              </div>

              <div className={styles.followStats}>
                <span>0 Following</span>
                <span className={styles.dot}>•</span>
                <span>0 Followers</span>
              </div>

              <button
                type="button"
                className={styles.editProfileBtn}
                onClick={() => {
                  handleTabChange("settings");
                  if (settingsRef.current) {
                    settingsRef.current.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <FiSettings size={15} />
                Edit Profile
              </button>
            </div>

            <div className={styles.divider} />

            {/* Community / Lifetime Stats */}
            <div className={styles.communityStats}>
              <h4 className={styles.sidebarSubheading}>Community Stats</h4>
              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <FiActivity size={15} className={styles.statIcon} />
                  <span>Habits Completed</span>
                </div>
                <span className={styles.statNum}>{totalCompletedLogs}</span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Flame size={15} className={styles.statIconFlame} />
                  <span>Max Streak</span>
                </div>
                <span className={styles.statNum}>{maxStreak} days</span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Zap size={15} className={styles.statIconZap} />
                  <span>Total XP</span>
                </div>
                <span className={styles.statNum}>{totalXP} XP</span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Coins size={15} className={styles.statIconCoins} />
                  <span>Habit Coins</span>
                </div>
                <span className={styles.statNum}>{habitCoins}</span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Shield size={15} className={styles.statIconShield} />
                  <span>Streak Freezes</span>
                </div>
                <span className={styles.statNum}>{streakFreezes}/5</span>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Categories / Skills Breakdown */}
            <div className={styles.categoriesSection}>
              <h4 className={styles.sidebarSubheading}>Habit Categories</h4>
              {categoryCounts.length === 0 ? (
                <p className={styles.emptyCategories}>No habits created yet.</p>
              ) : (
                <div className={styles.categoryTags}>
                  {categoryCounts.map((cat) => (
                    <div key={cat.name} className={styles.categoryBadge}>
                      <span className={styles.catName}>{cat.name}</span>
                      <span className={styles.catCount}>{cat.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Physical Attributes Preview */}
            {profile && (
              <>
                <div className={styles.divider} />
                <div className={styles.physicalPreview}>
                  <h4 className={styles.sidebarSubheading}>Physical Profile</h4>
                  <div className={styles.physGrid}>
                    <div className={styles.physItem}>
                      <span className={styles.physKey}>Age</span>
                      <span className={styles.physVal}>{profile.age || "--"}</span>
                    </div>
                    <div className={styles.physItem}>
                      <span className={styles.physKey}>Height</span>
                      <span className={styles.physVal}>{profile.height ? `${profile.height} cm` : "--"}</span>
                    </div>
                    <div className={styles.physItem}>
                      <span className={styles.physKey}>Weight</span>
                      <span className={styles.physVal}>{profile.weight ? `${profile.weight} kg` : "--"}</span>
                    </div>
                    <div className={styles.physItem}>
                      <span className={styles.physKey}>Goal</span>
                      <span className={styles.physVal} style={{ textTransform: "capitalize" }}>
                        {profile.goal || "--"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT ── */}
        <main className={styles.mainContent}>
          {/* TOP ROW: Solved Progress Card & Badges Showcase Card */}
          <section className={styles.topCardsRow}>
            {/* Solved / Circular Progress Card (LeetCode style) */}
            <div className={styles.solvedCard}>
              <div className={styles.circleContainer}>
                {/* SVG circular progress ring */}
                <svg className={styles.progressCircleSvg} viewBox="0 0 160 160">
                  <circle
                    className={styles.circleBg}
                    cx="80"
                    cy="80"
                    r="64"
                    strokeWidth="12"
                  />
                  <circle
                    className={styles.circleProgress}
                    cx="80"
                    cy="80"
                    r="64"
                    strokeWidth="12"
                    style={{
                      strokeDasharray: 402,
                      strokeDashoffset: 402 - (402 * Math.min(progressPercent, 100)) / 100,
                    }}
                  />
                </svg>
                <div className={styles.circleCenterText}>
                  <div className={styles.circleNumber}>
                    {totalCompletedLogs}
                    <span className={styles.circleTotal}>/{Math.max(totalHabitsCount, 1)}</span>
                  </div>
                  <div className={styles.circleLabel}>✓ Solved</div>
                  <div className={styles.circleSub}>{activeHabitsCount} Active</div>
                </div>
              </div>

              {/* Solved breakdown bars on the right */}
              <div className={styles.solvedBreakdown}>
                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.diffLabelEasy}>Daily Habits</span>
                    <span className={styles.diffCount}>
                      {todayCompletedCount}/{Math.max(activeHabitsCount, 1)}
                    </span>
                  </div>
                  <div className={styles.miniTrack}>
                    <div
                      className={`${styles.miniBar} ${styles.miniBarEasy}`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((todayCompletedCount / Math.max(activeHabitsCount, 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.diffLabelMed}>Streak Master</span>
                    <span className={styles.diffCount}>{maxStreak} Days</span>
                  </div>
                  <div className={styles.miniTrack}>
                    <div
                      className={`${styles.miniBar} ${styles.miniBarMed}`}
                      style={{
                        width: `${Math.min(100, (maxStreak / 30) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.diffLabelHard}>XP to Lvl {userLevel + 1}</span>
                    <span className={styles.diffCount}>
                      {currentXPInLevel}/{xpForNextLevel} XP
                    </span>
                  </div>
                  <div className={styles.miniTrack}>
                    <div
                      className={`${styles.miniBar} ${styles.miniBarHard}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Showcase Card (LeetCode style) */}
            <div className={styles.badgesCard}>
              <div className={styles.badgesHeader}>
                <div className={styles.badgesTitleGroup}>
                  <span className={styles.badgesLabel}>Badges</span>
                  <span className={styles.badgesCount}>{unlockedBadges.length}</span>
                </div>
                <button
                  type="button"
                  className={styles.viewAllBadgesBtn}
                  onClick={() => handleTabChange("badges")}
                  title="View All Badges"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>

              {/* Showcase badges list */}
              <div className={styles.badgesShowcaseRow}>
                {unlockedBadges.length === 0 ? (
                  <div className={styles.noBadgesCallout}>
                    <GamificationIcon name="target" size={32} />
                    <p>Complete your first habit to unlock the "First Step" badge!</p>
                  </div>
                ) : (
                  unlockedBadges.slice(0, 4).map((b) => (
                    <div
                      key={b.key}
                      className={styles.showcaseBadgeItem}
                      title={`${b.name}: ${b.description}`}
                      onClick={() => handleTabChange("badges")}
                    >
                      <div className={`${styles.badgeHexagon} ${styles[b.rarity || "common"]}`}>
                        <GamificationIcon name={b.icon || b.key} size={26} />
                      </div>
                      <span className={styles.badgeItemName}>{b.name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Most Recent Badge Highlight */}
              <div className={styles.mostRecentBadgeBox}>
                <span className={styles.recentBadgeLabel}>Most Recent Badge</span>
                <div className={styles.recentBadgeValue}>
                  {mostRecentBadge ? (
                    <>
                      <span className={styles.recentBadgeName}>{mostRecentBadge.name}</span>
                      {mostRecentBadge.unlockedAt && (
                        <span className={styles.recentBadgeDate}>
                          {formatTimeAgo(mostRecentBadge.unlockedAt)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.noRecentText}>No badges earned yet</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* MIDDLE ROW: Annual Submission Heatmap Card (LeetCode style) */}
          <section className={styles.heatmapSection}>
            <div className={styles.heatmapHeader}>
              <div className={styles.heatmapTitle}>
                <span className={styles.heatmapSubmissionsCount}>
                  {heatmapData.totalSubmissions}
                </span>{" "}
                habit completions in the past one year
              </div>

              <div className={styles.heatmapMeta}>
                <span>
                  Total active days: <strong>{heatmapData.activeDays}</strong>
                </span>
                <span className={styles.metaDivider}>|</span>
                <span>
                  Max streak: <strong>{maxStreak}</strong>
                </span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className={styles.heatmapGridWrapper}>
              <div className={styles.heatmapGrid}>
                {heatmapData.days.map((d, i) => (
                  <div
                    key={d.date}
                    className={`${styles.heatmapCell} ${styles[`level${d.level}`]}`}
                    data-tooltip={`${d.count} completion${d.count === 1 ? "" : "s"} on ${d.date}`}
                    title={`${d.count} completions on ${d.date}`}
                  />
                ))}
              </div>

              <div className={styles.heatmapFooter}>
                <div className={styles.heatmapMonths}>
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>

                <div className={styles.heatmapLegend}>
                  <span className={styles.legendLabel}>Less</span>
                  <span className={`${styles.legendCell} ${styles.level0}`} />
                  <span className={`${styles.legendCell} ${styles.level1}`} />
                  <span className={`${styles.legendCell} ${styles.level2}`} />
                  <span className={`${styles.legendCell} ${styles.level3}`} />
                  <span className={styles.legendLabel}>More</span>
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM ROW: Tabbed Views (Recent AC | Badges | Rewards | Settings) */}
          <section className={styles.tabsSection} ref={settingsRef}>
            <div className={styles.tabHeaders}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "recent" ? styles.tabBtnActive : ""}`}
                onClick={() => handleTabChange("recent")}
              >
                <FiClock size={16} />
                <span>Recent Activity</span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "badges" ? styles.tabBtnActive : ""}`}
                onClick={() => handleTabChange("badges")}
              >
                <FiAward size={16} />
                <span>All Badges ({achievements.length})</span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "rewards" ? styles.tabBtnActive : ""}`}
                onClick={() => handleTabChange("rewards")}
              >
                <FiGift size={16} />
                <span>Rewards Store</span>
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "settings" ? styles.tabBtnActive : ""}`}
                onClick={() => handleTabChange("settings")}
              >
                <FiSettings size={16} />
                <span>Edit Profile &amp; Settings</span>
              </button>
            </div>

            <div className={styles.tabBody}>
              {/* ── TAB 1: RECENT ACTIVITY ── */}
              {activeTab === "recent" && (
                <div className={styles.recentActivityTab}>
                  {recentActivity.length === 0 ? (
                    <div className={styles.emptyTabBox}>
                      <FiActivity size={32} />
                      <p>No recent completions recorded yet. Go to Dashboard and check off a habit!</p>
                    </div>
                  ) : (
                    <div className={styles.recentList}>
                      {recentActivity.map((act) => (
                        <div key={act._id || act.date} className={styles.recentItem}>
                          <div className={styles.recentItemLeft}>
                            <div className={styles.checkPill}>
                              <FiCheck size={14} />
                            </div>
                            <div className={styles.recentTitleGroup}>
                              <span className={styles.recentHabitTitle}>{act.habitTitle}</span>
                              <span className={styles.recentCategoryPill}>{act.category}</span>
                            </div>
                          </div>
                          <div className={styles.recentItemRight}>
                            <span className={styles.recentTime}>{formatTimeAgo(act.date || act.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: BADGES & ACHIEVEMENTS ── */}
              {activeTab === "badges" && (
                <div className={styles.badgesTab}>
                  <div className={styles.badgesFilterRow}>
                    {["all", "streak", "consistency", "mastery"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.badgeFilterBtn} ${
                          selectedBadgeFilter === cat ? styles.badgeFilterActive : ""
                        }`}
                        onClick={() => setSelectedBadgeFilter(cat)}
                      >
                        {cat === "all" ? "All Badges" : cat.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className={styles.badgesGrid}>
                    {achievements
                      .filter((ach) =>
                        selectedBadgeFilter === "all" ? true : ach.category === selectedBadgeFilter
                      )
                      .map((ach) => (
                        <div
                          key={ach.key}
                          className={`${styles.achievementCard} ${
                            ach.isUnlocked ? styles.unlockedCard : styles.lockedCard
                          }`}
                        >
                          <div className={styles.achCardTop}>
                            <div className={`${styles.achIconWrap} ${styles[ach.rarity || "common"]}`}>
                              <GamificationIcon name={ach.icon || ach.key} size={28} />
                            </div>
                            <span className={`${styles.achRarityTag} ${styles[ach.rarity || "common"]}`}>
                              {ach.rarity || "COMMON"}
                            </span>
                          </div>

                          <div className={styles.achInfo}>
                            <h4 className={styles.achName}>{ach.name}</h4>
                            <p className={styles.achDesc}>{ach.description}</p>
                          </div>

                          <div className={styles.achFooter}>
                            <span className={styles.achReward}>+{ach.xpReward} XP</span>
                            {ach.isUnlocked ? (
                              <span className={styles.unlockedTag}>
                                <FiCheck size={13} /> Unlocked
                              </span>
                            ) : (
                              <span className={styles.lockedTag}>
                                <FiLock size={13} /> Locked
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ── TAB 3: REWARDS STORE ── */}
              {activeTab === "rewards" && (
                <div className={styles.rewardsTab}>
                  <div className={styles.rewardsHeaderBar}>
                    <div className={styles.rewardsBalanceBox}>
                      <Coins className={styles.coinIcon} size={24} />
                      <div>
                        <div className={styles.rewardsBalanceNum}>{habitCoins}</div>
                        <div className={styles.rewardsBalanceLabel}>AVAILABLE COINS</div>
                      </div>
                    </div>

                    <div className={styles.rewardsBalanceBox}>
                      <Shield className={styles.shieldIcon} size={24} />
                      <div>
                        <div className={styles.rewardsBalanceNum}>{streakFreezes} / 5</div>
                        <div className={styles.rewardsBalanceLabel}>STREAK SHIELDS</div>
                      </div>
                    </div>
                  </div>

                  {rewardsFeedback && (
                    <div
                      className={`${styles.messageBox} ${
                        rewardsFeedback.type === "success" ? styles.success : styles.error
                      }`}
                    >
                      {rewardsFeedback.type === "success" ? (
                        <FiCheckCircle size={16} />
                      ) : (
                        <FiAlertCircle size={16} />
                      )}
                      <span>{rewardsFeedback.message}</span>
                    </div>
                  )}

                  <div className={styles.rewardsGrid}>
                    {rewardsCatalog.map((rew) => {
                      const isRedeemed = overview?.redeemedRewardKeys?.includes(rew.key);
                      const canAfford = habitCoins >= rew.coinCost;
                      const isFreezesMaxed =
                        rew.key === "streak_freeze_pack" && streakFreezes >= 5;

                      return (
                        <div key={rew.key} className={styles.rewardCard}>
                          <div className={styles.rewardCardTop}>
                            <div className={styles.rewardIconWrap}>
                              <GamificationIcon name={rew.icon || rew.key} size={28} />
                            </div>
                            <span className={styles.rewardCost}>
                              <Coins size={14} />
                              {rew.coinCost} Coins
                            </span>
                          </div>

                          <div className={styles.rewardCardBody}>
                            <h4 className={styles.rewardTitle}>{rew.name}</h4>
                            <p className={styles.rewardDesc}>{rew.description}</p>
                          </div>

                          <button
                            type="button"
                            className={styles.redeemBtn}
                            disabled={
                              redeemingKey === rew.key ||
                              (!rew.isRepeatable && isRedeemed) ||
                              !canAfford ||
                              isFreezesMaxed
                            }
                            onClick={() => handleRedeemReward(rew.key)}
                          >
                            {!rew.isRepeatable && isRedeemed
                              ? "Owned"
                              : isFreezesMaxed
                              ? "Shields Full"
                              : !canAfford
                              ? "Need More Coins"
                              : redeemingKey === rew.key
                              ? "Redeeming..."
                              : `Redeem for ${rew.coinCost} Coins`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TAB 4: EDIT PROFILE & EMAIL REMINDERS ── */}
              {activeTab === "settings" && (
                <div className={styles.settingsTab}>
                  {message.text && (
                    <div className={`${styles.messageBox} ${styles[message.type]}`}>
                      {message.type === "success" ? (
                        <FiCheckCircle size={18} />
                      ) : (
                        <FiAlertCircle size={18} />
                      )}
                      <p>{message.text}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className={styles.profileForm}>
                    {/* Account Read-only */}
                    <div className={styles.formSection}>
                      <h4 className={styles.sectionTitle}>Account Details</h4>
                      <div className={styles.readOnlyGrid}>
                        <div className={styles.readOnlyItem}>
                          <span className={styles.readOnlyLabel}>Name</span>
                          <span className={styles.readOnlyValue}>{user?.name || "User"}</span>
                        </div>
                        <div className={styles.readOnlyItem}>
                          <span className={styles.readOnlyLabel}>Email</span>
                          <span className={styles.readOnlyValue}>{user?.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <hr className={styles.divider} />

                    {/* Physical Details */}
                    <div className={styles.formSection}>
                      <h4 className={styles.sectionTitle}>Physical Attributes</h4>
                      <div className={styles.inputsGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Age (Years)</label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="e.g. 25"
                            required
                            min="1"
                            max="120"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Height (cm)</label>
                          <input
                            type="number"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            placeholder="e.g. 175"
                            required
                            min="50"
                            max="300"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Weight (kg)</label>
                          <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="e.g. 70"
                            required
                            min="20"
                            max="500"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Gender</label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className={styles.select}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <hr className={styles.divider} />

                    {/* Lifestyle Goals */}
                    <div className={styles.formSection}>
                      <h4 className={styles.sectionTitle}>Lifestyle &amp; Objectives</h4>
                      <div className={styles.inputsGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Activity Level</label>
                          <select
                            name="activityLevel"
                            value={formData.activityLevel}
                            onChange={handleChange}
                            className={styles.select}
                          >
                            <option value="sedentary">Sedentary (0-1 days/week)</option>
                            <option value="light">Light (1-3 days/week)</option>
                            <option value="moderate">Moderate (3-5 days/week)</option>
                            <option value="active">Active (6-7 days/week)</option>
                            <option value="very_active">Very Active (2x daily)</option>
                          </select>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Fitness Objective</label>
                          <select
                            name="goal"
                            value={formData.goal}
                            onChange={handleChange}
                            className={styles.select}
                          >
                            <option value="lose">Weight Loss (Deficit)</option>
                            <option value="maintain">Weight Maintenance</option>
                            <option value="gain">Muscle Gain (Surplus)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <hr className={styles.divider} />

                    {/* Custom Daily Targets */}
                    <div className={styles.formSection}>
                      <h4 className={styles.sectionTitle}>Custom Daily Targets (Optional)</h4>
                      <div className={styles.inputsGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Daily Calories (kcal)</label>
                          <input
                            type="number"
                            name="dailyGoal"
                            value={formData.dailyGoal}
                            onChange={handleChange}
                            placeholder="Auto-calculated (TDEE)"
                            min="500"
                            max="10000"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Daily Protein (g)</label>
                          <input
                            type="number"
                            name="proteinGoal"
                            value={formData.proteinGoal}
                            onChange={handleChange}
                            placeholder="Auto-calculated"
                            min="20"
                            max="500"
                            className={styles.input}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Reminders Section */}
                    <div className={styles.reminderSection}>
                      <div className={styles.reminderSectionHeader}>
                        <FiBell size={16} />
                        <h4 className={styles.reminderSectionTitle}>Email Reminder Preferences</h4>
                      </div>

                      <div className={styles.reminderToggleRow}>
                        <div className={styles.reminderToggleInfo}>
                          <FiMail size={18} className={styles.reminderIcon} />
                          <div>
                            <div className={styles.reminderToggleLabel}>Email Notifications</div>
                            <div className={styles.reminderToggleSub}>Receive habit-related email alerts</div>
                          </div>
                        </div>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={reminderPrefs.emailNotifications}
                            onChange={(e) =>
                              setReminderPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))
                            }
                            className={styles.toggleInput}
                          />
                          <span
                            className={`${styles.toggleTrack} ${
                              reminderPrefs.emailNotifications ? styles.toggleActive : ""
                            }`}
                          />
                          <span
                            className={styles.toggleThumb}
                            style={{ left: reminderPrefs.emailNotifications ? "22px" : "3px" }}
                          />
                        </label>
                      </div>

                      <div className={styles.reminderToggleRow}>
                        <div className={styles.reminderToggleInfo}>
                          <FiFlame size={18} className={styles.reminderIcon} />
                          <div>
                            <div className={styles.reminderToggleLabel}>Daily Habit Reminders</div>
                            <div className={styles.reminderToggleSub}>Remind me to complete pending habits</div>
                          </div>
                        </div>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={reminderPrefs.isReminderEnabled}
                            disabled={!reminderPrefs.emailNotifications}
                            onChange={(e) =>
                              setReminderPrefs((p) => ({ ...p, isReminderEnabled: e.target.checked }))
                            }
                            className={styles.toggleInput}
                          />
                          <span
                            className={`${styles.toggleTrack} ${
                              reminderPrefs.isReminderEnabled && reminderPrefs.emailNotifications
                                ? styles.toggleActive
                                : ""
                            }`}
                          />
                          <span
                            className={styles.toggleThumb}
                            style={{
                              left:
                                reminderPrefs.isReminderEnabled && reminderPrefs.emailNotifications
                                  ? "22px"
                                  : "3px",
                            }}
                          />
                        </label>
                      </div>

                      {reminderPrefs.emailNotifications && reminderPrefs.isReminderEnabled && (
                        <div className={styles.reminderTimePicker}>
                          <div className={styles.reminderTimeHeader}>
                            <FiClock size={15} className={styles.reminderIcon} />
                            <span className={styles.reminderToggleLabel}>Preferred Reminder Time (IST)</span>
                          </div>
                          <div className={styles.reminderTimeGrid}>
                            {["08:00", "12:00", "18:00", "20:00", "21:00", "22:00"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setReminderPrefs((p) => ({ ...p, dailyReminderTime: t }))}
                                className={`${styles.reminderTimeBtn} ${
                                  reminderPrefs.dailyReminderTime === t ? styles.reminderTimeBtnActive : ""
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {prefsMessage.text && (
                        <div className={`${styles.messageBox} ${styles[prefsMessage.type]}`}>
                          {prefsMessage.type === "success" ? (
                            <FiCheckCircle size={15} />
                          ) : (
                            <FiAlertCircle size={15} />
                          )}
                          <p>{prefsMessage.text}</p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveReminderPrefs}
                        disabled={isSavingPrefs}
                        className={styles.secondarySaveBtn}
                      >
                        {isSavingPrefs ? "Saving..." : "Save Reminder Preferences"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`${styles.primarySaveBtn} ${isSubmitting ? styles.submitting : ""}`}
                    >
                      {isSubmitting ? "Saving Details..." : "Save Profile Configuration"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;
