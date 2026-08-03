import { readFile } from "fs/promises";
import { join } from "path";

export interface ChatTurn {
  sender: "user" | "bot";
  text: string;
}

const FALLBACK_TEXT =
  "I'm having trouble reaching our assistant right now. Please email support@ecohavest.org and our team will be happy to help you.";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class ChatbotService {
  private static instance: ChatbotService;
  private knowledge: string | null = null;

  private constructor() {}

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  /** Test hook: force knowledge to be re-read from disk. */
  public resetKnowledgeCache(): void {
    this.knowledge = null;
  }

  private async loadKnowledge(): Promise<string | null> {
    if (this.knowledge !== null) return this.knowledge;
    const path = process.env.KNOWLEDGE_PATH || join(process.cwd(), "knowledge.md");
    try {
      this.knowledge = await readFile(path, "utf-8");
      return this.knowledge;
    } catch (error) {
      console.error("Chatbot: failed to read knowledge base:", error);
      return null;
    }
  }

  private buildSystemPrompt(knowledge: string): string {
    return `You are the AI support assistant for EcoHarvest (https://ecohavest.org).
Answer the user's questions truthfully and accurately using ONLY the context provided below.
Keep answers short and friendly. Do not make up facts or speak outside the provided context.
If the answer cannot be found in the context, politely say you could not find that information and ask the user to email support@ecohavest.org.

Context:
${knowledge}`;
  }

  async query(message: string, history: ChatTurn[]): Promise<{ text: string }> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const knowledge = await this.loadKnowledge();
    if (!apiKey || !knowledge) {
      return { text: FALLBACK_TEXT };
    }

    // Rolling alias: always points at Google's newest flash-lite model.
    // Pinned versions get retired for new API keys (gemini-2.5-flash-lite 404s).
    const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
    const contents = [
      ...history.slice(-10).map((turn) => ({
        role: turn.sender === "user" ? "user" : "model",
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    try {
      const res = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: this.buildSystemPrompt(knowledge) }] },
          contents,
          generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
        }),
      });

      if (!res.ok) {
        console.error("Chatbot: Gemini returned", res.status, await res.text());
        return { text: FALLBACK_TEXT };
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      return { text: text || FALLBACK_TEXT };
    } catch (error) {
      console.error("Chatbot: Gemini request failed:", error);
      return { text: FALLBACK_TEXT };
    }
  }
}
