import express from "express";
import HabitTemplate from "../models/HabitTemplate.js";

const router = express.Router();

/* GET ALL CATEGORIES */
router.get("/categories", async (req, res) => {
  try {
    const categories = await HabitTemplate.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET TEMPLATES BY CATEGORY */
router.get("/:category", async (req, res) => {
  try {
    const templates = await HabitTemplate.find({
      category: req.params.category,
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
