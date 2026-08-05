// Lazy-loaded sub-component: contains ALL recharts code.
// Only downloaded when ChallengePage is visited.
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./ChallengeTrend.module.css";

function CustomTooltip({ active, payload }) {
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
}

export default function ChallengeTrendChart({ trendData }) {
  return (
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
  );
}
