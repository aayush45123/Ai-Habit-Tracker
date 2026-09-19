import React from "react";
import styles from "./Skeleton.module.css";

/**
 * Base Skeleton primitive — renders a shimming placeholder block.
 *
 * Props:
 *   width    — CSS width  (default "100%")
 *   height   — CSS height (default "1rem")
 *   variant  — "rect" | "rounded" | "circle" (default "rect")
 *   style    — extra inline style overrides
 *   className — extra class names
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  variant = "rect",
  style = {},
  className = "",
}) {
  return (
    <span
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * Full-page app-shell skeleton shown while auth / route guards are loading.
 * Mimics the sidebar + main content layout.
 */
export function AppShellSkeleton() {
  return (
    <div className={styles.appShell} aria-label="Loading…" role="status">
      {/* Sidebar */}
      <aside className={styles.appShellSidebar}>
        <Skeleton height="48px" width="80%" variant="rect" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} height="40px" width="100%" variant="rect" />
        ))}
      </aside>

      {/* Main content area */}
      <main className={styles.appShellMain}>
        <Skeleton height="44px" width="260px" variant="rect" />
        <Skeleton height="20px" width="180px" variant="rounded" />
        <div className={styles.appShellCardGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="260px" variant="rect" />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ─── Dashboard Skeleton ──────────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className={styles.dashSkeleton} aria-label="Loading dashboard…" role="status">
      {/* Header */}
      <div className={styles.dashSkeletonHeader}>
        <div className={styles.dashSkeletonHeaderLeft}>
          <Skeleton height="36px" width="min(220px, 60%)" variant="rect" />
          <Skeleton height="18px" width="min(320px, 80%)" variant="rounded" />
        </div>
        <Skeleton height="42px" width="120px" variant="rect" />
      </div>

      {/* Stats bar */}
      <div className={styles.dashSkeletonStatsBar}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.dashSkeletonStat}>
            <Skeleton height="32px" width="50px" variant="rect" />
            <Skeleton height="14px" width="70%" variant="rounded" />
          </div>
        ))}
      </div>

      {/* Gamification widget placeholder */}
      <Skeleton height="80px" width="100%" variant="rect" className={styles.dashSkeletonGamification} />

      {/* Main grid */}
      <div className={styles.dashSkeletonGrid}>
        {/* Habits column */}
        <div className={styles.dashSkeletonHabitsPanel}>
          <div className={styles.dashSkeletonPanelHeader}>
            <Skeleton height="22px" width="140px" variant="rect" />
            <Skeleton height="22px" width="50px" variant="rounded" />
          </div>
          <Skeleton height="6px" width="100%" variant="rounded" className={styles.dashSkeletonProgressBar} />
          <div className={styles.dashSkeletonHabitList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.dashSkeletonHabitCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <Skeleton height="24px" width="24px" variant="circle" />
                  <Skeleton height="18px" width="60%" variant="rounded" />
                </div>
                <Skeleton height="32px" width="80px" variant="rect" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar column */}
        <div className={styles.dashSkeletonSidebarCol}>
          {/* Weekly chart panel */}
          <div className={styles.dashSkeletonSidePanel}>
            <div className={styles.dashSkeletonPanelHeader}>
              <Skeleton height="20px" width="60%" variant="rect" />
              <Skeleton height="16px" width="60px" variant="rounded" />
            </div>
            <Skeleton height="120px" width="100%" variant="rect" />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {["M","T","W","T","F","S","S"].map((_, i) => (
                <Skeleton key={i} height="14px" width="20px" variant="rounded" />
              ))}
            </div>
          </div>

          {/* AI Insights panel */}
          <div className={styles.dashSkeletonSidePanel}>
            <Skeleton height="20px" width="80px" variant="rect" />
            <Skeleton height="16px" width="100%" variant="rounded" />
            <Skeleton height="16px" width="85%" variant="rounded" />
            <Skeleton height="16px" width="70%" variant="rounded" />
          </div>

          {/* Risk alerts panel */}
          <div className={styles.dashSkeletonSidePanel}>
            <Skeleton height="20px" width="100px" variant="rect" />
            <Skeleton height="80px" width="100%" variant="rect" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AIChat Skeleton ──────────────────────────────────────────── */
export function AIChatSkeleton() {
  return (
    <div className={styles.aiChatSkeleton} aria-label="Loading AI insights…" role="status">
      {/* Page header */}
      <div className={styles.aiChatSkeletonHeader}>
        <Skeleton height="36px" width="min(240px, 70%)" variant="rect" />
      </div>

      {/* Overview section */}
      <div className={styles.aiChatSkeletonSection}>
        <Skeleton height="22px" width="80px" variant="rect" />
        <Skeleton height="16px" width="100%" variant="rounded" />
        <Skeleton height="16px" width="90%" variant="rounded" />
        <Skeleton height="16px" width="75%" variant="rounded" />
      </div>

      {/* Performance grid */}
      <div className={styles.aiChatSkeletonSection}>
        <Skeleton height="22px" width="180px" variant="rect" />
        <div className={styles.aiChatSkeletonGrid}>
          {["Strongest", "Weakest", "Best Day"].map((label, i) => (
            <div key={i} className={styles.aiChatSkeletonStat}>
              <Skeleton height="14px" width="80%" variant="rounded" />
              <Skeleton height="20px" width="60%" variant="rect" />
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.aiChatSkeletonSection}>
        <Skeleton height="22px" width="230px" variant="rect" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.aiChatSkeletonCard}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton height="16px" width="140px" variant="rounded" />
              <Skeleton height="16px" width="60px" variant="rounded" />
            </div>
            <Skeleton height="18px" width="70%" variant="rect" />
            <Skeleton height="14px" width="100%" variant="rounded" />
            <Skeleton height="14px" width="85%" variant="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Journal Skeleton ────────────────────────────────────────── */
export function JournalSkeleton() {
  return (
    <div className={styles.journalSkeleton} aria-label="Loading journal…" role="status">
      {/* Header */}
      <div className={styles.journalSkeletonHeader}>
        <Skeleton height="36px" width="min(300px, 80%)" variant="rect" />
        <Skeleton height="18px" width="min(400px, 100%)" variant="rounded" />
      </div>

      {/* Stats grid */}
      <div className={styles.journalSkeletonStats}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.journalSkeletonStat}>
            <Skeleton height="28px" width="60%" variant="rect" />
            <Skeleton height="14px" width="80%" variant="rounded" />
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className={styles.journalSkeletonTabs}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="38px" width="120px" variant="rect" style={{ flexShrink: 0 }} />
        ))}
      </div>

      {/* Tab content area */}
      <div className={styles.journalSkeletonContent}>
        <Skeleton height="24px" width="min(180px, 50%)" variant="rect" />
        <div className={styles.journalSkeletonInputArea}>
          <Skeleton height="44px" width="100%" variant="rect" />
          <Skeleton height="140px" width="100%" variant="rect" />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Skeleton height="38px" width="120px" variant="rect" />
            <Skeleton height="38px" width="120px" variant="rect" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Calories Skeleton ───────────────────────────────────────── */
export function CaloriesSkeleton() {
  return (
    <div className={styles.caloriesSkeleton} aria-label="Loading calorie tracker…" role="status">
      {/* Header */}
      <div className={styles.caloriesSkeletonHeader}>
        <Skeleton height="36px" width="min(200px, 60%)" variant="rect" />
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Skeleton height="38px" width="140px" variant="rect" />
          <Skeleton height="38px" width="150px" variant="rect" />
        </div>
      </div>

      {/* Recommendation card */}
      <div className={styles.caloriesSkeletonCard}>
        <Skeleton height="22px" width="min(260px, 70%)" variant="rect" />
        <Skeleton height="16px" width="100%" variant="rounded" />
        <Skeleton height="16px" width="85%" variant="rounded" />
      </div>

      {/* Today's progress card */}
      <div className={styles.caloriesSkeletonCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton height="22px" width="min(160px, 50%)" variant="rect" />
          <Skeleton height="36px" width="100px" variant="rect" />
        </div>
        <div className={styles.caloriesSkeletonStatusGrid}>
          {["Calorie Goal", "Consumed", "Remaining", "Protein"].map((_, i) => (
            <div key={i} className={styles.caloriesSkeletonStatusItem}>
              <Skeleton height="14px" width="80%" variant="rounded" />
              <Skeleton height="24px" width="60%" variant="rect" />
            </div>
          ))}
        </div>
      </div>

      {/* Food input row */}
      <div className={styles.caloriesSkeletonInputRow}>
        <Skeleton height="48px" width="100%" variant="rect" style={{ flex: 1 }} />
        <Skeleton height="48px" width="80px" variant="rect" style={{ flexShrink: 0 }} />
      </div>

      {/* Food log entries */}
      <div className={styles.caloriesSkeletonCard}>
        <Skeleton height="22px" width="min(140px, 50%)" variant="rect" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--color-bg-tertiary)" }}>
            <Skeleton height="18px" width="50%" variant="rounded" />
            <Skeleton height="18px" width="80px" variant="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Progression Skeleton ────────────────────────────────────── */
export function ProgressionSkeleton() {
  return (
    <div className={styles.progressionSkeleton} aria-label="Loading progression…" role="status">
      {/* Hero card */}
      <div className={styles.progressionSkeletonHero}>
        <div className={styles.progressionSkeletonHeroMain}>
          <Skeleton height="72px" width="72px" variant="rect" style={{ flexShrink: 0 }} />
          <div className={styles.progressionSkeletonHeroMeta}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Skeleton height="28px" width="min(160px, 50%)" variant="rect" />
              <Skeleton height="22px" width="100px" variant="rounded" />
            </div>
            <Skeleton height="16px" width="100%" variant="rounded" />
            <Skeleton height="10px" width="100%" variant="rounded" />
          </div>
        </div>

        <div className={styles.progressionSkeletonHeroStats}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.progressionSkeletonStatBox}>
              <Skeleton height="24px" width="24px" variant="circle" />
              <Skeleton height="24px" width="60%" variant="rect" />
              <Skeleton height="14px" width="80%" variant="rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Streak calendar placeholder */}
      <div className={styles.progressionSkeletonSection}>
        <Skeleton height="22px" width="min(200px, 60%)" variant="rect" />
        <Skeleton height="180px" width="100%" variant="rect" />
      </div>

      {/* Challenges section */}
      <div className={styles.progressionSkeletonSection}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <Skeleton height="22px" width="min(260px, 70%)" variant="rect" />
          <Skeleton height="40px" width="180px" variant="rect" />
        </div>
        <div className={styles.progressionSkeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.progressionSkeletonCard}>
              <Skeleton height="20px" width="70%" variant="rect" />
              <Skeleton height="14px" width="100%" variant="rounded" />
              <Skeleton height="8px" width="100%" variant="rounded" />
              <Skeleton height="38px" width="120px" variant="rect" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Focus/Pomodoro Skeleton ─────────────────────────────────── */
export function FocusSkeleton() {
  return (
    <div className={styles.focusSkeleton} aria-label="Loading focus timer…" role="status">
      {/* Header */}
      <div className={styles.focusSkeletonHeader}>
        <Skeleton height="32px" width="min(280px, 70%)" variant="rect" />
        <Skeleton height="16px" width="100%" variant="rounded" />
        <Skeleton height="16px" width="85%" variant="rounded" />
      </div>

      {/* Top bar */}
      <div className={styles.focusSkeletonTop}>
        <div className={styles.focusSkeletonControls}>
          <Skeleton height="36px" width="80px" variant="rect" />
          <Skeleton height="36px" width="100px" variant="rect" />
          <Skeleton height="36px" width="100px" variant="rect" />
        </div>
        <div className={styles.focusSkeletonStats}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <Skeleton height="14px" width="80px" variant="rounded" />
            <Skeleton height="24px" width="40px" variant="rect" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <Skeleton height="14px" width="60px" variant="rounded" />
            <Skeleton height="24px" width="40px" variant="rect" />
          </div>
        </div>
      </div>

      {/* Timer card */}
      <div className={styles.focusSkeletonCard}>
        <div className={styles.focusSkeletonTimer}>
          <Skeleton height="20px" width="80px" variant="rounded" />
          <Skeleton height="80px" width="min(220px, 60%)" variant="rect" />
          <Skeleton height="10px" width="min(300px, 80%)" variant="rounded" />
          <Skeleton height="14px" width="50px" variant="rounded" />
        </div>
        <div className={styles.focusSkeletonActions}>
          <Skeleton height="44px" width="100px" variant="rect" />
          <Skeleton height="44px" width="80px" variant="rect" />
          <Skeleton height="44px" width="70px" variant="rect" />
        </div>
      </div>

      {/* Analytics placeholder */}
      <div className={styles.focusSkeletonAnalytics}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.focusSkeletonAnalyticsCard}>
            <Skeleton height="16px" width="80%" variant="rounded" />
            <Skeleton height="28px" width="60%" variant="rect" />
            <Skeleton height="60px" width="100%" variant="rect" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Achievements Skeleton ───────────────────────────────────── */
export function AchievementsSkeleton() {
  return (
    <div className={styles.achievementsSkeleton} aria-label="Loading achievements…" role="status">
      {/* Header */}
      <div className={styles.achievementsSkeletonHeader}>
        <div className={styles.achievementsSkeletonHeaderLeft}>
          <Skeleton height="32px" width="min(320px, 80%)" variant="rect" />
          <Skeleton height="18px" width="min(420px, 100%)" variant="rounded" />
        </div>
        <div className={styles.achievementsSkeletonProgress}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton height="14px" width="40%" variant="rounded" />
            <Skeleton height="14px" width="30%" variant="rounded" />
          </div>
          <Skeleton height="8px" width="100%" variant="rounded" />
        </div>
      </div>

      {/* Filter row */}
      <div className={styles.achievementsSkeletonFilters}>
        <div className={styles.achievementsSkeletonFilterGroup}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="36px" width="100px" variant="rect" />
          ))}
        </div>
        <div className={styles.achievementsSkeletonFilterGroup}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="36px" width="90px" variant="rect" />
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className={styles.achievementsSkeletonGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.achievementsSkeletonCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton height="18px" width="70px" variant="rounded" />
              <Skeleton height="18px" width="80px" variant="rounded" />
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0" }}>
              <Skeleton height="52px" width="52px" variant="circle" />
            </div>
            <Skeleton height="18px" width="70%" variant="rect" />
            <Skeleton height="14px" width="100%" variant="rounded" />
            <Skeleton height="14px" width="80%" variant="rounded" />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Skeleton height="24px" width="70px" variant="rounded" />
              <Skeleton height="24px" width="80px" variant="rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Rewards Skeleton ────────────────────────────────────────── */
export function RewardsSkeleton() {
  return (
    <div className={styles.rewardsSkeleton} aria-label="Loading rewards store…" role="status">
      {/* Header */}
      <div className={styles.rewardsSkeletonHeader}>
        <div className={styles.rewardsSkeletonHeaderLeft}>
          <Skeleton height="32px" width="min(260px, 80%)" variant="rect" />
          <Skeleton height="18px" width="min(380px, 100%)" variant="rounded" />
        </div>
        <div className={styles.rewardsSkeletonBalances}>
          <div className={styles.rewardsSkeletonBalance}>
            <Skeleton height="32px" width="32px" variant="circle" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <Skeleton height="24px" width="60px" variant="rect" />
              <Skeleton height="12px" width="100px" variant="rounded" />
            </div>
          </div>
          <div className={styles.rewardsSkeletonBalance}>
            <Skeleton height="32px" width="32px" variant="circle" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <Skeleton height="24px" width="60px" variant="rect" />
              <Skeleton height="12px" width="100px" variant="rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.rewardsSkeletonTabs}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="38px" width="120px" variant="rect" />
        ))}
      </div>

      {/* Grid */}
      <div className={styles.rewardsSkeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.rewardsSkeletonCard}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton height="16px" width="80px" variant="rounded" />
              <Skeleton height="16px" width="80px" variant="rounded" />
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem 0" }}>
              <Skeleton height="48px" width="48px" variant="circle" />
            </div>
            <Skeleton height="18px" width="70%" variant="rect" />
            <Skeleton height="14px" width="100%" variant="rounded" />
            <Skeleton height="40px" width="100%" variant="rect" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Challenge Skeleton ──────────────────────────────────────── */
export function ChallengeSkeleton() {
  return (
    <div className={styles.challengeSkeleton} aria-label="Loading challenge…" role="status">
      {/* Header */}
      <div className={styles.challengeSkeletonHeader}>
        <div className={styles.challengeSkeletonHeaderLeft}>
          <Skeleton height="48px" width="48px" variant="rect" style={{ flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton height="28px" width="min(200px, 60vw)" variant="rect" />
            <Skeleton height="16px" width="min(300px, 70vw)" variant="rounded" />
          </div>
        </div>
        <Skeleton height="40px" width="130px" variant="rect" style={{ flexShrink: 0 }} />
      </div>

      {/* Duration selector */}
      <div className={styles.challengeSkeletonDuration}>
        <Skeleton height="20px" width="min(220px, 70%)" variant="rect" />
        <div className={styles.challengeSkeletonDurationPills}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="60px" width="90px" variant="rect" />
          ))}
        </div>
      </div>

      {/* Habits list */}
      <div className={styles.challengeSkeletonDuration}>
        <Skeleton height="22px" width="min(180px, 60%)" variant="rect" />
        <div className={styles.challengeSkeletonHabits}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.challengeSkeletonHabitRow}>
              <Skeleton height="20px" width="20px" variant="circle" />
              <Skeleton height="38px" width="100%" variant="rect" />
              <Skeleton height="38px" width="100%" variant="rect" />
              <Skeleton height="38px" width="100%" variant="rect" />
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <Skeleton height="48px" width="min(200px, 100%)" variant="rect" />
    </div>
  );
}

/* ─── Profile Skeleton ────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className={styles.profileSkeleton} aria-label="Loading profile…" role="status">
      {/* Left sidebar */}
      <div className={styles.profileSkeletonSidebar}>
        <div className={styles.profileSkeletonCard}>
          <Skeleton height="88px" width="88px" variant="circle" />
          <Skeleton height="24px" width="70%" variant="rect" />
          <Skeleton height="16px" width="50%" variant="rounded" />
          <Skeleton height="22px" width="80%" variant="rounded" />
          <Skeleton height="36px" width="100%" variant="rect" />
        </div>

        <div style={{ border: "2px solid var(--color-border)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton height="18px" width="60%" variant="rect" />
          <div className={styles.profileSkeletonStats}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.profileSkeletonStatRow}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Skeleton height="16px" width="16px" variant="circle" />
                  <Skeleton height="14px" width="100px" variant="rounded" />
                </div>
                <Skeleton height="16px" width="50px" variant="rect" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.profileSkeletonMain}>
        {/* Activity heatmap */}
        <div className={styles.profileSkeletonHeatmap}>
          <Skeleton height="20px" width="min(180px, 60%)" variant="rect" />
          <div className={styles.profileSkeletonHeatmapGrid}>
            {Array.from({ length: 52 * 7 }).map((_, i) => (
              <Skeleton key={i} height="100%" width="100%" variant="rounded" className={styles.profileSkeletonHeatmapCell} style={{ minHeight: "10px" }} />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.profileSkeletonTabs}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="38px" width="110px" variant="rect" />
          ))}
        </div>

        {/* Tab content */}
        <div className={styles.profileSkeletonTabContent}>
          <Skeleton height="22px" width="min(160px, 50%)" variant="rect" />
          <div className={styles.profileSkeletonActivityList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.profileSkeletonActivityItem}>
                <Skeleton height="32px" width="32px" variant="circle" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <Skeleton height="16px" width="70%" variant="rounded" />
                  <Skeleton height="12px" width="40%" variant="rounded" />
                </div>
                <Skeleton height="14px" width="60px" variant="rounded" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
