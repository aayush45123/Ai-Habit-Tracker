import React, { useEffect, useState } from "react";
import { Flame, Dumbbell, Droplets, Lightbulb, Scale, Info } from "lucide-react";
import api from "../../utils/api";
import styles from "./NutritionRecommendation.module.css";

export default function NutritionRecommendation({ profile }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadRecommendations();
    }
  }, [profile]);

  async function loadRecommendations() {
    try {
      setLoading(true);
      const res = await api.get("/calories/recommendations");
      setRecommendations(res.data);
    } catch (err) {
      console.error("Error loading recommendations:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Calculating recommendations...</div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  const wbt = recommendations.weightBasedTargets;

  // Build row definitions for the weight-based targets table (no emojis, explicit why explanations)
  const calculationRows = wbt
    ? [
        {
          num: "01",
          label: wbt.steps?.label || "Daily Steps",
          basis: wbt.steps?.basis || `${wbt.bodyWeight} kg × 100`,
          target: `${(wbt.steps?.value || 0).toLocaleString()} ${wbt.steps?.unit || "steps/day"}`,
          why:
            wbt.steps?.explanation ||
            "Proportionate baseline activity that increases non-exercise thermogenesis (NEAT) without overtaxing joints.",
        },
        {
          num: "02",
          label: wbt.calorieRange?.label || "Daily Calorie Target",
          basis: wbt.calorieRange?.basis || `${wbt.bodyWeight} kg × 22–24 kcal`,
          target: `${(wbt.calorieRange?.low || 0).toLocaleString()}–${(wbt.calorieRange?.high || 0).toLocaleString()} ${wbt.calorieRange?.unit || "kcal/day"}`,
          why:
            wbt.calorieRange?.explanation ||
            "Calibrated energy baseline to trigger steady fat reduction while protecting metabolic health and hormonal function.",
        },
        {
          num: "03",
          label: wbt.proteinRange?.label || "Daily Protein Intake",
          basis: wbt.proteinRange?.basis || `${wbt.bodyWeight} kg × 1.6–2.0 g`,
          target: `${wbt.proteinRange?.low || 0}–${wbt.proteinRange?.high || 0} ${wbt.proteinRange?.unit || "g/day"}`,
          why:
            wbt.proteinRange?.explanation ||
            "Supplies essential amino acids to preserve lean muscle tissue during caloric expenditure and support recovery.",
        },
        {
          num: "04",
          label: wbt.water?.label || "Daily Hydration",
          basis: wbt.water?.basis || `${wbt.bodyWeight} kg × 40 ml`,
          target: `${wbt.water?.liters || 0} ${wbt.water?.unit || "L/day"} (${(wbt.water?.ml || 0).toLocaleString()} ml)`,
          why:
            wbt.water?.explanation ||
            "Ensures cellular fluid balance, waste clearance, and metabolic turnover scaled directly to total body mass.",
        },
        {
          num: "05",
          label: wbt.weeklyWeightLoss?.label || "Weekly Fat-Loss Pace",
          basis: wbt.weeklyWeightLoss?.basis || `${wbt.bodyWeight} kg × 0.5%–1.0%`,
          target: `${wbt.weeklyWeightLoss?.low || 0}–${wbt.weeklyWeightLoss?.high || 0} ${wbt.weeklyWeightLoss?.unit || "kg/week"}`,
          why:
            wbt.weeklyWeightLoss?.explanation ||
            "Clinical gold standard pace to maximize fat tissue loss while preventing muscle catabolism and metabolic adaptation.",
        },
      ]
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>AI Daily Target Recommendations</h3>
        <span className={styles.badge}>{recommendations.goalLabel}</span>
      </div>

      {/* ── Standard BMR/TDEE cards ── */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Flame size={22} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Daily Calories</span>
            <span className={styles.cardValue}>
              {recommendations.calories} kcal
            </span>
            <span className={styles.cardSubtext}>
              {recommendations.bmr} BMR + Activity
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Dumbbell size={22} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Daily Protein</span>
            <span className={styles.cardValue}>{recommendations.protein}g</span>
            <span className={styles.cardSubtext}>
              {recommendations.proteinPerKg}g per kg body weight
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Droplets size={22} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Water Intake</span>
            <span className={styles.cardValue}>{recommendations.water}L</span>
            <span className={styles.cardSubtext}>Stay hydrated</span>
          </div>
        </div>
      </div>

      {/* ── Weight-Based Calculation Targets Table ── */}
      {wbt && (
        <div className={styles.calcSection}>
          <div className={styles.calcSectionHeader}>
            <div className={styles.calcSectionIcon}>
              <Scale size={20} />
            </div>
            <div>
              <h4 className={styles.calcSectionTitle}>
                Weight-Proportional Calculation Breakdown
              </h4>
              <p className={styles.calcSectionSub}>
                Calibrated specifically for your <strong>{wbt.bodyWeight} kg</strong> body weight
              </p>
            </div>
          </div>

          <div className={styles.calcTable}>
            {/* Table Header */}
            <div className={styles.calcTableHead}>
              <span className={styles.thIndex}>#</span>
              <span className={styles.thMetric}>Metric</span>
              <span className={styles.thBasis}>Calculation Basis</span>
              <span className={styles.thTarget}>Target</span>
            </div>

            {/* Table Rows */}
            {calculationRows.map((row) => (
              <div key={row.num} className={styles.calcRow}>
                <div className={styles.calcRowMain}>
                  <span className={styles.rowIndex}>{row.num}</span>
                  <div className={styles.rowMetric}>
                    <span className={styles.metricName}>{row.label}</span>
                  </div>
                  <div className={styles.rowBasis}>
                    <code className={styles.basisCode}>{row.basis}</code>
                  </div>
                  <div className={styles.rowTarget}>
                    <span className={styles.targetBadge}>{row.target}</span>
                  </div>
                </div>

                {/* Explanation Sub-row */}
                <div className={styles.calcRowWhy}>
                  <div className={styles.whyLabel}>
                    <Info size={13} className={styles.whyIcon} />
                    <span>Why this calculation:</span>
                  </div>
                  <p className={styles.whyText}>{row.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Macronutrient Breakdown ── */}
      <div className={styles.breakdown}>
        <h4 className={styles.breakdownTitle}>Macronutrient Breakdown</h4>
        <div className={styles.macros}>
          <div className={styles.macroItem}>
            <span className={styles.macroLabel}>Protein</span>
            <div className={styles.macroBar}>
              <div
                className={styles.macroFill}
                style={{ width: "30%", backgroundColor: "var(--color-accent-primary)" }}
              ></div>
            </div>
            <span className={styles.macroValue}>
              {recommendations.protein}g (30%)
            </span>
          </div>
          <div className={styles.macroItem}>
            <span className={styles.macroLabel}>Carbs</span>
            <div className={styles.macroBar}>
              <div
                className={styles.macroFill}
                style={{ width: "45%", backgroundColor: "var(--color-accent-secondary)" }}
              ></div>
            </div>
            <span className={styles.macroValue}>
              {recommendations.carbs}g (45%)
            </span>
          </div>
          <div className={styles.macroItem}>
            <span className={styles.macroLabel}>Fats</span>
            <div className={styles.macroBar}>
              <div
                className={styles.macroFill}
                style={{ width: "25%", backgroundColor: "var(--color-text-secondary)" }}
              ></div>
            </div>
            <span className={styles.macroValue}>
              {recommendations.fats}g (25%)
            </span>
          </div>
        </div>
      </div>

      {recommendations.tips && (
        <div className={styles.tips}>
          <h4 className={styles.tipsTitle}>
            <Lightbulb
              size={18}
              style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }}
            />
            Recommendations For Your Goal
          </h4>
          <ul className={styles.tipsList}>
            {recommendations.tips.map((tip, idx) => (
              <li key={idx} className={styles.tipItem}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
