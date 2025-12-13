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

dotenv.config();
connectDB();

const app = express();

/* =======================
   ✅ PRODUCTION CORS FIX
======================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-habit-tracker-eb72-c46m8kh3r.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server & Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔴 VERY IMPORTANT — PRE-FLIGHT
app.options("*", cors());

app.use(express.json());

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/challenge", challengeRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);
app.use("/api/templates", publicTemplateRoutes);

app.get("/", (req, res) => {
  res.send("AI Habit Tracker Backend Running 🚀");
});

export default app;
