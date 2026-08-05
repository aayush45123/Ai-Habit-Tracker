import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import styles from "./Journal.module.css";
import { FiPlus, FiTrash2, FiCopy, FiCheck } from "react-icons/fi";

export default function JournalTemplatesManager() {
  const [templates, setTemplates] = useState({ systemTemplates: [], customTemplates: [] });
  const [loading, setLoading] = useState(true);

  // New Template Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Custom");
  const [fields, setFields] = useState([
    { key: "customField1", label: "Custom Note 1", type: "text", required: false },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const res = await api.get("/journal/templates");
      setTemplates(res.data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  }

  const addFieldRow = () => {
    const idx = fields.length + 1;
    setFields((prev) => [
      ...prev,
      { key: `customField${idx}`, label: `Custom Field ${idx}`, type: "text", required: false },
    ]);
  };

  const removeFieldRow = (idx) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFieldRow = (idx, key, val) => {
    setFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [key]: val } : f))
    );
  };

  async function handleCreateTemplate(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter template name");

    try {
      setSaving(true);
      await api.post("/journal/templates", {
        name,
        description,
        category,
        fields,
      });

      setName("");
      setDescription("");
      setFields([{ key: "customField1", label: "Custom Note 1", type: "text", required: false }]);
      fetchTemplates();
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(id) {
    if (!confirm("Delete custom template?")) return;
    try {
      await api.delete(`/journal/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 🚀 System Pre-built Templates Showcase */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ margin: 0, textTransform: "uppercase" }}>System Templates</h2>
        <div className={styles.statsGrid}>
          {templates.systemTemplates.map((t) => (
            <div key={t._id} className={styles.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>{t.name}</h3>
                <span className={styles.badge}>{t.category}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{t.description}</p>
              <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{t.fields?.length || 0} Structured Fields</div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛠️ Create Custom Template */}
      <form className={styles.formCard} onSubmit={handleCreateTemplate}>
        <h2 style={{ margin: 0, textTransform: "uppercase" }}>Build Custom Template</h2>

        <div className={styles.sectionGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Template Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Marathon Training Journal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Category</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Custom">Custom</option>
              <option value="Student">Student</option>
              <option value="Developer">Developer</option>
              <option value="Fitness">Fitness</option>
              <option value="Business">Business</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Description</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Brief explanation of what this template tracks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Dynamic Fields Builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, textTransform: "uppercase" }}>Custom Fields</h3>
            <button type="button" className={styles.tabBtn} onClick={addFieldRow}>
              <FiPlus /> Add Field
            </button>
          </div>

          {fields.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                className={styles.input}
                style={{ flex: 1, minWidth: "150px" }}
                placeholder="Field Key (e.g. studyHours)"
                value={f.key}
                onChange={(e) => updateFieldRow(i, "key", e.target.value)}
                required
              />
              <input
                type="text"
                className={styles.input}
                style={{ flex: 1.5, minWidth: "200px" }}
                placeholder="Field Label (e.g. Hours Studied)"
                value={f.label}
                onChange={(e) => updateFieldRow(i, "label", e.target.value)}
                required
              />
              <select
                className={styles.select}
                value={f.type}
                onChange={(e) => updateFieldRow(i, "type", e.target.value)}
              >
                <option value="text">Text Input</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="rating">Rating Slider (1-5)</option>
              </select>
              {fields.length > 1 && (
                <button
                  type="button"
                  className={styles.tabBtn}
                  style={{ background: "#ef4444", color: "#fff", padding: "0.5rem" }}
                  onClick={() => removeFieldRow(i)}
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? "Saving Template..." : "+ Save Custom Template"}
        </button>
      </form>

      {/* User Created Custom Templates List */}
      {templates.customTemplates.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ margin: 0, textTransform: "uppercase" }}>Your Custom Templates</h2>
          <div className={styles.statsGrid}>
            {templates.customTemplates.map((t) => (
              <div key={t._id} className={styles.statCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>{t.name}</h3>
                  <button
                    className={styles.tabBtn}
                    style={{ background: "#ef4444", color: "#fff", padding: "0.3rem 0.5rem" }}
                    onClick={() => handleDeleteTemplate(t._id)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{t.description}</p>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{t.fields?.length || 0} Dynamic Fields</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
