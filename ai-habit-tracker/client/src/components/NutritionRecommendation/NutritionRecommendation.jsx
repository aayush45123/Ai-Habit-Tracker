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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Daily Targets</h3>
        <span className={styles.badge}>{recommendations.goalLabel}</span>
      </div>

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
