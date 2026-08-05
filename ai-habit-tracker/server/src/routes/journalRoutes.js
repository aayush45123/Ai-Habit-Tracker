import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireProfileCompleted from "../middleware/requireProfileCompleted.js";
import {
  getEntryByDate,
  createOrUpdateEntry,
  getEntries,
  deleteEntry,
  getTemplates,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  getAnalytics,
  getWeeklyReport,
  getMonthlyReport,
} from "../controllers/journalController.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireProfileCompleted);

// Entries APIs
router.get("/entries", getEntries);
router.get("/entries/date/:date", getEntryByDate);
router.post("/entries", createOrUpdateEntry);
router.delete("/entries/:id", deleteEntry);

// Template APIs
router.get("/templates", getTemplates);
router.post("/templates", createCustomTemplate);
router.patch("/templates/:id", updateCustomTemplate);
router.delete("/templates/:id", deleteCustomTemplate);

// Analytics & Reports
router.get("/analytics", getAnalytics);
router.get("/reports/weekly", getWeeklyReport);
router.get("/reports/monthly", getMonthlyReport);

export default router;
