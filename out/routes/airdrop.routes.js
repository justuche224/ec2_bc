import { Hono } from "hono";
import { AirdropService } from "../services/airdrop.service.js";
import { requireAuth } from "../middleware/auth.js";
import { auth } from "../lib/auth.js";
import { z } from "zod";
const airdropRouter = new Hono();
const airdropService = AirdropService.getInstance();
// Helper to extract session user for public/optional-auth routes
async function getOptionalUser(c) {
    try {
        const session = await auth.api.getSession(c.req.raw);
        if (session === null || session === void 0 ? void 0 : session.user)
            return session.user;
    }
    catch (_a) { }
    try {
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });
        if (session === null || session === void 0 ? void 0 : session.user)
            return session.user;
    }
    catch (_b) { }
    return null;
}
// Public: Get global airdrop stats and leaderboard (with user profile if logged in)
airdropRouter.get("/stats", async (c) => {
    try {
        const user = await getOptionalUser(c);
        const queryUserId = c.req.query("userId");
        const targetUserId = (user === null || user === void 0 ? void 0 : user.id) || (typeof queryUserId === "string" && queryUserId.length > 5 ? queryUserId : undefined);
        const stats = await airdropService.getStats(targetUserId);
        return c.json({ data: stats });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to load airdrop stats" }, 500);
    }
});
// Public / Authenticated: Get tasks (returns completion status if logged in)
airdropRouter.get("/tasks", async (c) => {
    try {
        const user = await getOptionalUser(c);
        const queryUserId = c.req.query("userId");
        const targetUserId = (user === null || user === void 0 ? void 0 : user.id) || (typeof queryUserId === "string" && queryUserId.length > 5 ? queryUserId : undefined);
        const tasks = await airdropService.getTasks(targetUserId);
        return c.json({ data: tasks });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to load tasks" }, 500);
    }
});
// Authenticated: Complete a task
airdropRouter.post("/tasks/:id/claim", requireAuth, async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ error: "Unauthorized" }, 401);
        const taskId = c.req.param("id");
        const body = await c.req.json().catch(() => ({}));
        const result = await airdropService.completeTask(user.id, taskId, body.metadata);
        return c.json({ data: result });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to claim task" }, 400);
    }
});
// Authenticated: Daily streak check-in faucet
airdropRouter.post("/daily-checkin", requireAuth, async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ error: "Unauthorized" }, 401);
        const result = await airdropService.dailyCheckin(user.id);
        return c.json({ data: result });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to claim daily reward" }, 400);
    }
});
// Authenticated: Save / bind XRPL wallet address
const walletSchema = z.object({
    address: z.string().min(25).max(35),
    destinationTag: z.string().optional(),
});
airdropRouter.post("/wallet", requireAuth, async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ error: "Unauthorized" }, 401);
        const body = await c.req.json();
        const parsed = walletSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ error: "Invalid XRPL address. Must be a valid 'r...' address." }, 400);
        }
        const result = await airdropService.saveWallet(user.id, parsed.data.address, parsed.data.destinationTag);
        return c.json({ data: result });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to save wallet" }, 400);
    }
});
export default airdropRouter;
