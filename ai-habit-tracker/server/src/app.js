import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =======================
   ✅ PREFLIGHT FIX (NODE 22 SAFE)
======================= */
app.options(/.*/, cors());

/* =======================
   ROUTES - FIXED CALORIE PATH
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);
app.use("/api/templates", publicTemplateRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/calories", calorieRoutes); // ✅ Changed from /calorie to /calories

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.status(200).send("AI Habit Tracker Backend Running 🚀");
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
