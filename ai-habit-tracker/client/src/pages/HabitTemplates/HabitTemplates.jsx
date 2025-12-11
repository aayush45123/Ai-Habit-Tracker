import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./HabitTemplates.module.css";

export default function HabitTemplates() {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadCategories();
    loadAllTemplates();
  }, []);

  async function loadCategories() {
    const res = await api.get("/templates/categories");
    setCategories(res.data);
  }

  async function loadAllTemplates() {
    const res = await api.get("/templates/all");
    setTemplates(res.data);
  }

  async function loadTemplates(category) {
    setSelectedCategory(category);

    if (category === "All") {
      return loadAllTemplates();
    }

    const res = await api.get(`/templates/${category}`);
    setTemplates(res.data);
  }

  async function addHabit(template) {
    await api.post("/habits/add", {
      title: template.title,
      description: template.description,
      recommendedTime: template.recommendedTime,
    });

    alert("Habit added to your list!");
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Habit Templates</h2>
      <p className={styles.subtitle}>
        Choose from curated templates to build your habits quickly.
      </p>

      {/* CATEGORY LIST */}
      <div className={styles.categoryList}>
        <button
          className={`${styles.categoryButton} ${
            selectedCategory === "All" ? styles.active : ""
          }`}
          onClick={() => loadTemplates("All")}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryButton} ${
              selectedCategory === cat ? styles.active : ""
            }`}
            onClick={() => loadTemplates(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* TEMPLATES GRID */}
      <div className={styles.templatesGrid}>
        {templates.length === 0 ? (
          <p>No templates found.</p>
        ) : (
          templates.map((t) => (
            <div key={t._id} className={styles.templateCard}>
              <h3>{t.title}</h3>
              <p>{t.description}</p>

              {t.recommendedTime && (
                <p className={styles.time}>⏱️ {t.recommendedTime}</p>
              )}

              <span className={styles.badge}>{t.difficulty}</span>

              <button className={styles.addBtn} onClick={() => addHabit(t)}>
                + Add Habit
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
