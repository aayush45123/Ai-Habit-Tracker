import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  Flame,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Target,
  RefreshCw,
  X,
  ChevronRight,
  Brain,
  Utensils,
  Activity,
  Calendar,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./CalorieAnalytics.module.css";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "foods", label: "Top Foods", icon: Utensils },
  { id: "ai", label: "AI Insights", icon: Brain },
];

export default function CalorieAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetails, setDateDetails] = useState(null);

  // AI insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Auto-load AI insights when the tab is selected
  useEffect(() => {
    if (activeTab === "ai" && !insightsLoaded) {
      loadInsights();
    }
  }, [activeTab]);

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

  async function loadInsights() {
    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const res = await api.get("/calories/ai/insights");
      setInsights(res.data);
      setInsightsLoaded(true);
    } catch (err) {
      console.error("Error loading AI insights:", err);
      setInsightsError("Could not load AI insights. Please try again.");
    } finally {
      setInsightsLoading(false);
    }
  }

  function refreshInsights() {
    setInsightsLoaded(false);
    loadInsights();
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
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading your analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalDays === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <BarChart3 size={48} className={styles.emptyIcon} />
          <h3>No data yet</h3>
          <p>Start logging food to see your analytics here.</p>
        </div>
      </div>
    );
  }

  const calorieGoalPct = analytics.avgCalories
    ? Math.round((analytics.avgCalories / analytics.calorieGoal) * 100)
    : 0;
  const proteinGoalPct = analytics.avgProtein
    ? Math.round((analytics.avgProtein / analytics.proteinGoal) * 100)
    : 0;

  const maxCalInChart = analytics.chartData?.length
    ? Math.max(...analytics.chartData.map((d) => d.calories), analytics.calorieGoal)
    : analytics.calorieGoal;

  const totalMacroCals =
    (analytics.macroBreakdown?.protein?.cals || 0) +
    (analytics.macroBreakdown?.carbs?.cals || 0) +
    (analytics.macroBreakdown?.fat?.cals || 0);

  const proteinPct = totalMacroCals ? Math.round((analytics.macroBreakdown?.protein?.cals / totalMacroCals) * 100) : 0;
  const carbsPct = totalMacroCals ? Math.round((analytics.macroBreakdown?.carbs?.cals / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals ? Math.round((analytics.macroBreakdown?.fat?.cals / totalMacroCals) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === "ai" && (
                <span className={styles.tabBadge}>AI</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB: OVERVIEW ─────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          {/* Stat cards */}
          <div className={styles.statGrid}>
            <StatCard icon={<Calendar size={20} />} label="Days Tracked" value={analytics.totalDays} color="blue" />
            <StatCard icon={<Flame size={20} />} label="Avg Calories" value={`${analytics.avgCalories} kcal`} color="orange" />
            <StatCard icon={<Dumbbell size={20} />} label="Avg Protein" value={`${analytics.avgProtein}g`} color="green" />
            <StatCard icon={<Target size={20} />} label="Goal Hit Rate" value={`${analytics.totalDays ? Math.round((analytics.daysOnGoal / analytics.totalDays) * 100) : 0}%`} color="purple" />
            <StatCard icon={<Zap size={20} />} label="Current Streak" value={`${analytics.currentStreak} days`} color="yellow" />
            <StatCard icon={<Award size={20} />} label="Best Streak" value={`${analytics.bestStreak} days`} color="teal" />
          </div>

          {/* 14-Day Calorie Chart */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>14-Day Calorie Chart</h4>
              <span className={styles.sectionMeta}>Goal: {analytics.calorieGoal} kcal</span>
            </div>
            <div className={styles.barChart}>
              {analytics.chartData?.map((day, i) => {
                const heightPct = Math.min((day.calories / maxCalInChart) * 100, 100);
                const isOver = day.isOverGoal;
                return (
                  <div
                    key={day.date}
                    className={styles.barChartCol}
                    onClick={() => loadDateDetails(day.date)}
                    title={`${day.dateFormatted}: ${day.calories} kcal`}
                  >
                    <div className={styles.barChartBarWrap}>
                      <div
                        className={`${styles.barChartBar} ${isOver ? styles.barChartBarOver : ""}`}
                        style={{ height: `${heightPct}%`, animationDelay: `${i * 40}ms` }}
                      />
                      <div
                        className={styles.goalLine}
                        style={{ bottom: `${(analytics.calorieGoal / maxCalInChart) * 100}%` }}
                      />
                    </div>
                    <span className={styles.barChartLabel}>{day.dayOfWeek}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}><span className={styles.legendDot} />On Goal</span>
              <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendDotOver}`} />Over Goal</span>
              <span className={styles.legendItem}><span className={styles.legendLine} />Goal Line</span>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Avg Macro Breakdown</h4>
            <div className={styles.macroGrid}>
              <MacroBar label="Protein" grams={analytics.macroBreakdown?.protein?.grams} pct={proteinPct} color="var(--color-green, #22c55e)" />
              <MacroBar label="Carbs" grams={analytics.macroBreakdown?.carbs?.grams} pct={carbsPct} color="var(--color-blue, #3b82f6)" />
              <MacroBar label="Fat" grams={analytics.macroBreakdown?.fat?.grams} pct={fatPct} color="var(--color-yellow, #f59e0b)" />
            </div>
          </div>

          {/* Best / Worst day */}
          {(analytics.bestDay || analytics.worstDay) && (
            <div className={styles.dayHighlights}>
              {analytics.bestDay && (
                <div className={`${styles.dayHighlightCard} ${styles.dayHighlightBest}`}>
                  <Star size={18} />
                  <div>
                    <span className={styles.dayHighlightLabel}>Best Day</span>
                    <span className={styles.dayHighlightValue}>{analytics.bestDay.date} — {analytics.bestDay.calories} kcal</span>
                  </div>
                </div>
              )}
              {analytics.worstDay && (
                <div className={`${styles.dayHighlightCard} ${styles.dayHighlightWorst}`}>
                  <AlertTriangle size={18} />
                  <div>
                    <span className={styles.dayHighlightLabel}>Biggest Overshoot</span>
                    <span className={styles.dayHighlightValue}>{analytics.worstDay.date} — +{analytics.worstDay.overBy} kcal over</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: TRENDS ─────────────────────────────────────────── */}
      {activeTab === "trends" && (
        <div className={styles.tabContent}>
          {/* Weekly bucket comparison */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Weekly Comparison</h4>
            <div className={styles.weeklyTable}>
              <div className={styles.weeklyTableHeader}>
                <span>Week</span>
                <span>Days Logged</span>
                <span>Avg Calories</span>
                <span>Avg Protein</span>
                <span>Days on Goal</span>
              </div>
              {analytics.weeklyBuckets?.map((week, i) => (
                <div key={i} className={styles.weeklyTableRow}>
                  <span className={styles.weekLabel}>{week.label}</span>
                  <span>{week.days}</span>
                  <span className={week.avgCalories > analytics.calorieGoal ? styles.textRed : styles.textGreen}>
                    {week.avgCalories} kcal
                  </span>
                  <span className={week.avgProtein >= analytics.proteinGoal ? styles.textGreen : styles.textMuted}>
                    {week.avgProtein}g
                  </span>
                  <span>
                    <span className={styles.goalBadge}>{week.daysOnGoal}/{week.days}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal heatmap — 30 days */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>30-Day Goal Heatmap</h4>
            <p className={styles.sectionSubtitle}>Click any day to see what you ate</p>
            <div className={styles.heatmap}>
              {analytics.dailyHistory
                ?.slice()
                .reverse()
                .map((day) => (
                  <div
                    key={day.date}
                    className={`${styles.heatmapCell} ${
                      day.isOverGoal ? styles.heatmapOver : styles.heatmapGood
                    }`}
                    title={`${day.dateFormatted}: ${day.calories} kcal`}
                    onClick={() => loadDateDetails(day.date)}
                  >
                    <span className={styles.heatmapDay}>{day.dayOfWeek}</span>
                  </div>
                ))}
            </div>
            <div className={styles.heatmapLegend}>
              <span><span className={`${styles.heatmapSwatch} ${styles.heatmapSwatchGood}`} /> Under Goal</span>
              <span><span className={`${styles.heatmapSwatch} ${styles.heatmapSwatchOver}`} /> Over Goal</span>
            </div>
          </div>

          {/* Protein consistency */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Protein Consistency</h4>
            <div className={styles.consistencyCard}>
              <div className={styles.consistencyRing}>
                <svg viewBox="0 0 80 80" className={styles.ringSvg}>
                  <circle cx="40" cy="40" r="34" className={styles.ringBg} />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={styles.ringFill}
                    style={{
                      strokeDasharray: `${2 * Math.PI * 34}`,
                      strokeDashoffset: `${2 * Math.PI * 34 * (1 - (analytics.daysHitProtein / analytics.totalDays))}`,
                    }}
                  />
                </svg>
                <span className={styles.ringText}>
                  {analytics.totalDays ? Math.round((analytics.daysHitProtein / analytics.totalDays) * 100) : 0}%
                </span>
              </div>
              <div className={styles.consistencyInfo}>
                <p className={styles.consistencyMain}>
                  Hit protein goal on <strong>{analytics.daysHitProtein}</strong> of <strong>{analytics.totalDays}</strong> days
                </p>
                <p className={styles.consistencySub}>
                  Goal: {analytics.proteinGoal}g/day · Avg: {analytics.avgProtein}g/day
                </p>
                {analytics.daysHitProtein / analytics.totalDays >= 0.7 ? (
                  <div className={styles.consistencyStatus + " " + styles.consistencyGood}>
                    <CheckCircle2 size={14} /> Great consistency!
                  </div>
                ) : (
                  <div className={styles.consistencyStatus + " " + styles.consistencyWarn}>
                    <AlertTriangle size={14} /> Needs improvement
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: TOP FOODS ─────────────────────────────────────────── */}
      {activeTab === "foods" && (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>Your Most Logged Foods</h4>
              <span className={styles.sectionMeta}>Last 30 days</span>
            </div>

            {!analytics.topFoods?.length ? (
              <div className={styles.emptySection}>No food logs yet in this period.</div>
            ) : (
              <div className={styles.foodList}>
                {analytics.topFoods.map((food, i) => {
                  const maxCount = analytics.topFoods[0].count;
                  const barWidth = Math.round((food.count / maxCount) * 100);
                  return (
                    <div key={i} className={styles.foodItem}>
                      <div className={styles.foodRank}>#{i + 1}</div>
                      <div className={styles.foodDetails}>
                        <div className={styles.foodNameRow}>
                          <span className={styles.foodName}>{food.name}</span>
                          <div className={styles.foodBadges}>
                            <span className={styles.badge}>{food.count}×</span>
                            <span className={`${styles.badge} ${styles.badgeOrange}`}>{food.avgCalories} kcal</span>
                            <span className={`${styles.badge} ${styles.badgeGreen}`}>{food.avgProtein}g P</span>
                          </div>
                        </div>
                        <div className={styles.foodBar}>
                          <div
                            className={styles.foodBarFill}
                            style={{ width: `${barWidth}%`, animationDelay: `${i * 80}ms` }}
                          />
                        </div>
                        <div className={styles.foodMeta}>
                          <span>Total contribution: {food.totalCalories} kcal across {food.count} entries</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily history list */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Daily History (Last 30 Days)</h4>
            <div className={styles.historyList}>
              {analytics.dailyHistory?.map((day) => (
                <div
                  key={day.date}
                  className={`${styles.historyItem} ${day.isOverGoal ? styles.historyItemOver : ""}`}
                  onClick={() => loadDateDetails(day.date)}
                >
                  <div className={styles.historyLeft}>
                    <span className={styles.historyDate}>{day.dateFormatted}</span>
                    <span className={styles.historyDay}>{day.dayOfWeek}</span>
                  </div>
                  <div className={styles.historyMid}>
                    <div className={styles.historyBarRow}>
                      <span className={styles.historyBarLabel}>Cal</span>
                      <div className={styles.historyBarTrack}>
                        <div
                          className={`${styles.historyBarFill} ${day.isOverGoal ? styles.historyBarOver : ""}`}
                          style={{ width: `${Math.min(day.caloriesPercent, 100)}%` }}
                        />
                      </div>
                      <span className={styles.historyBarVal}>{day.calories}</span>
                    </div>
                    <div className={styles.historyBarRow}>
                      <span className={styles.historyBarLabel}>Pro</span>
                      <div className={styles.historyBarTrack}>
                        <div
                          className={`${styles.historyBarFill} ${styles.historyBarProtein}`}
                          style={{ width: `${Math.min(day.proteinPercent, 100)}%` }}
                        />
                      </div>
                      <span className={styles.historyBarVal}>{day.protein}g</span>
                    </div>
                  </div>
                  <div className={styles.historyRight}>
                    {day.isOverGoal ? (
                      <span className={styles.overTag}>+{day.overBy}</span>
                    ) : (
                      <CheckCircle2 size={16} className={styles.checkIcon} />
                    )}
                    <ChevronRight size={14} className={styles.chevron} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: AI INSIGHTS ─────────────────────────────────────────── */}
      {activeTab === "ai" && (
        <div className={styles.tabContent}>
          <div className={styles.aiHeader}>
            <div className={styles.aiHeaderLeft}>
              <Brain size={28} className={styles.aiBrainIcon} />
              <div>
                <h3 className={styles.aiTitle}>AI Nutrition Analysis</h3>
                <p className={styles.aiSubtitle}>Powered by Groq — analyzing your last 14 days of eating</p>
              </div>
            </div>
            <button
              className={styles.refreshBtn}
              onClick={refreshInsights}
              disabled={insightsLoading}
              title="Regenerate insights"
            >
              <RefreshCw size={16} className={insightsLoading ? styles.spinning : ""} />
              Refresh
            </button>
          </div>

          {insightsLoading && (
            <div className={styles.aiLoadingState}>
              <div className={styles.aiLoadingDots}>
                <span /><span /><span />
              </div>
              <p>Groq AI is analyzing your eating patterns…</p>
            </div>
          )}

          {insightsError && !insightsLoading && (
            <div className={styles.aiError}>
              <AlertTriangle size={20} />
              <span>{insightsError}</span>
              <button className={styles.retryBtn} onClick={loadInsights}>Try Again</button>
            </div>
          )}

          {insights && !insightsLoading && (
            <>
              {insights.message && !insights.insights ? (
                <div className={styles.aiEmpty}>
                  <Activity size={40} />
                  <p>{insights.message}</p>
                </div>
              ) : insights.insights ? (
                <div className={styles.insightsGrid}>
                  {/* Summary */}
                  <div className={styles.insightCard + " " + styles.insightCardFull + " " + styles.insightCardGlow}>
                    <div className={styles.insightCardIcon}><Star size={18} /></div>
                    <h5 className={styles.insightCardTitle}>Summary</h5>
                    <p className={styles.insightText}>{insights.insights.summary}</p>
                  </div>

                  {/* Top Tip */}
                  <div className={styles.insightCard + " " + styles.insightCardFull + " " + styles.insightCardTip}>
                    <div className={styles.insightCardIcon}><Zap size={18} /></div>
                    <h5 className={styles.insightCardTitle}>💡 Top Tip</h5>
                    <p className={styles.insightText}>{insights.insights.topTip}</p>
                  </div>

                  {/* Calorie Insight */}
                  <div className={styles.insightCard}>
                    <div className={styles.insightCardIcon}><Flame size={18} /></div>
                    <h5 className={styles.insightCardTitle}>Calorie Pattern</h5>
                    <p className={styles.insightText}>{insights.insights.calorieInsight}</p>
                  </div>

                  {/* Protein Insight */}
                  <div className={styles.insightCard}>
                    <div className={styles.insightCardIcon}><Dumbbell size={18} /></div>
                    <h5 className={styles.insightCardTitle}>Protein Intake</h5>
                    <p className={styles.insightText}>{insights.insights.proteinInsight}</p>
                  </div>

                  {/* Wins */}
                  {insights.insights.wins?.length > 0 && (
                    <div className={styles.insightCard + " " + styles.insightCardWins}>
                      <div className={styles.insightCardIcon}><CheckCircle2 size={18} /></div>
                      <h5 className={styles.insightCardTitle}>What You're Doing Well ✅</h5>
                      <ul className={styles.insightList}>
                        {insights.insights.wins.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {insights.insights.improvements?.length > 0 && (
                    <div className={styles.insightCard + " " + styles.insightCardImprove}>
                      <div className={styles.insightCardIcon}><TrendingUp size={18} /></div>
                      <h5 className={styles.insightCardTitle}>Areas to Improve 🚀</h5>
                      <ul className={styles.insightList}>
                        {insights.insights.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Patterns */}
                  {insights.insights.patterns?.length > 0 && (
                    <div className={styles.insightCard + " " + styles.insightCardFull}>
                      <div className={styles.insightCardIcon}><Activity size={18} /></div>
                      <h5 className={styles.insightCardTitle}>Detected Patterns</h5>
                      <div className={styles.patternChips}>
                        {insights.insights.patterns.map((p, i) => (
                          <span key={i} className={styles.patternChip}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* ─── Date Detail Modal ──────────────────────────────────────── */}
      {dateDetails && (
        <div className={styles.modal} onClick={() => setDateDetails(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>{dateDetails.dateFormatted}</h4>
              <button className={styles.modalClose} onClick={() => setDateDetails(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Total Calories</span>
                <span className={styles.modalStatValue}>{dateDetails.totalCalories} kcal</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Total Protein</span>
                <span className={styles.modalStatValue}>{dateDetails.totalProtein}g</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Meals Logged</span>
                <span className={styles.modalStatValue}>{dateDetails.items.length}</span>
              </div>
            </div>
            <div className={styles.modalList}>
              <h5 className={styles.modalListTitle}>Meals</h5>
              {dateDetails.items.map((item, idx) => (
                <div key={idx} className={styles.modalItem}>
                  <span className={styles.modalItemName}>{item.foodName}</span>
                  <div className={styles.modalItemDetails}>
                    <span className={styles.modalItemCal}>{item.calories} kcal</span>
                    <span className={styles.modalItemPro}>{item.protein}g protein</span>
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

/* ─── Helper sub-components ─────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${styles.statCard} ${styles[`statCard_${color}`]}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
      </div>
    </div>
  );
}

function MacroBar({ label, grams, pct, color }) {
  return (
    <div className={styles.macroBar}>
      <div className={styles.macroBarHeader}>
        <span className={styles.macroLabel}>{label}</span>
        <span className={styles.macroValue}>{grams}g <span className={styles.macroPct}>({pct}%)</span></span>
      </div>
      <div className={styles.macroTrack}>
        <div
          className={styles.macroFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
