import express from "express";
import { chat, chatWithOpenAI } from "../controllers/rag.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected route - requires authentication
router.post("/chat", protectRoute, chat);

// Alternative OpenAI endpoint
router.post("/chat-openai", protectRoute, chatWithOpenAI);

export default router;
