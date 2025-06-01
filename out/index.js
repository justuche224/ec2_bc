import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ensureDirectories } from "./utils/ensureDirectories.js";
import { auth } from "./lib/auth.js";
import { config } from "./config/index.js";
import kycRouter from "./routes/kyc.routes.js";
import walletRouter from "./routes/wallet.routes.js";
import userRouter from "./routes/user.routes.js";
import balanceRouter from "./routes/balance.routes.js";
import depositRouter from "./routes/deposit.routes.js";
import withdrawalRouter from "./routes/withdrawal.routes.js";
import productRouter from "./routes/product.routes.js";
import statsRouter from "./routes/stats.routes.js";
import referralRouter from "./routes/referral.routes.js";
import plansRouter from "./routes/plans.routes.js";
import investmentRouter from "./routes/investment.routes.js";
import transferRouter from "./routes/transfer.routes.js";
import { mailService } from "./services/mail.service.js";
export const app = new Hono();
// Global middleware
app.use("*", logger());
app.use("/api/*", cors(config.cors));
// Routes
app.route("/api/kyc", kycRouter);
app.route("/api/wallet", walletRouter);
app.route("/api/users", userRouter);
app.route("/api/balance", balanceRouter);
app.route("/api/deposit", depositRouter);
app.route("/api/withdrawal", withdrawalRouter);
app.route("/api/products", productRouter);
app.route("/api/stats", statsRouter);
app.route("/api/referrals", referralRouter);
app.route("/api/plans", plansRouter);
app.route("/api/investments", investmentRouter);
app.route("/api/transfers", transferRouter);
// Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});
// Health check
app.get("/", (c) => {
    return c.text("Hello Hono!");
});
app.post("/api/send-welcome-email", async (c) => {
    try {
        const { email, firstName } = await c.req.json();
        if (!email) {
            return c.json({ error: "Email is required" }, 400);
        }
        await mailService.sendWelcomeEmail(email, firstName);
        return c.json({ message: "Welcome email sent successfully." });
    }
    catch (error) {
        console.error("Failed to send welcome email:", error);
        return c.json({ error: "Failed to send welcome email", details: error instanceof Error ? error.message : "Internal server error" }, 500);
    }
});
// Start server
const startServer = async () => {
    try {
        // Ensure all required storage directories exist
        await ensureDirectories(Object.values(config.storage));
        serve({
            fetch: app.fetch,
            port: Number(config.port),
        }, (info) => {
            console.log(`Server is running on http://localhost:${info.port}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
