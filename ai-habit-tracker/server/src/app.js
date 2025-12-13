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
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / server-to-server
      if (!origin) return callback(null, true);

      // Allow localhost
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow ALL Vercel deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Block others silently
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.status(200).send("AI Habit Tracker Backend Running 🚀");
});

export default app;
