import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Check, X, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showPastDate, setShowPastDate] = useState(false);
  const [pastDate, setPastDate] = useState("");
  const [addingPast, setAddingPast] = useState(false);

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

  // Get today's date string in YYYY-MM-DD (local) for max attr on date input
  const todayStr = new Date().toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD

  async function addFood() {
    if (!food.trim()) {
      alert("Please enter a food item");
      return;
    }

    if (!profile) {
      alert("Please set up your profile first");
      return;
    }

    // Validate past date when toggled on
    if (showPastDate && !pastDate) {
      alert("Please select a past date to log food for.");
      return;
    }

    if (showPastDate && pastDate >= todayStr) {
      alert("Please select a date before today.");
      return;
    }

    setAddingPast(true);
    try {
      const aiRes = await api.post("/calories/ai/estimate", {
        foodName: food.trim(),
      });

      await api.post("/calories/food", {
        foodName: food.trim(),
        calories: aiRes.data.calories,
        protein: aiRes.data.protein,
        ...(showPastDate && pastDate ? { date: pastDate } : {}),
      });

      setFood("");
      // Only reload today's status if logging for today
      if (!showPastDate) {
        loadStatus();
        setRefreshSummary((prev) => prev + 1);
      } else {
        alert(`✅ Food logged for ${new Date(pastDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} successfully!`);
      }
    } catch (err) {
      console.error("Error adding food:", err);
      alert("Failed to add food. Please try again.");
    } finally {
      setAddingPast(false);
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
                onClick={() => navigate("/profile?tab=settings")}
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

          {/* Past-date logging toggle */}
          <div className={styles.pastDateSection}>
            <button
              className={styles.pastDateToggle}
              onClick={() => {
                setShowPastDate((prev) => !prev);
                setPastDate("");
              }}
            >
              <CalendarDays size={16} />
              Log food for a past date
              {showPastDate ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showPastDate && (
              <div className={styles.pastDatePicker}>
                <label className={styles.pastDateLabel}>
                  Select the date you want to add food to:
                </label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={pastDate}
                  max={new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString("en-CA")}
                  onChange={(e) => setPastDate(e.target.value)}
                />
                {pastDate && (
                  <span className={styles.pastDateBadge}>
                    📅 Logging for:{" "}
                    <strong>
                      {new Date(pastDate + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.inputSection}>
            <input
              value={food}
              onChange={(e) => setFood(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addFood()}
              placeholder={showPastDate && pastDate ? `What did you eat on ${new Date(pastDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}?` : "What did you eat?"}
              className={styles.foodInput}
            />
            <button
              onClick={addFood}
              className={styles.btnPrimary}
              disabled={addingPast}
            >
              {addingPast ? "Adding..." : showPastDate ? "Add to Past" : "Add"}
            </button>
          </div>

          <CalorieSummary key={refreshSummary} />
        </>
      )}

      {showAnalytics && <CalorieAnalytics />}
    </div>
  );
}
