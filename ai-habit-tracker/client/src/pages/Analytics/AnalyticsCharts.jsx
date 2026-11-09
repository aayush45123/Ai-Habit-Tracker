// Lazy-loaded sub-component: standardizes on Recharts for optimal bundle size.
// Only downloaded when AnalyticsPage is visited.
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "2px solid #000000",
  borderRadius: 0,
  fontFamily: "Sora, sans-serif",
  fontSize: 12,
  padding: "6px 10px",
  boxShadow: "3px 3px 0 #000000",
};

const DEFAULT_COLORS = [
  "#7C3AED",
  "#22D3EE",
  "#FACC15",
  "#FB7185",
  "#34D399",
  "#F472B6",
  "#60A5FA",
];

/**
 * Unified chart renderer for AnalyticsPage using Recharts.
 * Props:
 *   type: "line" | "pie"
 *   labels / values — for line chart
 *   pieData / pieOptions — for pie chart
 */
export default function AnalyticsCharts({ type, labels = [], values = [], pieData }) {
  const lineData = useMemo(() => {
    return labels.map((label, idx) => ({
      label,
      completed: values[idx] ?? 0,
    }));
  }, [labels, values]);

  const pieChartData = useMemo(() => {
    if (!pieData?.labels) return [];
    const counts = pieData.datasets?.[0]?.data || [];
    const colors = pieData.datasets?.[0]?.backgroundColor || DEFAULT_COLORS;

    return pieData.labels.map((name, idx) => ({
      name,
      value: counts[idx] ?? 0,
      fill: colors[idx % colors.length],
    }));
  }, [pieData]);

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={pieChartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={75}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            verticalAlign="bottom"
            iconType="square"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={lineData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="completed"
          name="Habits Completed"
          stroke="#7C3AED"
          strokeWidth={3}
          dot={{ r: 4, fill: "#7C3AED" }}
          activeDot={{ r: 6, stroke: "#000000", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
