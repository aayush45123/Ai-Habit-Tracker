import express from "express";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

router.get("/test", (req, res) => {
  res.send("Auth route working!!!");
});

export default router;
