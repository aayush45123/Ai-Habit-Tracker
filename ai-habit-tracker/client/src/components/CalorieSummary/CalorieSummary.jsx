import { useEffect, useState } from "react";
import { X, Edit2, Check, Sparkles } from "lucide-react";
import api from "../../utils/api";
import styles from "./CalorieSummary.module.css";

export default function CalorieSummary({ onMealChanged }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inline editing state for user corrections / AI training
  const [editingId, setEditingId] = useState(null);
  const [editFoodName, setEditFoodName] = useState("");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/calories/ai/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Error loading summary:", err);
      setError("Failed to load calorie summary");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(food) {
    setEditingId(food._id);
    setEditFoodName(food.foodName);
    setEditCalories(food.calories);
    setEditProtein(food.protein || 0);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(foodId) {
    if (!editFoodName.trim() || editCalories === "") {
      alert("Please provide food name and calories");
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/calories/food/${foodId}`, {
        foodName: editFoodName.trim(),
        calories: Number(editCalories),
        protein: Number(editProtein || 0),
      });
      setEditingId(null);
      await loadSummary();
      onMealChanged?.();
    } catch (err) {
      console.error("Error updating food:", err);
      alert("Failed to update food item. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteFood(foodId) {
    if (!window.confirm("Delete this food item?")) return;

    try {
      await api.delete(`/calories/food/${foodId}`);
      await loadSummary();
      onMealChanged?.();
    } catch (err) {
      console.error("Error deleting food:", err);
      alert("Failed to delete food item");
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading today's meals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!summary || !summary.items || summary.items.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Today's Meals</h3>
        <div className={styles.empty}>
          <p>No meals logged yet today</p>
          <p className={styles.emptyHint}>
            Start tracking by adding what you ate above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Today's Meals</h3>
        <div className={styles.totals}>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Calories</span>
            <span className={styles.totalValue}>
              {summary.totalCalories} kcal
            </span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Protein</span>
            <span className={styles.totalValue}>{summary.totalProtein}g</span>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {summary.items.map((food, index) => {
          const isEditing = editingId === food._id;

          return (
            <div key={food._id} className={styles.item}>
              {isEditing ? (
                <div className={styles.editRow}>
                  <div className={styles.editFields}>
                    <input
                      type="text"
                      className={styles.editInputText}
                      value={editFoodName}
                      onChange={(e) => setEditFoodName(e.target.value)}
                      placeholder="Food description"
                    />
                    <div className={styles.inputGroup}>
                      <input
                        type="number"
                        className={styles.editInputNumber}
                        value={editCalories}
                        onChange={(e) => setEditCalories(e.target.value)}
                        min="0"
                      />
                      <span>kcal</span>
                    </div>
                    <div className={styles.inputGroup}>
                      <input
                        type="number"
                        className={styles.editInputNumber}
                        value={editProtein}
                        onChange={(e) => setEditProtein(e.target.value)}
                        min="0"
                      />
                      <span>g P</span>
                    </div>
                  </div>
                  <div className={styles.actionBtns}>
                    <button
                      onClick={() => saveEdit(food._id)}
                      className={styles.saveBtn}
                      disabled={savingEdit}
                      title="Save & Train AI"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className={styles.cancelBtn}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemNumber}>{index + 1}</span>
                    <div className={styles.itemDetails}>
                      <span className={styles.foodName}>{food.foodName}</span>
                      <span className={styles.timestamp}>
                        {new Date(food.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {food.isUserEdited && (
                        <span
                          className={styles.trainedBadge}
                          title="Trained into AI memory from your calibration"
                        >
                          <Sparkles size={11} /> Calibrated
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.nutrition}>
                      <span className={styles.calories}>
                        {food.calories} kcal
                      </span>
                      <span className={styles.protein}>
                        {food.protein}g protein
                      </span>
                    </div>
                    <div className={styles.actionBtns}>
                      <button
                        onClick={() => startEdit(food)}
                        className={styles.editBtn}
                        title="Edit & Train AI"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => deleteFood(food._id)}
                        className={styles.deleteBtn}
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Items Logged</span>
          <span className={styles.statValue}>{summary.items.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg Calories/Item</span>
          <span className={styles.statValue}>
            {Math.round(summary.totalCalories / summary.items.length)} kcal
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg Protein/Item</span>
          <span className={styles.statValue}>
            {Math.round(summary.totalProtein / summary.items.length)}g
          </span>
        </div>
      </div>
    </div>
  );
}
