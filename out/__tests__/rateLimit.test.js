import { describe, expect, it } from '@jest/globals';
import { Hono } from 'hono';
import { createRateLimiter } from '../middleware/rateLimit.js';
function buildApp(limit) {
    const app = new Hono();
    app.use('*', createRateLimiter({ limit, windowMs: 60000 }));
    app.get('/ping', (c) => c.json({ ok: true }));
    return app;
}
describe('createRateLimiter', () => {
    it('allows requests under the limit', async () => {
        const app = buildApp(3);
        for (let i = 0; i < 3; i++) {
            const res = await app.request('/ping', { headers: { 'x-forwarded-for': '1.2.3.4' } });
            expect(res.status).toBe(200);
        }
    });
    it('returns 429 once the limit is exceeded', async () => {
        const app = buildApp(3);
        for (let i = 0; i < 3; i++) {
            await app.request('/ping', { headers: { 'x-forwarded-for': '1.2.3.4' } });
        }
        const res = await app.request('/ping', { headers: { 'x-forwarded-for': '1.2.3.4' } });
        expect(res.status).toBe(429);
        const body = (await res.json());
        expect(body.error).toBeTruthy();
    });
    it('tracks different IPs independently', async () => {
        const app = buildApp(1);
        await app.request('/ping', { headers: { 'x-forwarded-for': '1.1.1.1' } });
        const res = await app.request('/ping', { headers: { 'x-forwarded-for': '2.2.2.2' } });
        expect(res.status).toBe(200);
    });
});
