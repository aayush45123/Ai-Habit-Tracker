import express from "express";
import HabitTemplate from "../models/HabitTemplate.js";
import auth from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

/* GET ALL TEMPLATES */
router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const templates = await HabitTemplate.find().sort({ category: 1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET ALL CATEGORIES */
router.get("/categories", auth, isAdmin, async (req, res) => {
  try {
    const categories = await HabitTemplate.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ADD TEMPLATE */
router.post("/", auth, isAdmin, async (req, res) => {
  try {
    const newTemp = new HabitTemplate(req.body);
    await newTemp.save();
    res.json(newTemp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* UPDATE TEMPLATE */
router.put("/:id", auth, isAdmin, async (req, res) => {
  try {
    const updated = await HabitTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE TEMPLATE */
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    await HabitTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
