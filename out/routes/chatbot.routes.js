import { Hono } from "hono";
import { ChatbotController } from "../controllers/chatbot.controller.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
const chatbotRouter = new Hono();
// Public endpoint guarding a free-tier Gemini quota — keep the limit tight.
chatbotRouter.use("*", createRateLimiter({ limit: 10, windowMs: 60000 }));
chatbotRouter.post("/query", ChatbotController.query);
export default chatbotRouter;
