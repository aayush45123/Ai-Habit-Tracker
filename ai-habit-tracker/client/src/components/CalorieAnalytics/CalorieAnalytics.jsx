import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Flame,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./CalorieAnalytics.module.css";

export default function CalorieAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateDetails, setDateDetails] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await api.get("/calories/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDateDetails(date) {
    try {
      const res = await api.get(`/calories/analytics/date/${date}`);
      setDateDetails(res.data);
      setSelectedDate(date);
    } catch (err) {
      console.error("Error loading date details:", err);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No data available yet</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Nutrition Analytics</h3>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Days Tracked</span>
            <span className={styles.summaryValue}>{analytics.totalDays}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Flame size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Avg Daily Calories</span>
            <span className={styles.summaryValue}>
              {analytics.avgCalories} kcal
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Dumbbell size={24} />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Avg Daily Protein</span>
            <span className={styles.summaryValue}>{analytics.avgProtein}g</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            {analytics.daysOverGoal > analytics.totalDays / 2 ? (
              <AlertTriangle size={24} />
            ) : (
              <CheckCircle2 size={24} />
            )}
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Days Over Goal</span>
            <span className={styles.summaryValue}>
              {analytics.daysOverGoal}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.historySection}>
        <h4 className={styles.sectionTitle}>Daily History (Last 30 Days)</h4>
        <div className={styles.historyList}>
          {analytics.dailyHistory.map((day) => (
            <div
              key={day.date}
              className={styles.historyItem}
              onClick={() => loadDateDetails(day.date)}
            >
              <div className={styles.historyDate}>
                <span className={styles.dateText}>{day.dateFormatted}</span>
                <span className={styles.dayOfWeek}>{day.dayOfWeek}</span>
              </div>

              <div className={styles.historyBars}>
                <div className={styles.barGroup}>
                  <span className={styles.barLabel}>Calories</span>
                  <div className={styles.barContainer}>
                    <div
                      className={`${styles.bar} ${
                        day.caloriesPercent > 100 ? styles.barOver : ""
                      }`}
                      style={{
                        width: `${Math.min(day.caloriesPercent, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className={styles.barValue}>
                    {day.calories} / {day.calorieGoal}
                  </span>
                </div>

                <div className={styles.barGroup}>
                  <span className={styles.barLabel}>Protein</span>
                  <div className={styles.barContainer}>
                    <div
                      className={styles.bar}
                      style={{
                        width: `${Math.min(day.proteinPercent, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className={styles.barValue}>
                    {day.protein}g / {day.proteinGoal}g
                  </span>
                </div>
              </div>

              {day.isOverGoal && (
                <div className={styles.overBadge}>
                  Over by {day.overBy} kcal
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {dateDetails && (
        <div className={styles.modal} onClick={() => setDateDetails(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>{dateDetails.dateFormatted}</h4>
              <button
                className={styles.modalClose}
                onClick={() => setDateDetails(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Total Calories</span>
                <span className={styles.modalStatValue}>
                  {dateDetails.totalCalories} kcal
                </span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Total Protein</span>
                <span className={styles.modalStatValue}>
                  {dateDetails.totalProtein}g
                </span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Meals Logged</span>
                <span className={styles.modalStatValue}>
                  {dateDetails.items.length}
                </span>
              </div>
            </div>

            <div className={styles.modalList}>
              <h5 className={styles.modalListTitle}>Meals</h5>
              {dateDetails.items.map((item, idx) => (
                <div key={idx} className={styles.modalItem}>
                  <span className={styles.modalItemName}>{item.foodName}</span>
                  <div className={styles.modalItemDetails}>
                    <span>{item.calories} kcal</span>
                    <span>{item.protein}g protein</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
