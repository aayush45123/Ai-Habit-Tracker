import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./AdminTemplates.module.css";

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    recommendedTime: "",
    difficulty: "Easy",
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  async function loadTemplates() {
    const res = await api.get("/admin/templates");
    setTemplates(res.data);
  }

  async function loadCategories() {
    const res = await api.get("/admin/templates/categories");
    setCategories(res.data);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    if (!form.title || !form.category) {
      alert("Title and category required");
      return;
    }

    if (editId) {
      await api.put(`/admin/templates/${editId}`, form);
      setEditId(null);
    } else {
      await api.post("/admin/templates", form);
    }

    setForm({
      title: "",
      category: "",
      description: "",
      recommendedTime: "",
      difficulty: "Easy",
    });

    loadTemplates();
  }

  function startEdit(t) {
    setEditId(t._id);
    setForm({
      title: t.title,
      category: t.category,
      description: t.description,
      recommendedTime: t.recommendedTime,
      difficulty: t.difficulty,
    });
  }

  async function deleteTemplate(id) {
    if (!confirm("Delete this template?")) return;
    await api.delete(`/admin/templates/${id}`);
    loadTemplates();
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Admin – Habit Templates Manager</h2>

      {/* ADD / EDIT FORM */}
      <div className={styles.formCard}>
        <h3>{editId ? "Edit Template" : "Add New Template"}</h3>

        <div className={styles.formGrid}>
          <input
            name="title"
            placeholder="Template Title"
            value={form.title}
            onChange={handleChange}
          />

          <input
            name="category"
            placeholder="Category (Fitness, Study, etc)"
            value={form.category}
            onChange={handleChange}
            list="catList"
          />
          <datalist id="catList">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <input
            name="recommendedTime"
            placeholder="Recommended Time (optional)"
            value={form.recommendedTime}
            onChange={handleChange}
          />

          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          <textarea
            name="description"
            placeholder="Short description"
            value={form.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <button className={styles.submitBtn} onClick={handleSubmit}>
          {editId ? "Update Template" : "Add Template"}
        </button>
      </div>

      {/* TEMPLATE LIST */}
      <div className={styles.grid}>
        {templates.map((t) => (
          <div key={t._id} className={styles.card}>
            <h3>{t.title}</h3>
            <p className={styles.category}>{t.category}</p>
            <p>{t.description}</p>
            {t.recommendedTime && (
              <p className={styles.time}>⏱ {t.recommendedTime}</p>
            )}
            <span className={styles.tag}>{t.difficulty}</span>

            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => startEdit(t)}>
                Edit
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => deleteTemplate(t._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
