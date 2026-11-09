// Lazy-loaded sub-component: standardizes on Recharts for optimal bundle size.
// Only downloaded when AnalyticsPage is visited.
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
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
 *   type: "line" | "bar" | "pie"
 *   labels / values — for line or bar chart
 *   pieData / pieOptions — for pie chart
 *   barColor — optional color override for bar chart
 *   height — optional chart height (default 220)
 *   unit — optional unit suffix for tooltip (e.g. "%")
 */
export default function AnalyticsCharts({
  type,
  labels = [],
  values = [],
  pieData,
  barColor = "#7C3AED",
  height = 220,
  unit = "",
}) {
  const lineData = useMemo(() => {
    return labels.map((label, idx) => ({
      label,
      value: values[idx] ?? 0,
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p style={{ margin: 0, fontWeight: 700, color: "#000" }}>{label}</p>
          <p style={{ margin: "2px 0 0", color: barColor }}>
            {payload[0].value}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={height}>
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

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill={barColor}
            radius={0}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default: line
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={lineData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="value"
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
