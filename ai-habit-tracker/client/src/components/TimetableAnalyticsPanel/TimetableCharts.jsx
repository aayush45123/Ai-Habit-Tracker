// Lazy-loaded sub-component: standardizes on Recharts for optimal bundle size.
// Only downloaded when the Timetable page is visited.
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

const DEFAULT_FOCUS_COLORS = [
  "#14532d",
  "#1d4ed8",
  "#c2410c",
  "#7c3aed",
  "#0f766e",
  "#dc2626",
  "#64748b",
];

/**
 * Unified chart renderer for TimetableAnalyticsPanel using Recharts.
 * Props:
 *   type: "bar" | "line" | "doughnut"
 *   data: chart data object
 */
export default function TimetableCharts({ type, data }) {
  const chartItems = useMemo(() => {
    if (!data?.labels) return [];
    const values = data.datasets?.[0]?.data || [];
    const colors = data.datasets?.[0]?.backgroundColor;
    const isColorArray = Array.isArray(colors);

    return data.labels.map((label, idx) => ({
      name: label,
      value: values[idx] ?? 0,
      color: isColorArray
        ? colors[idx] || DEFAULT_FOCUS_COLORS[idx % DEFAULT_FOCUS_COLORS.length]
        : typeof colors === "string"
        ? colors
        : DEFAULT_FOCUS_COLORS[idx % DEFAULT_FOCUS_COLORS.length],
    }));
  }, [data]);

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val) => [`${val}%`, "Completion"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartItems.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    const strokeColor = data?.datasets?.[0]?.borderColor || "#14532d";
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartItems} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val) => [`${val}%`, "Adherence"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Adherence"
            stroke={strokeColor}
            strokeWidth={3}
            dot={{ r: 4, fill: strokeColor }}
            activeDot={{ r: 6, stroke: "#000000", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "doughnut") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={chartItems}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {chartItems.map((entry, index) => (
              <Cell key={`doughnut-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            verticalAlign="bottom"
            iconType="square"
            wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
