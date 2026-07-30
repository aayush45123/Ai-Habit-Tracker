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

export default router;
