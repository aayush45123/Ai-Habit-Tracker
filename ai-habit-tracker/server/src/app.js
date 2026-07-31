import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import adminTemplateRoutes from "./routes/adminTemplateRoutes.js";
import publicTemplateRoutes from "./routes/habitTemplateRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";
import calorieRoutes from "./routes/calorieRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import workoutLogRoutes from "./routes/workoutLogRoutes.js";
import aiTimetableRoutes from "./routes/aiTimetableRoutes.js";
import aiCoachRoutes from "./routes/aiCoachRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import datasetRoutes from "./routes/datasetRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Import streak reset function
import { scheduleDailyReminderCron, scheduleWeeklySummaryCron } from "./cron/emailReminder.cron.js";
import { checkAndResetMissedStreaks } from "./controllers/habitController.js";

/* =======================
   ENV & DB
======================= */
dotenv.config();
connectDB();

const app = express();

/* =======================
   BODY PARSER
======================= */
app.use(express.json());

/* =======================
   ✅ PRODUCTION CORS (FIXED)
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ai-habit-tracker-eb72.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* =======================
   ✅ PREFLIGHT FIX (NODE 22 SAFE)
======================= */
app.options(/.*/, cors());

/* =======================
   ROUTES - FIXED CALORIE PATH
======================= */
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);
app.use("/api/templates", publicTemplateRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/calories", calorieRoutes); // Changed from /calorie to /calories
// Timetable routes (support both plural and singular paths for backward compatibility)
app.use("/api/timetables", timetableRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/workout-logs", workoutLogRoutes);
app.use("/api/ai-timetable", aiTimetableRoutes);
app.use("/api/coach", aiCoachRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/dataset", datasetRoutes); // Use dataset routes
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* =======================
   AUTOMATIC STREAK RESET - DAILY CRON JOB
======================= */

// Run initial streak check when server starts
console.log("Running initial streak check on server startup...");
checkAndResetMissedStreaks()
  .then(() => {
    console.log("Initial streak check completed successfully");
  })
  .catch((err) => {
    console.error("Initial streak check failed:", err);
  });

// Schedule daily streak reset at 00:01 AM IST
cron.schedule(
  "1 0 * * *",
  async () => {
    console.log("Running scheduled daily streak check...");
    try {
      await checkAndResetMissedStreaks();
      console.log("Daily streak check completed successfully");
    } catch (err) {
      console.error("Daily streak check failed:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

console.log("Streak reset cron job scheduled (runs daily at 00:01 IST)");

/* =======================
   EMAIL REMINDER CRON JOBS
======================= */
scheduleDailyReminderCron();
scheduleWeeklySummaryCron();

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.status(200).send("AI Habit Tracker Backend Running");
});

/* =======================
   ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export default app;
