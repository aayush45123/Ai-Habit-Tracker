import React, { useEffect, useState } from "react";
import { Flame, Dumbbell, Droplets, Lightbulb } from "lucide-react";
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

  // Build row definitions for the formula table
  const formulaRows = wbt
    ? [
        {
          icon: wbt.steps.icon,
          label: wbt.steps.label,
          formula: wbt.steps.formula,
          target: `${wbt.steps.value.toLocaleString()} ${wbt.steps.unit}`,
          colorClass: styles.rowSteps,
        },
        {
          icon: wbt.calorieRange.icon,
          label: wbt.calorieRange.label,
          formula: wbt.calorieRange.formula,
          target: `${wbt.calorieRange.low.toLocaleString()}–${wbt.calorieRange.high.toLocaleString()} ${wbt.calorieRange.unit}`,
          colorClass: styles.rowCalories,
        },
        {
          icon: wbt.proteinRange.icon,
          label: wbt.proteinRange.label,
          formula: wbt.proteinRange.formula,
          target: `${wbt.proteinRange.low}–${wbt.proteinRange.high} ${wbt.proteinRange.unit}`,
          colorClass: styles.rowProtein,
        },
        {
          icon: wbt.water.icon,
          label: wbt.water.label,
          formula: wbt.water.formula,
          target: `${wbt.water.ml.toLocaleString()} ml = ${wbt.water.liters} ${wbt.water.unit}`,
          colorClass: styles.rowWater,
        },
        {
          icon: wbt.weeklyWeightLoss.icon,
          label: wbt.weeklyWeightLoss.label,
          formula: wbt.weeklyWeightLoss.formula,
          target: `${wbt.weeklyWeightLoss.low}–${wbt.weeklyWeightLoss.high} ${wbt.weeklyWeightLoss.unit}`,
          colorClass: styles.rowWeightLoss,
        },
      ]
    : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>AI Recommends Your Daily Targets</h3>
        <span className={styles.badge}>{recommendations.goalLabel}</span>
      </div>

      {/* ── Standard BMR/TDEE cards ── */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <Flame size={24} />
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
            <Dumbbell size={24} />
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
            <Droplets size={24} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Water Intake</span>
            <span className={styles.cardValue}>{recommendations.water}L</span>
            <span className={styles.cardSubtext}>Stay hydrated</span>
          </div>
        </div>
      </div>

      {/* ── Weight-Based Formula Targets Table ── */}
      {wbt && (
        <div className={styles.formulaSection}>
          <div className={styles.formulaSectionHeader}>
            <span className={styles.formulaSectionIcon}>⚡</span>
            <div>
              <h4 className={styles.formulaSectionTitle}>
                Weight-Based Formula Targets
              </h4>
              <p className={styles.formulaSectionSub}>
                For your <strong>{wbt.bodyWeight} kg</strong> body weight
              </p>
            </div>
          </div>

          <div className={styles.formulaTable}>
            {/* Table header */}
            <div className={styles.formulaTableHead}>
              <span className={styles.thNum}>#</span>
              <span className={styles.thLabel}>Target</span>
              <span className={styles.thFormula}>Formula</span>
              <span className={styles.thTarget}>Your target</span>
            </div>

            {/* Table rows */}
            {formulaRows.map((row, i) => (
              <div
                key={i}
                className={`${styles.formulaRow} ${row.colorClass}`}
              >
                <span className={styles.rowNum}>
                  {row.icon} {i + 1}.
                </span>
                <span className={styles.rowLabel}>{row.label}</span>
                <span className={styles.rowFormula}>{row.formula}</span>
                <span className={styles.rowTarget}>{row.target}</span>
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
                style={{ width: "30%", backgroundColor: "#000" }}
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
                style={{ width: "45%", backgroundColor: "#2b2b2b" }}
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
                style={{ width: "25%", backgroundColor: "#555" }}
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
              size={20}
              style={{ display: "inline", marginRight: "8px" }}
            />
            Tips for Your Goal
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
