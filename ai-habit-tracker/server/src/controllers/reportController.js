// server/src/controllers/reportController.js
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import {
  getTodayIST,
  normalizeDateIST,
  getDaysAgoIST,
} from "../utils/getTodayIST.js";

// Initialize ChartJSNodeCanvas
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 500,
  height: 250,
  backgroundColour: "#ffffff",
});

/**
 * Generate charts using chartjs-node-canvas
 */
async function generateCharts(habitStats, dailyBreakdown, totalCompleted, totalMissed) {
  // 1. Bar Chart: Habit completion rates
  const barConfig = {
    type: "bar",
    data: {
      labels: habitStats.map((h) => h.title),
      datasets: [
        {
          label: "Completion Rate (%)",
          data: habitStats.map((h) => h.rate),
          backgroundColor: "#3182ce",
          borderColor: "#2b6cb0",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Habit Completion Rates (%)",
          font: { size: 14, weight: "bold" },
        },
      },
      scales: {
        y: { min: 0, max: 100 },
      },
    },
  };
  const barBuffer = await chartJSNodeCanvas.renderToBuffer(barConfig);

  // 2. Pie Chart: Completed vs Missed
  const pieConfig = {
    type: "pie",
    data: {
      labels: ["Completed", "Missed"],
      datasets: [
        {
          data: [totalCompleted, totalMissed],
          backgroundColor: ["#48BB78", "#FC8181"], // Green vs Red
          borderColor: ["#38A169", "#E53E3E"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: "Overall Completed vs Missed Logs",
          font: { size: 14, weight: "bold" },
        },
      },
    },
  };
  const pieBuffer = await chartJSNodeCanvas.renderToBuffer(pieConfig);

  // 3. Line Chart: Daily progress trend
  const lineConfig = {
    type: "line",
    data: {
      labels: dailyBreakdown.map((d) => {
        const parts = d.date.split("-");
        return `${parts[1]}/${parts[2]}`; // MM/DD
      }),
      datasets: [
        {
          label: "Daily Progress %",
          data: dailyBreakdown.map((d) => d.rate),
          borderColor: "#3182ce",
          backgroundColor: "rgba(49, 130, 206, 0.1)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          pointBackgroundColor: "#3182ce",
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Daily Completion Trend (%)",
          font: { size: 14, weight: "bold" },
        },
      },
      scales: {
        y: { min: 0, max: 100 },
      },
    },
  };
  const lineBuffer = await chartJSNodeCanvas.renderToBuffer(lineConfig);

  return { barBuffer, pieBuffer, lineBuffer };
}

/**
 * Generate Report calculations and render PDF
 */
export const getReport = async (req, res, periodType) => {
  try {
    const todayISO = getTodayIST();
    let dates = [];

    if (periodType === "week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        dates.push(getDaysAgoIST(i));
      }
    } else if (periodType === "month") {
      // Days from 1st of current month up to today
      const [year, month, day] = todayISO.split("-");
      const currentDayVal = parseInt(day, 10);
      for (let i = 1; i <= currentDayVal; i++) {
        const dayStr = String(i).padStart(2, "0");
        dates.push(`${year}-${month}-${dayStr}`);
      }
    }

    const habits = await Habit.find({ userId: req.user._id });
    const habitIds = habits.map((h) => h._id);
    const totalHabits = habits.length;

    // Handle empty state gracefully
    if (totalHabits === 0) {
      return generateEmptyPDF(res, req.user.name, periodType, todayISO);
    }

    const logs = await HabitLog.find({ habitId: { $in: habitIds } });
    const normalizedLogs = logs.map((l) => ({
      ...l._doc,
      dateStr: normalizeDateIST(l.date),
    }));

    // Statistics per habit
    let totalCompleted = 0;
    let totalMissed = 0;
    const habitStats = [];

    for (const habit of habits) {
      // Find starting date of habit
      const rawStart = habit.startDate || habit.createdAt;
      const startDateObj = new Date(rawStart);
      const startIST = new Date(startDateObj.getTime() + 330 * 60000);
      const startISO = startIST.toISOString().split("T")[0];

      let completedCount = 0;
      let missedCount = 0;

      for (const d of dates) {
        if (d >= startISO) {
          const log = normalizedLogs.find(
            (l) => l.habitId.toString() === habit._id.toString() && l.dateStr === d
          );
          if (log && log.status === "done") {
            completedCount++;
          } else {
            missedCount++;
          }
        }
      }

      totalCompleted += completedCount;
      totalMissed += missedCount;

      const totalExpected = completedCount + missedCount;
      const rate = totalExpected > 0 ? Math.round((completedCount / totalExpected) * 100) : 0;

      habitStats.push({
        habitId: habit._id,
        title: habit.title,
        completed: completedCount,
        missed: missedCount,
        totalExpected,
        rate,
        streak: habit.streak || 0,
        longestStreak: habit.longestStreak || 0,
      });
    }

    const overallCompletionRate =
      totalCompleted + totalMissed > 0
        ? Math.round((totalCompleted / (totalCompleted + totalMissed)) * 100)
        : 0;

    const maxCurrentStreak = Math.max(...habits.map((h) => h.streak || 0), 0);
    const maxLongestStreak = Math.max(...habits.map((h) => h.longestStreak || 0), 0);

    // Calculate active days
    const activeDaysSet = new Set();
    normalizedLogs.forEach((l) => {
      if (l.status === "done" && dates.includes(l.dateStr)) {
        activeDaysSet.add(l.dateStr);
      }
    });
    const totalActiveDays = activeDaysSet.size;

    // Sort to find best and weakest habits
    const sortedStats = [...habitStats].sort((a, b) => b.rate - a.rate);
    const bestHabit = sortedStats[0];
    const weakestHabit = sortedStats[sortedStats.length - 1];

    // Daily breakdown calculation
    const dailyBreakdown = [];
    for (const d of dates) {
      let activeCount = 0;
      let dayCompleted = 0;

      for (const habit of habits) {
        const rawStart = habit.startDate || habit.createdAt;
        const startDateObj = new Date(rawStart);
        const startIST = new Date(startDateObj.getTime() + 330 * 60000);
        const startISO = startIST.toISOString().split("T")[0];

        if (d >= startISO) {
          activeCount++;
          const log = normalizedLogs.find(
            (l) => l.habitId.toString() === habit._id.toString() && l.dateStr === d
          );
          if (log && log.status === "done") {
            dayCompleted++;
          }
        }
      }

      const dayMissed = activeCount - dayCompleted;
      const dayRate = activeCount > 0 ? Math.round((dayCompleted / activeCount) * 100) : 0;

      dailyBreakdown.push({
        date: d,
        completed: dayCompleted,
        missed: dayMissed,
        rate: dayRate,
      });
    }

    // AI Motivational Summary Heuristics
    let aiSummary = "";
    if (overallCompletionRate >= 80) {
      aiSummary = `Excellent consistency this ${periodType === "week" ? "week" : "month"}. Your overall completion rate of ${overallCompletionRate}% shows fantastic discipline. Your ${bestHabit?.title || "main"} habit is outstanding. Keep up the high effort to maintain these streaks!`;
    } else if (overallCompletionRate >= 50) {
      aiSummary = `Good tracking and consistency this ${periodType === "week" ? "week" : "month"}. You reached a completion rate of ${overallCompletionRate}%. You are successfully locking in routines like ${bestHabit?.title || ""}, but focusing slightly more on ${weakestHabit?.title || ""} will raise your overall scores.`;
    } else {
      aiSummary = `Your overall completion rate is ${overallCompletionRate}% for this period. Formulating daily routines takes effort and practice. We suggest reviewing your triggers and starting with a smaller expectation to lock in the habits.`;
    }

    // Badges Heuristics
    const badges = [];
    if (maxCurrentStreak >= 7) {
      badges.push({ emoji: "🔥", title: "7 Day Streak", desc: "Kept a habit streak active for 7+ days" });
    }
    if (overallCompletionRate >= 85) {
      badges.push({ emoji: "🏆", title: "Consistency Master", desc: "Finished 85%+ of overall habits" });
    }
    const workoutStats = habitStats.filter((h) =>
      /workout|gym|exercise|run|sport|fitness|cardio/i.test(h.title)
    );
    if (workoutStats.some((w) => w.rate >= 80)) {
      badges.push({ emoji: "💪", title: "Workout Warrior", desc: "Completed 80%+ of workout goals" });
    }
    const readingStats = habitStats.filter((h) =>
      /read|book|study|learn|write/i.test(h.title)
    );
    if (readingStats.some((r) => r.rate >= 80)) {
      badges.push({ emoji: "📚", title: "Reading Champion", desc: "Completed 80%+ of reading goals" });
    }
    if (periodType === "week" && overallCompletionRate === 100) {
      badges.push({ emoji: "⭐", title: "Perfect Week", desc: "100% completion on all days" });
    }

    if (badges.length === 0) {
      badges.push({ emoji: "🌱", title: "Fresh Start", desc: "First steps to building consistency" });
    }

    // Recommendations Heuristics
    const recommendations = [];
    habitStats.forEach((h) => {
      if (h.rate < 60) {
        recommendations.push(`Increase "${h.title}" habit consistency (currently at ${h.rate}%).`);
      }
      if (h.streak >= 3) {
        recommendations.push(`Maintain your "${h.title}" streak (currently active at ${h.streak} days).`);
      }
    });
    if (habits.some((h) => /sleep/i.test(h.title))) {
      recommendations.push("Complete Sleep habit before midnight to align your body clock.");
    }
    if (habits.some((h) => /meditat/i.test(h.title))) {
      recommendations.push("Focus on Meditation to enhance mindfulness and reduce stress.");
    }

    if (recommendations.length < 2) {
      recommendations.push("Schedule your habits at the same time each day to build mental associations.");
      recommendations.push("Review triggers that cause you to miss tracking habits.");
    }

    // Generate Charts
    const { barBuffer, pieBuffer, lineBuffer } = await generateCharts(
      habitStats,
      dailyBreakdown,
      totalCompleted,
      totalMissed
    );

    // Build PDFKit Doc
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    // Stream PDF to HTTP response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Habit_Tracker_${periodType === "week" ? "Weekly" : "Monthly"}_Report.pdf`
    );
    doc.pipe(res);

    /* =========================================
       PAGE 1: Title, Stats, AI & Badges
       ========================================= */

    // Top Header Banner Gradient effect
    doc.save();
    doc.rect(0, 0, 612, 110).fill("#1a365d");
    doc.restore();

    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text("AI HABIT TRACKER", 50, 30);
    doc.font("Helvetica").fontSize(13).text(
      `${periodType === "week" ? "Weekly" : "Monthly"} Progress Performance Report`,
      50,
      60
    );

    // Date range details text
    const dateRangeText = `Period: ${dates[0]} to ${dates[dates.length - 1]}`;
    doc.fontSize(9).text(dateRangeText, 50, 80);

    // Profile Details Card
    doc.fillColor("#2d3748").font("Helvetica-Bold").fontSize(12).text("PROFILE SUMMARY", 50, 130);
    doc.font("Helvetica").fontSize(10).text(`User: ${req.user.name}`, 50, 150);
    doc.text(`Generated: ${todayISO} IST`, 50, 165);
    doc.text(`Active Tracked Habits: ${totalHabits}`, 50, 180);

    // Divider Line
    doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, 200).lineTo(562, 200).stroke();

    // Stats Grid Header
    doc.font("Helvetica-Bold").fontSize(12).text("KEY STATISTICS", 50, 215);

    // Stats Cards Drawing Helper
    const drawCard = (doc, title, value, x, y, width, height) => {
      doc.save();
      // Draw rounded card border
      doc.roundedRect(x, y, width, height, 8).fillAndStroke("#FFFFFF", "#CBD5E0");
      // Add a primary blue top border line
      doc.rect(x + 1, y + 1, width - 2, 4).fill("#3182CE");
      // Text writing inside card
      doc.fillColor("#4A5568").fontSize(8).font("Helvetica-Bold").text(title.toUpperCase(), x + 10, y + 15, { width: width - 20 });
      doc.fillColor("#1A365D").fontSize(18).font("Helvetica-Bold").text(String(value), x + 10, y + 26, { width: width - 20 });
      doc.restore();
    };

    // Calculate coords
    const cardW = 158;
    const cardH = 50;
    const row1Y = 235;
    const row2Y = 295;

    // Draw 6 Cards
    drawCard(doc, "Overall Completion", `${overallCompletionRate}%`, 50, row1Y, cardW, cardH);
    drawCard(doc, "Total Habits", totalHabits, 222, row1Y, cardW, cardH);
    drawCard(doc, "Total Completed", totalCompleted, 394, row1Y, cardW, cardH);

    drawCard(doc, "Total Missed", totalMissed, 50, row2Y, cardW, cardH);
    drawCard(doc, "Current Streak", `${maxCurrentStreak} Days`, 222, row2Y, cardW, cardH);
    drawCard(doc, "Longest Streak", `${maxLongestStreak} Days`, 394, row2Y, cardW, cardH);

    // AI Motivational Summary Card
    doc.fillColor("#2D3748").font("Helvetica-Bold").fontSize(12).text("AI MOTIVATIONAL SUMMARY", 50, 365);
    doc.save();
    doc.roundedRect(50, 380, 512, 60, 6).fillAndStroke("#EBF8FF", "#BEE3F8"); // Light blue card
    doc.fillColor("#2B6CB0").fontSize(9.5).font("Helvetica").text(
      aiSummary,
      62,
      392,
      { width: 488, lineGap: 3 }
    );
    doc.restore();

    // Achievements Section
    doc.fillColor("#2D3748").font("Helvetica-Bold").fontSize(12).text("EARNED BADGES", 50, 460);
    let badgeY = 480;
    badges.slice(0, 3).forEach((b) => {
      doc.fontSize(16).text(b.emoji, 55, badgeY);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#2D3748").text(b.title, 80, badgeY);
      doc.font("Helvetica").fontSize(9.5).fillColor("#718096").text(b.desc, 80, badgeY + 12);
      badgeY += 32;
    });

    // Recommendations Section
    doc.fillColor("#2D3748").font("Helvetica-Bold").fontSize(12).text("AI ROUTINE RECOMMENDATIONS", 50, 590);
    let recY = 610;
    recommendations.slice(0, 3).forEach((rec) => {
      doc.fillColor("#3182CE").fontSize(12).text("•", 55, recY - 2);
      doc.fillColor("#2D3748").font("Helvetica").fontSize(9.5).text(rec, 72, recY, { width: 480 });
      recY += 22;
    });

    /* =========================================
       PAGE 2: Charts Section
       ========================================= */
    doc.addPage();
    doc.fillColor("#1A365D").font("Helvetica-Bold").fontSize(16).text("PERFORMANCE VISUALIZATIONS", 50, 40);
    doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, 60).lineTo(562, 60).stroke();

    // Embedded Line Chart (Daily Trend)
    doc.image(lineBuffer, 56, 80, { width: 500, height: 210 });

    // Bar chart & Pie chart arranged side by side
    doc.image(barBuffer, 50, 310, { width: 280, height: 180 });
    doc.image(pieBuffer, 340, 310, { width: 220, height: 180 });

    // Summary below the charts
    doc.fillColor("#2D3748").font("Helvetica-Bold").fontSize(11).text("Visual Interpretation Summary", 50, 520);
    doc.font("Helvetica").fontSize(9.5).fillColor("#4A5568").text(
      `1. The Daily Trend Chart displays your completion consistency throughout the ${periodType === "week" ? "7-day" : "monthly"} period. Peak points represent 100% adherence.\n` +
      `2. The Habit Completion Rates graph contrasts the performance of each habit. Focus efforts on items reporting less than 75% consistency.\n` +
      `3. The ratio of Completed to Missed check-ins is detailed by the pie breakdown, serving as your final productivity indicator.`,
      50,
      540,
      { lineGap: 3 }
    );

    /* =========================================
       PAGE 3: Analytical Tables
       ========================================= */
    doc.addPage();
    doc.fillColor("#1A365D").font("Helvetica-Bold").fontSize(16).text("DETAILED ANALYTICS TABLES", 50, 40);
    doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, 60).lineTo(562, 60).stroke();

    // Table 1: Habit-wise Statistics
    doc.fillColor("#2D3748").font("Helvetica-Bold").fontSize(12).text("HABIT-WISE STATISTICS", 50, 80);

    const habitHeaders = ["Habit Name", "Done", "Missed", "Rate %", "Streak", "Max Streak"];
    const habitRows = habitStats.map((h) => [
      h.title,
      h.completed,
      h.missed,
      `${h.rate}%`,
      `${h.streak}d`,
      `${h.longestStreak}d`,
    ]);
    const habitColWidths = [162, 60, 60, 70, 80, 80]; // Sums to 512

    let nextY = drawTable(doc, habitHeaders, habitRows, 50, 100, habitColWidths, 22);

    // Table 2: Daily Breakdown
    nextY += 20;
    doc.fillColor("#2D3748").font("Helvetica-Bold").fontSize(12).text("DAILY BREAKDOWN", 50, nextY);
    
    const dailyHeaders = ["Date", "Completed Habits Count", "Missed Habits Count", "Daily Completion Rate %"];
    const dailyRows = dailyBreakdown.map((d) => [
      d.date,
      d.completed,
      d.missed,
      `${d.rate}%`,
    ]);
    const dailyColWidths = [120, 140, 120, 132]; // Sums to 512

    drawTable(doc, dailyHeaders, dailyRows, 50, nextY + 20, dailyColWidths, 20);

    // Write footer and Page Numbers on all buffered pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Footer design
      doc.save();
      doc.strokeColor("#E2E8F0").lineWidth(0.5).moveTo(50, doc.page.height - 50).lineTo(562, doc.page.height - 50).stroke();
      doc.fontSize(7.5).fillColor("#718096");
      doc.text(
        `Generated by AI Habit Tracker | Date: ${todayISO} IST | Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 40,
        { align: "center", width: 512 }
      );
      doc.restore();
    }

    doc.end();

  } catch (err) {
    console.error("Error generating report PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating report PDF", error: err.message });
    }
  }
};

/**
 * Generate a clean empty report PDF when user has no habits
 */
function generateEmptyPDF(res, userName, periodType, todayISO) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
      `attachment; filename=Habit_Tracker_${periodType === "week" ? "Weekly" : "Monthly"}_Report.pdf`
  );
  doc.pipe(res);

  doc.save();
  doc.rect(0, 0, 612, 110).fill("#1a365d");
  doc.restore();

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text("AI HABIT TRACKER", 50, 30);
  doc.font("Helvetica").fontSize(13).text(
    `${periodType === "week" ? "Weekly" : "Monthly"} Progress Performance Report`,
    50,
    60
  );

  doc.fillColor("#2d3748").font("Helvetica-Bold").fontSize(14).text("No habits found!", 50, 160);
  doc.font("Helvetica").fontSize(11).fillColor("#718096").text(
    `Hello ${userName || "User"},\n\n` +
    `It looks like you don't have any habits set up in your tracker yet. ` +
    `Create your first habit on the dashboard to unlock weekly and monthly analytics reports.\n\n` +
    `Once you check in at least once, we will render progress trends, statistics cards, motivation summaries, achievements badges, and personalized routine advice here.`,
    50,
    190,
    { width: 512, lineGap: 5 }
  );

  // Simple footer
  doc.save();
  doc.strokeColor("#E2E8F0").lineWidth(0.5).moveTo(50, doc.page.height - 50).lineTo(562, doc.page.height - 50).stroke();
  doc.fontSize(8).fillColor("#718096").text(
    `Generated by AI Habit Tracker | Date: ${todayISO} IST | Page 1 of 1`,
    50,
    doc.page.height - 40,
    { align: "center", width: 512 }
  );
  doc.restore();

  doc.end();
}

/**
 * Helper to draw tables with support for pagination and alternate rows
 */
function drawTable(doc, headers, rows, startX, startY, colWidths, rowHeight = 22) {
  let currentY = startY;

  const drawHeaders = (y) => {
    doc.save();
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#1A365D");
    doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold");

    let currentX = startX;
    headers.forEach((h, idx) => {
      doc.text(h, currentX + 6, y + 6, { width: colWidths[idx] - 12, align: "left" });
      currentX += colWidths[idx];
    });
    doc.restore();
  };

  drawHeaders(currentY);
  currentY += rowHeight;

  rows.forEach((row, rowIdx) => {
    // Check for page overflow
    if (currentY + rowHeight > doc.page.height - 60) {
      doc.addPage();
      currentY = 60; // reset to top margin
      drawHeaders(currentY);
      currentY += rowHeight;
    }

    doc.save();
    const isAlt = rowIdx % 2 === 1;
    const bg = isAlt ? "#F7FAFC" : "#FFFFFF";
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);

    doc.rect(startX, currentY, totalWidth, rowHeight).fill(bg);
    doc.strokeColor("#E2E8F0").lineWidth(0.5).rect(startX, currentY, totalWidth, rowHeight).stroke();

    doc.fillColor("#2D3748").fontSize(8.5).font("Helvetica");
    let currentX = startX;
    row.forEach((cell, cellIdx) => {
      doc.text(String(cell), currentX + 6, currentY + 6, { width: colWidths[cellIdx] - 12, align: "left" });
      currentX += colWidths[cellIdx];
    });
    doc.restore();

    currentY += rowHeight;
  });

  return currentY;
}
