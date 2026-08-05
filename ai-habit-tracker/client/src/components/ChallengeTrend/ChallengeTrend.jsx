// ChallengeTrend.jsx
import React, { lazy, Suspense, useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./ChallengeTrend.module.css";

// ── recharts is heavy (~350 KB) — only load it when ChallengePage is visited ──
const ChallengeTrendChart = lazy(() => import("./ChallengeTrendChart.jsx"));

function ChartFallback() {
  return (
    <div className={styles.chartContainer} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className={styles.loadingText}>Loading chart…</p>
    </div>
  );
}

export default function ChallengeTrend() {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendData();
  }, []);

  async function loadTrendData() {
    try {
      const res = await api.get("/challenge/heatmap");

      if (!res.data.heatmap || res.data.heatmap.length === 0) {
        setLoading(false);
        return;
      }

      const heatmap = res.data.heatmap;
      const todayISO = new Date().toISOString().split("T")[0];

      // Process all 21 days
      const chartData = heatmap.map((day, index) => {
        const dayNum = index + 1;
        const value = day.date <= todayISO ? day.count : null;

        return {
          day: `Day ${dayNum}`,
          dayNumber: dayNum,
          value: value,
          count: day.count,
          total: day.total,
          percentage: day.percentage,
          date: day.date,
          isFuture: day.date > todayISO,
        };
      });

      setTrendData(chartData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading trend data:", err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>21-Day Trend Analysis</h3>
          <div className={styles.badge}>LOADING...</div>
        </div>
        <div className={styles.chartContainer}>
          <p className={styles.loadingText}>Loading data...</p>
        </div>
      </div>
    );
  }

  if (trendData.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>21-Day Trend Analysis</h3>
        <div className={styles.badge}>ALL 21 DAYS</div>
      </div>

      <Suspense fallback={<ChartFallback />}>
        <ChallengeTrendChart trendData={trendData} />
      </Suspense>
    </div>
  );
}
