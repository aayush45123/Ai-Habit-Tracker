import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../utils/api";
import { FiUser, FiActivity, FiTarget, FiAlertCircle, FiCheckCircle, FiCamera, FiUploadCloud, FiBell, FiMail, FiClock } from "react-icons/fi";
import styles from "./Profile.module.css";

const Profile = () => {
  const { user, profile, refreshProfile, refreshUser } = useAuth();
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

  // Email reminder preferences state
  const [reminderPrefs, setReminderPrefs] = useState({
    emailNotifications: true,
    isReminderEnabled: true,
    dailyReminderTime: "20:00",
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState({ type: "", text: "" });

  // Avatar upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please select a valid image file." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image file size must be less than 5MB." });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage({ type: "", text: "" });
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    setIsUploadingAvatar(true);
    setMessage({ type: "", text: "" });

    try {
      const data = new FormData();
      data.append("image", selectedFile);

      const res = await api.post("/profile/upload-avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.profileImage) {
        setMessage({ type: "success", text: "Profile picture uploaded successfully!" });
        if (refreshUser) await refreshUser();
        setSelectedFile(null);
        setPreviewUrl("");
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to upload avatar. Please try again.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Prepopulate reminder prefs from user document
  useEffect(() => {
    if (user) {
      setReminderPrefs({
        emailNotifications: user.emailNotifications ?? true,
        isReminderEnabled: user.isReminderEnabled ?? true,
        dailyReminderTime: user.dailyReminderTime || "20:00",
      });
    }
  }, [user]);

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

  const handleSaveReminderPrefs = async () => {
    setIsSavingPrefs(true);
    setPrefsMessage({ type: "", text: "" });
    try {
      await api.patch("/auth/reminder-preferences", reminderPrefs);
      if (refreshUser) await refreshUser();
      setPrefsMessage({ type: "success", text: "Reminder preferences saved!" });
      setTimeout(() => setPrefsMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setPrefsMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to save preferences.",
      });
    } finally {
      setIsSavingPrefs(false);
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
          {/* Avatar Upload Container */}
          <div className={styles.avatarContainer}>
            <div className={styles.avatarWrapper}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className={styles.avatarImg} />
              ) : user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarFallback}>
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : <FiUser size={40} />}
                </div>
              )}

              <label htmlFor="avatarInput" className={styles.cameraBtn} title="Upload Profile Picture">
                <FiCamera size={18} />
              </label>
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.hiddenInput}
              />
            </div>

            {selectedFile && (
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className={styles.uploadAvatarBtn}
              >
                <FiUploadCloud size={16} />
                {isUploadingAvatar ? "Uploading to Cloudinary..." : "Save New Photo"}
              </button>
            )}
          </div>

          <h2 className={styles.title}>User Profile Settings</h2>
          <p className={styles.subtitle}>
            Manage your account details, upload profile picture, and configure physical attributes for AI insights.
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

          {/* ── EMAIL REMINDER PREFERENCES SECTION ── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FiBell size={16} /> Email Reminder Preferences
            </h3>
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "18px" }}>
              HabitAI will send you personalized daily reminders for incomplete habits every evening.
            </p>

            {/* Enable Notifications Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px 18px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FiMail size={18} color="#7c3aed" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#e0e0e0" }}>Email Notifications</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>Receive all habit-related email alerts</div>
                </div>
              </div>
              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={reminderPrefs.emailNotifications}
                  onChange={(e) => setReminderPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: reminderPrefs.emailNotifications ? "#7c3aed" : "#444",
                  borderRadius: "24px", transition: "0.3s"
                }} />
                <span style={{
                  position: "absolute", top: "3px",
                  left: reminderPrefs.emailNotifications ? "23px" : "3px",
                  width: "18px", height: "18px",
                  background: "#fff", borderRadius: "50%", transition: "0.3s"
                }} />
              </label>
            </div>

            {/* Daily Reminder Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px 18px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.08)", opacity: reminderPrefs.emailNotifications ? 1 : 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px" }}>🔥</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#e0e0e0" }}>Daily Habit Reminders</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>Remind me to complete pending habits</div>
                </div>
              </div>
              <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: reminderPrefs.emailNotifications ? "pointer" : "not-allowed" }}>
                <input
                  type="checkbox"
                  checked={reminderPrefs.isReminderEnabled}
                  disabled={!reminderPrefs.emailNotifications}
                  onChange={(e) => setReminderPrefs((p) => ({ ...p, isReminderEnabled: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: reminderPrefs.isReminderEnabled && reminderPrefs.emailNotifications ? "#7c3aed" : "#444",
                  borderRadius: "24px", transition: "0.3s"
                }} />
                <span style={{
                  position: "absolute", top: "3px",
                  left: reminderPrefs.isReminderEnabled && reminderPrefs.emailNotifications ? "23px" : "3px",
                  width: "18px", height: "18px",
                  background: "#fff", borderRadius: "50%", transition: "0.3s"
                }} />
              </label>
            </div>

            {/* Reminder Time Picker */}
            {reminderPrefs.emailNotifications && reminderPrefs.isReminderEnabled && (
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px 18px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <FiClock size={16} color="#7c3aed" />
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#e0e0e0" }}>Preferred Reminder Time (IST)</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {["08:00", "12:00", "18:00", "20:00", "21:00", "22:00"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReminderPrefs((p) => ({ ...p, dailyReminderTime: t }))}
                      style={{
                        padding: "8px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s",
                        background: reminderPrefs.dailyReminderTime === t ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                        border: reminderPrefs.dailyReminderTime === t ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.08)",
                        color: reminderPrefs.dailyReminderTime === t ? "#a78bfa" : "#ccc",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>Current: {reminderPrefs.dailyReminderTime} IST — you'll get an email around this time if you have incomplete habits.</p>
              </div>
            )}

            {/* Prefs message */}
            {prefsMessage.text && (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px",
                borderRadius: "8px", fontSize: "13px", marginBottom: "10px",
                background: prefsMessage.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: prefsMessage.type === "success" ? "#10b981" : "#ef4444",
                border: `1px solid ${prefsMessage.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`
              }}>
                {prefsMessage.type === "success" ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
                {prefsMessage.text}
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveReminderPrefs}
              disabled={isSavingPrefs}
              style={{
                width: "100%", padding: "12px", borderRadius: "10px", fontWeight: 700,
                fontSize: "14px", cursor: isSavingPrefs ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff", border: "none",
                opacity: isSavingPrefs ? 0.7 : 1, transition: "all 0.2s",
              }}
            >
              {isSavingPrefs ? "Saving..." : "Save Reminder Preferences"}
            </button>
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
