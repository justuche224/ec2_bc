import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { join } from 'path';
import { Hono } from 'hono';
import chatbotRouter from '../routes/chatbot.routes.js';
import { ChatbotService } from '../services/chatbot.service.js';

function buildApp() {
  const app = new Hono();
  app.route('/api/chatbot', chatbotRouter);
  return app;
}

function post(app: Hono, body: unknown, ip = '9.9.9.9') {
  return app.request('/api/chatbot/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

// chatbot.routes.ts builds its rate limiter at module load, so the limiter's
// buckets persist across tests in this file. The rate-limit test uses its own
// IP (5.5.5.5); all other tests share 9.9.9.9 and must stay under 10 requests
// total for that IP across the whole file.
describe('POST /api/chatbot/query', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.KNOWLEDGE_PATH = join(process.cwd(), 'src', '__tests__', 'fixtures', 'knowledge.md');
    ChatbotService.getInstance().resetKnowledgeCache();
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'hi there' }] } }] }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns the bot reply for a valid request', async () => {
    const app = buildApp();
    const res = await post(app, { message: 'hello', history: [] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'hi there' });
  });

  it('rejects a missing message with 400', async () => {
    const app = buildApp();
    const res = await post(app, { history: [] });
    expect(res.status).toBe(400);
  });

  it('rejects an oversized message with 400', async () => {
    const app = buildApp();
    const res = await post(app, { message: 'x'.repeat(1001), history: [] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid JSON with 400', async () => {
    const app = buildApp();
    const res = await app.request('/api/chatbot/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '9.9.9.9' },
      body: 'not json',
    });
    expect(res.status).toBe(400);
  });

  it('ignores malformed history entries instead of failing', async () => {
    const app = buildApp();
    const res = await post(app, {
      message: 'hello',
      history: [{ sender: 'user', text: 'ok' }, { bogus: true }, 'junk', { sender: 'evil', text: 'x' }],
    });
    expect(res.status).toBe(200);
  });

  it('rate limits after 10 requests from the same IP', async () => {
    const app = buildApp();
    for (let i = 0; i < 10; i++) {
      const res = await post(app, { message: 'hello', history: [] }, '5.5.5.5');
      expect(res.status).toBe(200);
    }
    const res = await post(app, { message: 'hello', history: [] }, '5.5.5.5');
    expect(res.status).toBe(429);
  });
});
