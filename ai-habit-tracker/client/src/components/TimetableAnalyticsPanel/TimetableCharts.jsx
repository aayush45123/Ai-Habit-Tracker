// Lazy-loaded sub-component: contains ALL chart.js code for TimetableAnalyticsPanel.
// Only downloaded when the Timetable page is visited.
import React from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { callback: (value) => `${value}%` },
    },
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { callback: (value) => `${value}%` },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } },
};

/**
 * Unified chart renderer for TimetableAnalyticsPanel.
 * Props:
 *   type: "bar" | "line" | "doughnut"
 *   data: chart.js data object
 */
export default function TimetableCharts({ type, data }) {
  if (type === "bar")      return <Bar      data={data} options={barOptions}      />;
  if (type === "line")     return <Line     data={data} options={lineOptions}     />;
  if (type === "doughnut") return <Doughnut data={data} options={doughnutOptions} />;
  return null;
}
