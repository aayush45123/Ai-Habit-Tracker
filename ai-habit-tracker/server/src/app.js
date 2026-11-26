import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import connectDB from "./config/db.js";

import securityHeaders from "./middleware/securityHeaders.js";
import cookieParser from "./middleware/cookieParser.js";
import { apiLimiter, aiLimiter } from "./middleware/rateLimiter.js";

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
import scheduleRoutes from "./routes/scheduleRoutes.js";
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

import journalRoutes from "./routes/journalRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import { seedGamificationData } from "./seeds/gamificationSeed.js";

import { scheduleDailyReminderCron, scheduleWeeklySummaryCron } from "./cron/emailReminder.cron.js";
import { checkAndResetMissedStreaks } from "./controllers/habitController.js";

/* =======================
   ENV & DB
======================= */
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();
app.set("trust proxy", 1);

/* =======================
   SECURITY HEADERS & COOKIES
======================= */
app.use(securityHeaders);
app.use(cookieParser);

/* =======================
   BODY PARSER (Strict size limits to prevent DoS)
======================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* =======================
   HARDENED PRODUCTION CORS
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ai-habit-tracker-eb72.vercel.app",
];

if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (tools, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS policy violation: origin not permitted"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Session-Id"],
  exposedHeaders: ["X-Session-Id"],
};

app.use(cors(corsOptions));

/* =======================
   PREFLIGHT HANDLER
======================= */
app.options(/.*/, cors(corsOptions));

/* =======================
   RATE LIMITING
======================= */
// Dedicated throttles for expensive AI / LLM processing
app.use("/api/ai", aiLimiter);
app.use("/api/ai-chat", aiLimiter);
app.use("/api/coach", aiLimiter);
app.use("/api/ai-timetable", aiLimiter);

// General API Rate Limiting (180 req/min per IP)
app.use("/api", apiLimiter);

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);
app.use("/api/templates", publicTemplateRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/calories", calorieRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/workout-logs", workoutLogRoutes);
app.use("/api/ai-timetable", aiTimetableRoutes);
app.use("/api/coach", aiCoachRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/dataset", datasetRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/visitors", visitorRoutes);

/* =======================
   SEED GAMIFICATION CATALOG
======================= */
if (process.env.NODE_ENV !== "test") {
  seedGamificationData().catch((err) => console.error("Gamification seed error:", err));
}

/* =======================
   AUTOMATIC STREAK RESET - DAILY CRON JOB
======================= */
if (process.env.NODE_ENV !== "test") {
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
}

/* =======================
   BASE ROUTE
======================= */
app.get("/", (req, res) => {
  res.status(200).send("AI Habit Tracker Backend Running");
});

/* =======================
   SAFE PRODUCTION ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error("[ServerError]", err.message);

  // Handle CORS errors cleanly
  if (err.message && err.message.includes("CORS policy violation")) {
    return res.status(403).json({ message: "Cross-Origin Request Blocked" });
  }

  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    message: isProduction && statusCode === 500 ? "Internal Server Error" : (err.message || "Internal Server Error"),
  });
});

export default app;
