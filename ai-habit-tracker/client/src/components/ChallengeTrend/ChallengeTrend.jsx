// ChallengeTrend.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../utils/api";
import styles from "./ChallengeTrend.module.css";

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
      const today = new Date();
      const todayISO = today.toISOString().split("T")[0];

      // Process all 21 days
      const chartData = heatmap.map((day, index) => {
        const dateObj = new Date(day.date);
        const dayNum = index + 1;

        // Only show completed count for past/present days
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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      if (data.isFuture) {
        return (
          <div className={styles.tooltip}>
            <p className={styles.tooltipLabel}>{data.day}</p>
            <p className={styles.tooltipDate}>{data.date}</p>
            <p className={styles.tooltipFuture}>Future Day</p>
          </div>
        );
      }

      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{data.day}</p>
          <p className={styles.tooltipDate}>{data.date}</p>
          <p className={styles.tooltipValue}>
            Completed: {data.count}/{data.total}
          </p>
          <p className={styles.tooltipPercentage}>{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

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

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={trendData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="#000000"
              strokeWidth={2}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#000000"
              strokeWidth={2}
              tick={{ fill: "#000000", fontWeight: 700, fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              stroke="#000000"
              strokeWidth={2}
              tick={{ fill: "#000000", fontWeight: 700, fontSize: 12 }}
              label={{
                value: "Habits Completed",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#000000", fontWeight: 700, fontSize: 13 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{
                fill: "#6366f1",
                strokeWidth: 2,
                r: 5,
                stroke: "#000000",
              }}
              activeDot={{
                r: 7,
                strokeWidth: 2,
                stroke: "#000000",
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
