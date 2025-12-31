import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import CalorieSummary from "../../components/CalorieSummary/CalorieSummary";
import NutritionRecommendation from "../../components/NutritionRecommendation/NutritionRecommendation";
import CalorieAnalytics from "../../components/CalorieAnalytics/CalorieAnalytics";
import WeeklyCheckIn from "../../components/WeeklyCheckIn/WeeklyCheckIn";
import styles from "./Calories.module.css";

export default function Calories() {
  const [food, setFood] = useState("");
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState(0);
  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = useState(false);
  const [profileData, setProfileData] = useState({
    age: "",
    height: "",
    weight: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain",
    dailyGoal: 2000,
  });

  useEffect(() => {
    loadData();
    checkWeeklyCheckIn();
  }, []);

  async function loadData() {
    try {
      const profileRes = await api.get("/calories/profile").catch(() => null);

      if (profileRes && profileRes.data) {
        setProfile(profileRes.data);
        loadStatus();
      } else {
        setShowProfileForm(true);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setShowProfileForm(true);
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

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await api.post("/calories/profile", {
        age: parseInt(profileData.age),
        height: parseInt(profileData.height),
        weight: parseInt(profileData.weight),
        gender: profileData.gender,
        activityLevel: profileData.activityLevel,
        goal: profileData.goal,
        dailyGoal: parseInt(profileData.dailyGoal),
      });

      setProfile(res.data);
      setShowProfileForm(false);
      loadStatus();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    }
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
                onClick={() => setShowProfileForm(!showProfileForm)}
              >
                {showProfileForm ? "Close Profile" : "Edit Profile"}
              </button>
            </>
          )}
        </div>
      </div>

      {showWeeklyCheckIn && (
        <WeeklyCheckIn onComplete={handleWeeklyCheckInComplete} />
      )}

      {showProfileForm && (
        <form onSubmit={saveProfile} className={styles.profileForm}>
          <h3 className={styles.formTitle}>
            {profile ? "Update Profile" : "Set Up Your Profile"}
          </h3>
          <p className={styles.formSubtitle}>
            Get personalized calorie and protein recommendations
          </p>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Age</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                className={styles.input}
                value={profileData.age}
                onChange={(e) =>
                  setProfileData({ ...profileData, age: e.target.value })
                }
                placeholder="25"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Height (cm)</label>
              <input
                type="number"
                required
                min="50"
                max="300"
                className={styles.input}
                value={profileData.height}
                onChange={(e) =>
                  setProfileData({ ...profileData, height: e.target.value })
                }
                placeholder="170"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Weight (kg)</label>
              <input
                type="number"
                required
                min="20"
                max="500"
                className={styles.input}
                value={profileData.weight}
                onChange={(e) =>
                  setProfileData({ ...profileData, weight: e.target.value })
                }
                placeholder="70"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Gender</label>
              <select
                className={styles.select}
                value={profileData.gender}
                onChange={(e) =>
                  setProfileData({ ...profileData, gender: e.target.value })
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Activity Level</label>
              <select
                className={styles.select}
                value={profileData.activityLevel}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    activityLevel: e.target.value,
                  })
                }
              >
                <option value="sedentary">Sedentary (0-1 days/week)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (2x per day)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Goal</label>
              <select
                className={styles.select}
                value={profileData.goal}
                onChange={(e) =>
                  setProfileData({ ...profileData, goal: e.target.value })
                }
              >
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Gain Weight</option>
              </select>
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Save Profile & Get Recommendations
          </button>
        </form>
      )}

      {profile && !showProfileForm && !showAnalytics && (
        <>
          <NutritionRecommendation profile={profile} />

          {status && (
            <div className={styles.statusCard}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Calorie Goal</span>
                <span className={styles.statusValue}>
                  {status.calorieGoal} kcal
                </span>
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
                <span className={styles.statusValue}>
                  {status.proteinConsumed}g / {status.proteinGoal}g
                </span>
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
