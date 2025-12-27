import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./Calories.module.css";

export default function Calories() {
  const [food, setFood] = useState("");
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    age: "",
    height: "",
    weight: "",
    activityLevel: "moderate",
    dailyGoal: 2000,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load profile first
      const profileRes = await api.get("/calories/profile").catch(() => null);

      if (profileRes && profileRes.data) {
        setProfile(profileRes.data);
        // Only load status if profile exists
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

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await api.post("/calories/profile", {
        age: parseInt(profileData.age),
        height: parseInt(profileData.height),
        weight: parseInt(profileData.weight),
        activityLevel: profileData.activityLevel,
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
      // Estimate calories using AI
      const aiRes = await api.post("/calories/ai/estimate", {
        foodName: food.trim(),
      });

      // Save food log
      await api.post("/calories/food", {
        foodName: food.trim(),
        calories: aiRes.data.calories,
      });

      setFood("");
      loadStatus();
    } catch (err) {
      console.error("Error adding food:", err);
      alert("Failed to add food. Please try again.");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Calorie Tracker</h2>
        {profile && (
          <button
            className={styles.btnSecondary}
            onClick={() => setShowProfileForm(!showProfileForm)}
          >
            {showProfileForm ? "Close Profile" : "Edit Profile"}
          </button>
        )}
      </div>

      {showProfileForm && (
        <form onSubmit={saveProfile} className={styles.profileForm}>
          <h3 className={styles.formTitle}>
            {profile ? "Update Profile" : "Set Up Your Profile"}
          </h3>
          <p className={styles.formSubtitle}>
            Required for AI-powered calorie recommendations
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
                <option value="low">Low (0-1 days/week)</option>
                <option value="moderate">Moderate (3-4 days/week)</option>
                <option value="high">High (5-7 days/week)</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Daily Calorie Goal</label>
              <input
                type="number"
                required
                min="1000"
                max="5000"
                step="100"
                className={styles.input}
                value={profileData.dailyGoal}
                onChange={(e) =>
                  setProfileData({ ...profileData, dailyGoal: e.target.value })
                }
                placeholder="2000"
              />
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary}>
            Save Profile
          </button>
        </form>
      )}

      {profile && !showProfileForm && (
        <>
          {status && (
            <div className={styles.statusCard}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Goal</span>
                <span className={styles.statusValue}>{status.goal} kcal</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Consumed</span>
                <span className={styles.statusValue}>
                  {status.consumed} kcal
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>
                  {status.remaining >= 0 ? "Remaining" : "Over"}
                </span>
                <span
                  className={`${styles.statusValue} ${
                    status.remaining < 0 ? styles.over : ""
                  }`}
                >
                  {Math.abs(status.remaining)} kcal
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
        </>
      )}
    </div>
  );
}
