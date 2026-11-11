import { Hono } from "hono";
import { IcoService } from "../services/ico.service.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";
const icoRouter = new Hono();
const icoService = IcoService.getInstance();
// Public: Get active ICO stage and overall stats
icoRouter.get("/active-round", async (c) => {
    try {
        const round = await icoService.getActiveRound();
        return c.json({ data: round });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to load active ICO round" }, 500);
    }
});
// Public: Get all rounds/stages
icoRouter.get("/rounds", async (c) => {
    try {
        const rounds = await icoService.getAllRounds();
        return c.json({ data: rounds });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to load ICO rounds" }, 500);
    }
});
// Authenticated: Get user purchase history
icoRouter.get("/my-purchases", requireAuth, async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ error: "Unauthorized" }, 401);
        const history = await icoService.getUserPurchases(user.id);
        return c.json({ data: history });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to load purchases" }, 500);
    }
});
// Authenticated: Buy tokens in ICO
const buySchema = z.object({
    roundId: z.string(),
    amountPaid: z.number().positive(),
    currencyPaid: z.string().min(2),
    usdValue: z.number().positive(),
    xrplWalletAddress: z.string().optional(),
});
icoRouter.post("/buy", requireAuth, async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ error: "Unauthorized" }, 401);
        const body = await c.req.json();
        const parsed = buySchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ error: "Invalid purchase details", details: parsed.error }, 400);
        }
        const result = await icoService.recordPurchase(user.id, parsed.data.roundId, parsed.data.amountPaid, parsed.data.currencyPaid, parsed.data.usdValue, parsed.data.xrplWalletAddress);
        return c.json({ data: result });
    }
    catch (error) {
        return c.json({ error: error.message || "Failed to process ICO purchase" }, 400);
    }
});
export default icoRouter;
