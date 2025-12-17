import express from "express";
import { getChatHistory, sendMessage } from "../controllers/aiChatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/chat/history", authMiddleware, getChatHistory);
router.post("/chat/message", authMiddleware, sendMessage);

export default router;
