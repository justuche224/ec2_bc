import type { Context } from "hono";
import { ChatbotService, type ChatTurn } from "../services/chatbot.service.js";

const chatbotService = ChatbotService.getInstance();

function isChatTurn(value: unknown): value is ChatTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Record<string, unknown>;
  return (
    (turn.sender === "user" || turn.sender === "bot") &&
    typeof turn.text === "string"
  );
}

export class ChatbotController {
  static async query(c: Context) {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { message, history } = (body ?? {}) as {
      message?: unknown;
      history?: unknown;
    };

    if (typeof message !== "string" || message.trim().length === 0) {
      return c.json({ error: "message is required" }, 400);
    }
    if (message.length > 1000) {
      return c.json({ error: "message is too long (max 1000 characters)" }, 400);
    }

    const cleanHistory: ChatTurn[] = (Array.isArray(history) ? history : [])
      .slice(-50)
      .filter(isChatTurn);

    const result = await chatbotService.query(message.trim(), cleanHistory);
    return c.json(result, 200);
  }
}
