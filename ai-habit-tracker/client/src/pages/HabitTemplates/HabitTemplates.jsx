// client/src/pages/HabitTemplates/HabitTemplates.jsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  Clock,
  Sparkles,
  Filter,
  TrendingUp,
  Zap,
  Star,
  Target,
  Activity,
  Heart,
  Book,
  Coffee,
  Dumbbell,
  Sunrise,
  Moon,
  CheckCircle,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./HabitTemplates.module.css";

// Category icons mapping
const categoryIcons = {
  Health: Heart,
  Productivity: TrendingUp,
  Fitness: Dumbbell,
  Mindfulness: Sparkles,
  Learning: Book,
  Morning: Sunrise,
  Evening: Moon,
  Energy: Zap,
  All: Target,
};

// Difficulty icons
const difficultyIcons = {
  Easy: CheckCircle,
  Medium: Activity,
  Hard: Star,
};

export default function HabitTemplates() {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [addingTemplate, setAddingTemplate] = useState(null);

  useEffect(() => {
    loadCategories();
    loadAllTemplates();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.get("/templates/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  async function loadAllTemplates() {
    try {
      setLoading(true);
      const res = await api.get("/templates/all");
      setTemplates(res.data);
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates(category) {
    setSelectedCategory(category);

    if (category === "All") {
      return loadAllTemplates();
    }

    try {
      setLoading(true);
      const res = await api.get(`/templates/${category}`);
      setTemplates(res.data);
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addHabit(template) {
    try {
      setAddingTemplate(template._id);
      await api.post("/habits/add", {
        title: template.title,
        description: template.description,
        recommendedTime: template.recommendedTime,
      });

      // Show success feedback
      const successMsg = document.createElement("div");
      successMsg.textContent = "✓ Habit added successfully!";
      successMsg.className = styles.successToast;
      document.body.appendChild(successMsg);

      setTimeout(() => {
        successMsg.remove();
      }, 2000);
    } catch (err) {
      console.error("Error adding habit:", err);
      alert("Failed to add habit. Please try again.");
    } finally {
      setAddingTemplate(null);
    }
  }

  // Get icon for category
  const getCategoryIcon = (category) => {
    const IconComponent = categoryIcons[category] || Target;
    return <IconComponent className={styles.categoryIcon} />;
  };

  // Get icon for difficulty
  const getDifficultyIcon = (difficulty) => {
    const IconComponent = difficultyIcons[difficulty] || Activity;
    return <IconComponent className={styles.difficultyIcon} />;
  };

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Sparkles className={styles.sparkleIcon} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Habit Templates</h2>
            <p className={styles.subtitle}>
              Choose from curated templates to build your habits quickly
            </p>
          </div>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <Target className={styles.statIcon} />
            <span className={styles.statValue}>{templates.length}</span>
            <span className={styles.statLabel}>Templates</span>
          </div>
          <div className={styles.statItem}>
            <Filter className={styles.statIcon} />
            <span className={styles.statValue}>{categories.length + 1}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <Filter className={styles.filterIcon} />
          <span className={styles.filterTitle}>Filter by Category</span>
        </div>

        <div className={styles.categoryList}>
          <button
            className={`${styles.categoryButton} ${
              selectedCategory === "All" ? styles.active : ""
            }`}
            onClick={() => loadTemplates("All")}
          >
            {getCategoryIcon("All")}
            <span>All</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryButton} ${
                selectedCategory === cat ? styles.active : ""
              }`}
              onClick={() => loadTemplates(cat)}
            >
              {getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TEMPLATES GRID */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading templates...</p>
        </div>
      ) : (
        <div className={styles.templatesGrid}>
          {templates.length === 0 ? (
            <div className={styles.emptyState}>
              <Coffee className={styles.emptyIcon} />
              <p className={styles.emptyText}>No templates found</p>
              <p className={styles.emptySubtext}>
                Try selecting a different category
              </p>
            </div>
          ) : (
            templates.map((t) => (
              <div key={t._id} className={styles.templateCard}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardCategory}>
                    {getCategoryIcon(t.category || "All")}
                    <span>{t.category || "General"}</span>
                  </div>
                  <div className={styles.cardDifficulty}>
                    {getDifficultyIcon(t.difficulty)}
                    <span>{t.difficulty}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{t.title}</h3>
                  <p className={styles.cardDescription}>{t.description}</p>
                </div>

                {/* Card Footer */}
                <div className={styles.cardFooter}>
                  {t.recommendedTime && (
                    <div className={styles.timeInfo}>
                      <Clock className={styles.timeIcon} />
                      <span>{t.recommendedTime}</span>
                    </div>
                  )}

                  <button
                    className={styles.addBtn}
                    onClick={() => addHabit(t)}
                    disabled={addingTemplate === t._id}
                  >
                    {addingTemplate === t._id ? (
                      <>
                        <div className={styles.miniSpinner}></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className={styles.addIcon} />
                        <span>Add Habit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
