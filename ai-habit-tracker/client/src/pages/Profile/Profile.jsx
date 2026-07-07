import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../utils/api";
import { FiUser, FiActivity, FiTarget, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import styles from "./Profile.module.css";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const forceComplete = location.state?.forceComplete;

  const [formData, setFormData] = useState({
    age: "",
    height: "",
    weight: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain",
    dailyGoal: "",
    proteinGoal: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepopulate form if profile details already exist
  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age || "",
        height: profile.height || "",
        weight: profile.weight || "",
        gender: profile.gender || "male",
        activityLevel: profile.activityLevel || "moderate",
        goal: profile.goal || "maintain",
        dailyGoal: profile.dailyGoal || "",
        proteinGoal: profile.proteinGoal || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      const payload = {
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      };

      // Add goals only if they are explicitly filled
      if (formData.dailyGoal) payload.dailyGoal = parseInt(formData.dailyGoal);
      if (formData.proteinGoal) payload.proteinGoal = parseInt(formData.proteinGoal);

      const res = await api.post("/profile", payload);

      if (res.status === 200 || res.status === 201) {
        setMessage({ type: "success", text: "Profile details updated successfully!" });
        // Refresh AuthContext profile details
        await refreshProfile();
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving profile details:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile. Please check your fields and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      {forceComplete && (
        <div className={styles.forceCompleteBanner}>
          <FiAlertCircle size={20} />
          <span>Please complete your profile details to unlock the habit tracker and other sections.</span>
        </div>
      )}

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSymbol}>
            <FiUser size={40} />
          </div>
          <h2 className={styles.title}>User Profile Settings</h2>
          <p className={styles.subtitle}>
            Enter your physical details to configure automated AI goals and recommendations.
          </p>
        </div>

        {message.text && (
          <div className={`${styles.messageBox} ${styles[message.type]}`}>
            {message.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.profileForm}>
          {/* Section 1: User Account */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Account Details</h4>
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Name</span>
                <span className={styles.readOnlyValue}>{user?.name || "User"}</span>
              </div>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Email</span>
                <span className={styles.readOnlyValue}>{user?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Section 2: Physical Details */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Physical Attributes</h4>
            <div className={styles.inputsGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Age (Years)</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  required
                  min="1"
                  max="120"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 175"
                  required
                  min="50"
                  max="300"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 70"
                  required
                  min="20"
                  max="500"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Section 3: Lifestyle Goals */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Lifestyle & Objectives</h4>
            <div className={styles.inputsGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Activity Level</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="sedentary">Sedentary (0-1 days/week)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (2x daily)</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Fitness Objective</label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="lose">Weight Loss (Deficit)</option>
                  <option value="maintain">Weight Maintenance</option>
                  <option value="gain">Muscle Gain (Surplus)</option>
                </select>
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Section 4: Optional Targets */}
          <div className={styles.formSection}>
            <h4 className={styles.sectionTitle}>Custom Daily Targets (Optional)</h4>
            <p className={styles.sectionSubtext}>
              Leave empty to automatically calculate targets using the AI planner based on your weight and goals.
            </p>
            <div className={styles.inputsGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Daily Calories (kcal)</label>
                <input
                  type="number"
                  name="dailyGoal"
                  value={formData.dailyGoal}
                  onChange={handleChange}
                  placeholder="Auto-calculated (TDEE)"
                  min="500"
                  max="10000"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Daily Protein (g)</label>
                <input
                  type="number"
                  name="proteinGoal"
                  value={formData.proteinGoal}
                  onChange={handleChange}
                  placeholder="Auto-calculated"
                  min="20"
                  max="500"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.saveBtn} ${isSubmitting ? styles.submitting : ""}`}
          >
            {isSubmitting ? "Saving Details..." : "Save Profile Configuration"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
