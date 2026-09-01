import { marketerAuth } from "../lib/marketer-auth.js";
import db from "../db/index.js";
import { marketers } from "../db/schema.js";
import { eq } from "drizzle-orm";
export const requireMarketer = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
    }
    const token = authHeader.split(" ")[1];
    const decoded = marketerAuth.verifyToken(token);
    if (!decoded) {
        return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }
    try {
        const marketerRecord = await db.query.marketers.findFirst({
            where: eq(marketers.id, decoded.id),
        });
        if (!marketerRecord) {
            return c.json({ error: "Unauthorized: Marketer not found" }, 401);
        }
        if (marketerRecord.status === "SUSPENDED") {
            return c.json({ error: "Forbidden: Marketer account is suspended" }, 403);
        }
        // Attach marketer to context
        c.set("marketer", marketerRecord);
        await next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
