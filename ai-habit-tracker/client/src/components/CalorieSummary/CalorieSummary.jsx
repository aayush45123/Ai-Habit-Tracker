import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../utils/api";
import styles from "./CalorieSummary.module.css";

export default function CalorieSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  async function deleteFood(foodId) {
    if (!window.confirm("Delete this food item?")) return;

    try {
      await api.delete(`/calories/food/${foodId}`);
      loadSummary();
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
        {summary.items.map((food, index) => (
          <div key={food._id} className={styles.item}>
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
              </div>
            </div>
            <div className={styles.itemRight}>
              <div className={styles.nutrition}>
                <span className={styles.calories}>{food.calories} kcal</span>
                <span className={styles.protein}>{food.protein}g protein</span>
              </div>
              <button
                onClick={() => deleteFood(food._id)}
                className={styles.deleteBtn}
                title="Delete"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
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
