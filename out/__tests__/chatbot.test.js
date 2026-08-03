import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { join } from 'path';
import { ChatbotService } from '../services/chatbot.service.js';
const FIXTURE_PATH = join(process.cwd(), 'src', '__tests__', 'fixtures', 'knowledge.md');
function geminiOk(text) {
    return {
        ok: true,
        json: async () => ({
            candidates: [{ content: { parts: [{ text }] } }],
        }),
    };
}
describe('ChatbotService', () => {
    const service = ChatbotService.getInstance();
    let fetchMock;
    beforeEach(() => {
        process.env.GEMINI_API_KEY = 'test-key';
        process.env.KNOWLEDGE_PATH = FIXTURE_PATH;
        delete process.env.GEMINI_MODEL;
        delete process.env.GOOGLE_API_KEY;
        service.resetKnowledgeCache();
        fetchMock = jest.fn();
        global.fetch = fetchMock;
    });
    it('returns Gemini reply text on success', async () => {
        fetchMock.mockResolvedValue(geminiOk('Withdrawals take 24 hours.'));
        const result = await service.query('How long do withdrawals take?', []);
        expect(result.text).toBe('Withdrawals take 24 hours.');
    });
    it('sends knowledge in systemInstruction and maps history roles', async () => {
        fetchMock.mockResolvedValue(geminiOk('ok'));
        await service.query('follow-up', [
            { sender: 'user', text: 'hi' },
            { sender: 'bot', text: 'hello' },
        ]);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toContain('gemini-flash-lite-latest:generateContent');
        const body = JSON.parse(init.body);
        expect(body.systemInstruction.parts[0].text).toContain('EcoHarvest Test Knowledge');
        expect(body.contents).toEqual([
            { role: 'user', parts: [{ text: 'hi' }] },
            { role: 'model', parts: [{ text: 'hello' }] },
            { role: 'user', parts: [{ text: 'follow-up' }] },
        ]);
        expect(init.headers['x-goog-api-key']).toBe('test-key');
    });
    it('trims history to the last 10 turns', async () => {
        fetchMock.mockResolvedValue(geminiOk('ok'));
        const history = Array.from({ length: 30 }, (_, i) => ({
            sender: (i % 2 === 0 ? 'user' : 'bot'),
            text: `turn ${i}`,
        }));
        await service.query('latest', history);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.contents).toHaveLength(11); // 10 history turns + current message
        expect(body.contents[0].parts[0].text).toBe('turn 20');
    });
    it('falls back to support message when fetch rejects', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));
        const result = await service.query('anything', []);
        expect(result.text).toContain('support@ecohavest.org');
    });
    it('falls back when Gemini returns a non-OK response', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 429,
            text: async () => 'quota exceeded',
        });
        const result = await service.query('anything', []);
        expect(result.text).toContain('support@ecohavest.org');
    });
    it('falls back without calling Gemini when API key is missing', async () => {
        delete process.env.GEMINI_API_KEY;
        const result = await service.query('anything', []);
        expect(result.text).toContain('support@ecohavest.org');
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it('accepts GOOGLE_API_KEY as an alternative key name', async () => {
        delete process.env.GEMINI_API_KEY;
        process.env.GOOGLE_API_KEY = 'google-key';
        fetchMock.mockResolvedValue(geminiOk('works'));
        const result = await service.query('hello', []);
        expect(result.text).toBe('works');
        const [, init] = fetchMock.mock.calls[0];
        expect(init.headers['x-goog-api-key']).toBe('google-key');
    });
    it('falls back when the knowledge file cannot be read', async () => {
        process.env.KNOWLEDGE_PATH = '/nonexistent/knowledge.md';
        const result = await service.query('anything', []);
        expect(result.text).toContain('support@ecohavest.org');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
