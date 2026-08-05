import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { FiCheck, FiSave, FiCalendar, FiSmile, FiZap, FiTarget } from "react-icons/fi";

const MOODS = [
  { id: "great", label: "😄 Great", score: 5 },
  { id: "good", label: "🙂 Good", score: 4 },
  { id: "neutral", label: "😐 Neutral", score: 3 },
  { id: "bad", label: "🙁 Bad", score: 2 },
  { id: "terrible", label: "😫 Terrible", score: 1 },
];

export default function JournalEntryForm({ initialDate, onSaved }) {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [templates, setTemplates] = useState({ systemTemplates: [], customTemplates: [] });
  const [selectedTemplate, setSelectedTemplate] = useState("sys_default");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    mood: "good",
    moodScore: 4,
    energyLevel: 3,
    stressLevel: 2,
    productivityHours: 6,
    learningHours: 2,
    sleepHours: 7,
    waterIntake: 2.5,
    weight: 70,
    steps: 8000,
    caloriesBurned: 350,
    workoutSummary: "",
    topPriorities: "",
    todayGoal: "",
    learningLog: "",
    biggestAchievement: "",
    mistakesMade: "",
    challengesFaced: "",
    lessonsLearned: "",
    gratitude: "",
    tomorrowsFocus: "",
    tags: "",
    customFieldsData: {},
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (date) {
      loadEntryForDate(date);
    }
  }, [date]);

  async function fetchTemplates() {
    try {
      const res = await api.get("/journal/templates");
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }

  async function loadEntryForDate(targetDate) {
    try {
      setLoading(true);
      const res = await api.get(`/journal/entries/date/${targetDate}`);
      if (res.data.entry) {
        const e = res.data.entry;
        setForm({
          title: e.title || "",
          content: e.content || "",
          mood: e.mood || "good",
          moodScore: e.moodScore || 4,
          energyLevel: e.energyLevel || 3,
          stressLevel: e.stressLevel || 2,
          productivityHours: e.productivityHours || 0,
          learningHours: e.learningHours || 0,
          sleepHours: e.sleepHours || 0,
          waterIntake: e.waterIntake || 0,
          weight: e.weight || 0,
          steps: e.steps || 0,
          caloriesBurned: e.caloriesBurned || 0,
          workoutSummary: e.workoutSummary || "",
          topPriorities: Array.isArray(e.topPriorities) ? e.topPriorities.join("\n") : e.topPriorities || "",
          todayGoal: e.todayGoal || "",
          learningLog: e.learningLog || "",
          biggestAchievement: e.biggestAchievement || "",
          mistakesMade: e.mistakesMade || "",
          challengesFaced: e.challengesFaced || "",
          lessonsLearned: e.lessonsLearned || "",
          gratitude: Array.isArray(e.gratitude) ? e.gratitude.join("\n") : e.gratitude || "",
          tomorrowsFocus: e.tomorrowsFocus || "",
          tags: Array.isArray(e.tags) ? e.tags.join(", ") : e.tags || "",
          customFieldsData: e.customFieldsData || {},
        });
        if (e.templateType) {
          setSelectedTemplate(`sys_${e.templateType}`);
        }
      }
    } catch (err) {
      console.error("Error loading date entry:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleCustomFieldChange = (key, val) => {
    setForm((prev) => ({
      ...prev,
      customFieldsData: { ...prev.customFieldsData, [key]: val },
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage("");

      const payload = {
        ...form,
        date,
        templateType: selectedTemplate.startsWith("sys_") ? selectedTemplate.replace("sys_", "") : "custom",
        topPriorities: form.topPriorities.split("\n").filter(Boolean),
        gratitude: form.gratitude.split("\n").filter(Boolean),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      await api.post("/journal/entries", payload);
      setMessage("✓ Journal entry saved successfully!");
      if (onSaved) onSaved();
    } catch (err) {
      console.error("Failed to save entry:", err);
      setMessage("❌ Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  // Find active template object
  const allTemplatesList = [...templates.systemTemplates, ...templates.customTemplates];
  const activeTpl = allTemplatesList.find((t) => t._id === selectedTemplate) || templates.systemTemplates[0];

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <FiCalendar size={20} />
          <input
            type="date"
            className={styles.input}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <label className={styles.fieldLabel}>Template:</label>
          <select
            className={styles.select}
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <optgroup label="System Templates">
              {templates.systemTemplates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            {templates.customTemplates.length > 0 && (
              <optgroup label="Custom Templates">
                {templates.customTemplates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading entry...</div>
      ) : (
        <>
          {/* Quick Title & Mood */}
          <div className={styles.sectionGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Entry Title</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Focused Study & Great Afternoon Run"
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Mood</label>
              <div className={styles.moodPicker}>
                {MOODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={`${styles.moodBtn} ${form.mood === m.id ? styles.moodActive : ""}`}
                    onClick={() => {
                      handleInputChange("mood", m.id);
                      handleInputChange("moodScore", m.score);
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sliders: Energy, Stress, Sleep, Productivity */}
          <div className={styles.sectionGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Energy Level (1 to 5): {form.energyLevel}</label>
              <input
                type="range"
                min="1"
                max="5"
                className={styles.rangeInput}
                value={form.energyLevel}
                onChange={(e) => handleInputChange("energyLevel", Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Stress Level (1 to 5): {form.stressLevel}</label>
              <input
                type="range"
                min="1"
                max="5"
                className={styles.rangeInput}
                value={form.stressLevel}
                onChange={(e) => handleInputChange("stressLevel", Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Productivity Hours: {form.productivityHours} hrs</label>
              <input
                type="number"
                step="0.5"
                className={styles.input}
                value={form.productivityHours}
                onChange={(e) => handleInputChange("productivityHours", Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Sleep Hours: {form.sleepHours} hrs</label>
              <input
                type="number"
                step="0.5"
                className={styles.input}
                value={form.sleepHours}
                onChange={(e) => handleInputChange("sleepHours", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Fitness & Personal Metrics */}
          <div className={styles.sectionGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Learning / Study Hours</label>
              <input
                type="number"
                step="0.5"
                className={styles.input}
                value={form.learningHours}
                onChange={(e) => handleInputChange("learningHours", Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Water Intake (Liters)</label>
              <input
                type="number"
                step="0.1"
                className={styles.input}
                value={form.waterIntake}
                onChange={(e) => handleInputChange("waterIntake", Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={styles.input}
                value={form.weight}
                onChange={(e) => handleInputChange("weight", Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Steps Walked</label>
              <input
                type="number"
                className={styles.input}
                value={form.steps}
                onChange={(e) => handleInputChange("steps", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Template Specific / Dynamic Fields */}
          {activeTpl && activeTpl.fields && activeTpl.fields.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
              <h3 style={{ textTransform: "uppercase", fontSize: "1.1rem" }}>{activeTpl.name} Fields</h3>
              <div className={styles.sectionGrid}>
                {activeTpl.fields.map((f) => (
                  <div key={f.key} className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea
                        className={styles.textarea}
                        value={form[f.key] !== undefined ? form[f.key] : form.customFieldsData[f.key] || ""}
                        onChange={(e) => {
                          if (form[f.key] !== undefined) handleInputChange(f.key, e.target.value);
                          else handleCustomFieldChange(f.key, e.target.value);
                        }}
                      />
                    ) : f.type === "rating" ? (
                      <div className={styles.sliderGroup}>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          className={styles.rangeInput}
                          value={form[f.key] !== undefined ? form[f.key] : form.customFieldsData[f.key] || 3}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (form[f.key] !== undefined) handleInputChange(f.key, val);
                            else handleCustomFieldChange(f.key, val);
                          }}
                        />
                        <span style={{ fontWeight: 800, minWidth: "30px" }}>
                          {form[f.key] !== undefined ? form[f.key] : form.customFieldsData[f.key] || 3} / 5
                        </span>
                      </div>
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        className={styles.input}
                        value={form[f.key] !== undefined ? form[f.key] : form.customFieldsData[f.key] || ""}
                        onChange={(e) => {
                          const val = f.type === "number" ? Number(e.target.value) : e.target.value;
                          if (form[f.key] !== undefined) handleInputChange(f.key, val);
                          else handleCustomFieldChange(f.key, val);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Freeform Writing / Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Freeform Notes & Additional Reflections</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Write your thoughts, ideas, or reflection for the day..."
              value={form.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Tags (comma separated)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Workout, Exams, HighProductivity, DeepWork"
              value={form.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
            />
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              <FiSave size={18} />
              {saving ? "Saving Entry..." : "Save Daily Entry"}
            </button>
            {message && <span style={{ fontWeight: 700 }}>{message}</span>}
          </div>
        </>
      )}
    </form>
  );
}
