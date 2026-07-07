import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Check, X } from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext.jsx";
import CalorieSummary from "../../components/CalorieSummary/CalorieSummary";
import NutritionRecommendation from "../../components/NutritionRecommendation/NutritionRecommendation";
import CalorieAnalytics from "../../components/CalorieAnalytics/CalorieAnalytics";
import WeeklyCheckIn from "../../components/WeeklyCheckIn/WeeklyCheckIn";
import styles from "./Calories.module.css";

export default function Calories() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [food, setFood] = useState("");
  const [status, setStatus] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState(0);
  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalData, setGoalData] = useState({
    dailyGoal: 2000,
    proteinGoal: 100,
  });

  useEffect(() => {
    loadData();
    checkWeeklyCheckIn();
  }, [profile]);

  async function loadData() {
    try {
      if (profile) {
        setGoalData({
          dailyGoal: profile.dailyGoal || 2000,
          proteinGoal: profile.proteinGoal || 100,
        });
        loadStatus();
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  async function loadStatus() {
    try {
      const res = await api.get("/calories/status");
      setStatus(res.data);
    } catch (err) {
      console.error("Error loading status:", err);
    }
  }

  async function checkWeeklyCheckIn() {
    try {
      const res = await api.get("/calories/check-weekly");
      if (res.data.shouldShow) {
        setShowWeeklyCheckIn(true);
      }
    } catch (err) {
      console.error("Error checking weekly:", err);
    }
  }

  async function saveGoals() {
    try {
      const res = await api.post("/profile", {
        dailyGoal: parseInt(goalData.dailyGoal),
        proteinGoal: parseInt(goalData.proteinGoal),
      });

      await refreshProfile();
      setEditingGoals(false);
      loadStatus();
      alert("Goals updated successfully!");
    } catch (err) {
      console.error("Error saving goals:", err);
      alert("Failed to update goals. Please try again.");
    }
  }

  function cancelEditGoals() {
    setGoalData({
      dailyGoal: profile?.dailyGoal || 2000,
      proteinGoal: profile?.proteinGoal || 100,
    });
    setEditingGoals(false);
  }

  async function addFood() {
    if (!food.trim()) {
      alert("Please enter a food item");
      return;
    }

    if (!profile) {
      alert("Please set up your profile first");
      setShowProfileForm(true);
      return;
    }

    try {
      const aiRes = await api.post("/calories/ai/estimate", {
        foodName: food.trim(),
      });

      await api.post("/calories/food", {
        foodName: food.trim(),
        calories: aiRes.data.calories,
        protein: aiRes.data.protein,
      });

      setFood("");
      loadStatus();
      setRefreshSummary((prev) => prev + 1);
    } catch (err) {
      console.error("Error adding food:", err);
      alert("Failed to add food. Please try again.");
    }
  }

  function handleWeeklyCheckInComplete() {
    setShowWeeklyCheckIn(false);
    loadData();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Calorie Tracker</h2>
        <div className={styles.headerButtons}>
          {profile && (
            <>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                {showAnalytics ? "Hide Analytics" : "View Analytics"}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => navigate("/profile")}
              >
                Edit Profile Details
              </button>
            </>
          )}
        </div>
      </div>

      {showWeeklyCheckIn && (
        <WeeklyCheckIn onComplete={handleWeeklyCheckInComplete} />
      )}

      {profile && !showAnalytics && (
        <>
          <NutritionRecommendation profile={profile} />

          {status && (
            <div className={styles.statusCard}>
              <div className={styles.statusHeader}>
                <h3 className={styles.statusTitle}>Today's Progress</h3>
                {!editingGoals ? (
                  <button
                    className={styles.editButton}
                    onClick={() => setEditingGoals(true)}
                    title="Edit Goals"
                  >
                    <Edit2 size={18} />
                    Edit Goals
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button
                      className={styles.saveButton}
                      onClick={saveGoals}
                      title="Save"
                    >
                      <Check size={18} />
                      Save
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={cancelEditGoals}
                      title="Cancel"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Your Calorie Goal</span>
                  {editingGoals ? (
                    <input
                      type="number"
                      className={styles.goalInput}
                      value={goalData.dailyGoal}
                      onChange={(e) =>
                        setGoalData({ ...goalData, dailyGoal: e.target.value })
                      }
                      min="500"
                      max="10000"
                    />
                  ) : (
                    <span className={styles.statusValue}>
                      {status.calorieGoal} kcal
                    </span>
                  )}
                </div>

                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Consumed</span>
                  <span className={styles.statusValue}>
                    {status.caloriesConsumed} kcal
                  </span>
                </div>

                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>
                    {status.caloriesRemaining >= 0 ? "Remaining" : "Over"}
                  </span>
                  <span
                    className={`${styles.statusValue} ${
                      status.caloriesRemaining < 0 ? styles.over : ""
                    }`}
                  >
                    {Math.abs(status.caloriesRemaining)} kcal
                  </span>
                </div>

                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Protein Goal</span>
                  {editingGoals ? (
                    <input
                      type="number"
                      className={styles.goalInput}
                      value={goalData.proteinGoal}
                      onChange={(e) =>
                        setGoalData({
                          ...goalData,
                          proteinGoal: e.target.value,
                        })
                      }
                      min="20"
                      max="500"
                    />
                  ) : (
                    <span className={styles.statusValue}>
                      {status.proteinConsumed}g / {status.proteinGoal}g
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.inputSection}>
            <input
              value={food}
              onChange={(e) => setFood(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addFood()}
              placeholder="What did you eat?"
              className={styles.foodInput}
            />
            <button onClick={addFood} className={styles.btnPrimary}>
              Add
            </button>
          </div>

          <CalorieSummary key={refreshSummary} />
        </>
      )}

      {showAnalytics && <CalorieAnalytics />}
    </div>
  );
}
