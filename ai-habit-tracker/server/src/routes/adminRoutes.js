import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import verifyRole from "../middleware/roleMiddleware.js";
import {
  getAdminDashboard,
  getUsers,
  updateUserRole,
  deleteUser,
  createTemplate,
  deleteTemplate,
} from "../controllers/adminController.js";
import {
  getAnalyticsOverview,
  getAnalyticsUsers,
  getAnalyticsUserById,
  getAnalyticsActivity,
  getDailyUsageAnalytics,
  getFeatureUsageAnalytics,
  getVisitorAnalytics,
} from "../controllers/adminAnalyticsController.js";

const router = express.Router();

// Apply Auth and Admin Role Middleware to all Admin routes
router.use(authMiddleware);
router.use(verifyRole("admin"));

// Dashboard & User Management
router.get("/dashboard", getAdminDashboard);
router.get("/users", getUsers);
router.patch("/users/:id", updateUserRole);
router.delete("/users/:id", deleteUser);

// Habit Templates Management
router.post("/templates", createTemplate);
router.delete("/templates/:id", deleteTemplate);

// Analytics Routes (/api/admin/analytics/*)
router.get("/analytics/overview", getAnalyticsOverview);
router.get("/analytics/users", getAnalyticsUsers);
router.get("/analytics/user/:id", getAnalyticsUserById);
router.get("/analytics/activity", getAnalyticsActivity);
router.get("/analytics/daily-usage", getDailyUsageAnalytics);
router.get("/analytics/feature-usage", getFeatureUsageAnalytics);
router.get("/analytics/visitors", getVisitorAnalytics);

export default router;
