// Lazy-loaded sub-component: contains ALL chart.js code.
// This file is only downloaded when AnalyticsPage is visited.
import React from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
);

/**
 * Unified chart renderer for AnalyticsPage.
 * Props:
 *   type: "line" | "pie"
 *   labels / values — for line chart
 *   pieData / pieOptions — for pie chart
 */
export default function AnalyticsCharts({ type, labels, values, pieData, pieOptions }) {
  if (type === "pie") {
    return <Pie data={pieData} options={pieOptions} />;
  }

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Completed",
            data: values,
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 5,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      }}
    />
  );
}
