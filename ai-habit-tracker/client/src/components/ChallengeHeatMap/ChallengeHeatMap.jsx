import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./ChallengeHeatMap.module.css";

/* Importing React Icons */
import {
  FaFire,
  FaBullseye,
  FaBolt,
  FaTrophy,
  FaChartLine,
  FaStar,
  FaCheck,
} from "react-icons/fa";
import { FaDumbbell } from "react-icons/fa6";
import { GiPlantSeed, GiCrystalBall } from "react-icons/gi";

export default function ChallengeHeatmap() {
  const [heatmap, setHeatmap] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedView, setSelectedView] = useState("grid");

  useEffect(() => {
    fetchHeatmap();
  }, []);

  async function fetchHeatmap() {
    try {
      const res = await api.get("/challenge/heatmap");
      setHeatmap(res.data.heatmap || []);
      setStats(res.data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading your journey...</p>
      </div>
    );
  }

  if (!stats || heatmap.length === 0) {
    return (
      <div className={styles.noData}>
        <div className={styles.noDataIcon}>
          <FaChartLine size={40} />
        </div>
        <h4 className={styles.noDataTitle}>No Challenge Data Yet</h4>
        <p className={styles.noDataText}>
          Start your 21-day challenge to see your progress heatmap and track
          your consistency journey!
        </p>
      </div>
    );
  }

  const weeks = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  function getLevelClass(level) {
    if (level === -1) return styles.future;
    if (level === 0) return styles.level0;
    if (level === 1) return styles.level1;
    if (level === 2) return styles.level2;
    if (level === 3) return styles.level3;
    if (level === 4) return styles.level4;
    return styles.level0;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      weekday: "short",
    });
  }

  function getDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  }

  function getMotivationalMessage() {
    const completion = stats.overallCompletion;
    if (completion >= 90)
      return {
        icon: <FaFire />,
        text: "Absolutely crushing it!",
        color: "#2e7d4e",
      };
    if (completion >= 75)
      return {
        icon: <FaDumbbell />,
        text: "You're on fire!",
        color: "#49a969",
      };
    if (completion >= 50)
      return { icon: <FaBolt />, text: "Great momentum!", color: "#7bc96f" };
    if (completion >= 25)
      return { icon: <GiPlantSeed />, text: "Keep growing!", color: "#c6e48b" };

    return {
      icon: <FaBullseye />,
      text: "Every step counts!",
      color: "#7bb77e",
    };
  }

  const motivation = getMotivationalMessage();

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            <FaFire className={styles.titleIcon} />
            21-Day Challenge Heatmap
          </h3>
          <p className={styles.subtitle}>
            Your journey to building unstoppable habits
          </p>
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${
              selectedView === "grid" ? styles.active : ""
            }`}
            onClick={() => setSelectedView("grid")}
          >
            <FaChartLine /> Grid
          </button>
          <button
            className={`${styles.toggleBtn} ${
              selectedView === "list" ? styles.active : ""
            }`}
            onClick={() => setSelectedView("list")}
          >
            <FaChartLine /> List
          </button>
        </div>
      </div>

      {/* MOTIVATION BANNER */}
      <div
        className={styles.motivationBanner}
        style={{ borderLeftColor: motivation.color }}
      >
        <span className={styles.motivationEmoji}>{motivation.icon}</span>
        <div className={styles.motivationContent}>
          <div className={styles.motivationText}>{motivation.text}</div>
          <div className={styles.motivationSubtext}>
            {stats.totalCompleted} habits completed so far
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaBullseye />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.completedDays}</div>
            <div className={styles.statLabel}>Perfect Days</div>
            <div className={styles.statProgress}>
              <div
                className={styles.statProgressBar}
                style={{ width: `${(stats.completedDays / 21) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaBolt />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.currentStreak}</div>
            <div className={styles.statLabel}>Current Streak</div>
            <div className={styles.statBadge}>
              {stats.currentStreak >= 7
                ? "🔥 On Fire!"
                : stats.currentStreak >= 3
                ? "💪 Strong"
                : "🌱 Growing"}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaTrophy />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.longestStreak}</div>
            <div className={styles.statLabel}>Longest Streak</div>
            <div className={styles.statBadge}>
              {stats.longestStreak === stats.currentStreak
                ? "🎯 Current Best"
                : "📈 Beat It!"}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaChartLine />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.overallCompletion}%</div>
            <div className={styles.statLabel}>Overall Completion</div>
            <div className={styles.statProgress}>
              <div
                className={styles.statProgressBar}
                style={{ width: `${stats.overallCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID VIEW */}
      {selectedView === "grid" && (
        <div className={styles.heatmapContainer}>
          <div className={styles.heatmapHeader}>
            <span className={styles.heatmapLabel}>Week</span>
            <div className={styles.dayLabels}>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          <div className={styles.heatmapGrid}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={styles.weekRow}>
                <span className={styles.weekLabel}>W{weekIndex + 1}</span>
                <div className={styles.daysRow}>
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`${styles.dayCell} ${getLevelClass(
                        day.level
                      )}`}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {day.level === 4 && (
                        <FaCheck className={styles.perfectDayBadge} />
                      )}

                      {hoveredDay === day && (
                        <div className={styles.tooltip}>
                          <div className={styles.tooltipHeader}>
                            <div className={styles.tooltipDate}>
                              {formatDate(day.date)}
                            </div>
                            {day.level === 4 && (
                              <span className={styles.tooltipPerfect}>
                                Perfect!
                              </span>
                            )}
                          </div>

                          {day.level === -1 ? (
                            <div className={styles.tooltipContent}>
                              <span className={styles.tooltipFuture}>
                                <GiCrystalBall /> Future day
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className={styles.tooltipContent}>
                                <div className={styles.tooltipHabits}>
                                  <strong>{day.count}</strong> of{" "}
                                  <strong>{day.total}</strong> habits
                                </div>
                                <div className={styles.tooltipPercentage}>
                                  <div className={styles.tooltipBar}>
                                    <div
                                      className={styles.tooltipBarFill}
                                      style={{ width: `${day.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span>{day.percentage}%</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* LEGEND */}
          <div className={styles.legend}>
            <span className={styles.legendLabel}>Less</span>
            <div className={`${styles.legendCell} ${styles.level0}`}></div>
            <div className={`${styles.legendCell} ${styles.level1}`}></div>
            <div className={`${styles.legendCell} ${styles.level2}`}></div>
            <div className={`${styles.legendCell} ${styles.level3}`}></div>
            <div className={`${styles.legendCell} ${styles.level4}`}></div>
            <span className={styles.legendLabel}>More</span>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {selectedView === "list" && (
        <div className={styles.listContainer}>
          {heatmap.map((day, index) => (
            <div
              key={index}
              className={`${styles.listItem} ${
                day.level === -1 ? styles.listItemFuture : ""
              }`}
            >
              <div className={styles.listDay}>
                <div className={styles.listDayNumber}>Day {index + 1}</div>
                <div className={styles.listDayDate}>{formatDate(day.date)}</div>
                <div className={styles.listDayWeek}>
                  {getDayOfWeek(day.date)}
                </div>
              </div>

              <div className={styles.listProgress}>
                <div className={styles.listProgressBar}>
                  <div
                    className={`${styles.listProgressFill} ${getLevelClass(
                      day.level
                    )}`}
                    style={{
                      width: `${day.level === -1 ? 0 : day.percentage}%`,
                    }}
                  ></div>
                </div>
                <div className={styles.listProgressText}>
                  {day.level === -1 ? (
                    <span className={styles.listFutureText}>
                      <GiCrystalBall /> Coming Soon
                    </span>
                  ) : (
                    <>
                      <span className={styles.listHabits}>
                        {day.count}/{day.total} habits
                      </span>
                      <span className={styles.listPercentage}>
                        {day.percentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {day.level === 4 && (
                <div className={styles.listBadge}>
                  <FaTrophy className={styles.listBadgeIcon} />
                  Perfect
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* COMPLETION INFO */}
      <div className={styles.completionCard}>
        <div className={styles.completionHeader}>
          <h4 className={styles.completionTitle}>Overall Progress</h4>
          <div className={styles.completionPercentage}>
            {stats.overallCompletion}%
          </div>
        </div>

        <div className={styles.completionBar}>
          <div
            className={styles.completionFill}
            style={{ width: `${stats.overallCompletion}%` }}
          >
            <FaStar className={styles.completionSparkle} />
          </div>
        </div>

        <div className={styles.completionDetails}>
          <div className={styles.completionStat}>
            <span className={styles.completionStatLabel}>Completed</span>
            <span className={styles.completionStatValue}>
              {stats.totalCompleted}
            </span>
          </div>
          <div className={styles.completionDivider}>/</div>
          <div className={styles.completionStat}>
            <span className={styles.completionStatLabel}>Total</span>
            <span className={styles.completionStatValue}>
              {stats.totalPossibleHabits}
            </span>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      {(stats.completedDays >= 7 ||
        stats.longestStreak >= 5 ||
        stats.overallCompletion >= 80) && (
        <div className={styles.achievementsSection}>
          <h4 className={styles.achievementsTitle}>Achievements Unlocked</h4>
          <div className={styles.achievementsList}>
            {stats.completedDays >= 7 && (
              <div className={styles.achievement}>
                <FaBullseye className={styles.achievementIcon} />
                <span className={styles.achievementText}>Week Warrior</span>
              </div>
            )}

            {stats.longestStreak >= 5 && (
              <div className={styles.achievement}>
                <FaFire className={styles.achievementIcon} />
                <span className={styles.achievementText}>Streak Master</span>
              </div>
            )}

            {stats.overallCompletion >= 80 && (
              <div className={styles.achievement}>
                <FaStar className={styles.achievementIcon} />
                <span className={styles.achievementText}>Excellence</span>
              </div>
            )}

            {stats.completedDays === 21 && (
              <div className={styles.achievement}>
                <FaTrophy className={styles.achievementIcon} />
                <span className={styles.achievementText}>Champion</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
