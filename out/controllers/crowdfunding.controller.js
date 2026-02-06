import { CrowdfundingService } from "../services/crowdfunding.service.js";
import { z } from "zod";
const crowdfundingService = CrowdfundingService.getInstance();
// Input validation schemas
const updateSettingsSchema = z.object({
    minInvestmentAmount: z.number().min(0).optional(),
    requiredReferrals: z.number().min(1).optional(),
    systemTargetParticipants: z.number().min(1).optional(),
    poolTargetParticipants: z.number().min(1).optional(),
    referralBonusPercent: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
});
const createPoolSchema = z.object({
    name: z.string().min(1, "Pool name is required"),
    description: z.string().optional(),
    beneficiaryFor: z.string().optional(),
    targetParticipants: z.number().min(1).optional(),
    minInvestmentAmount: z
        .number()
        .min(0, "Minimum investment must be non-negative"),
});
const updatePoolSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    beneficiaryFor: z.string().optional(),
    targetParticipants: z.number().min(1).optional(),
    currentParticipants: z.number().min(0).optional(),
    totalInvested: z.number().min(0).optional(),
    minInvestmentAmount: z.number().min(0).optional(),
    status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});
const joinPoolSchema = z.object({
    currency: z.enum(["BTC", "ETH", "USDT", "SOL", "BNB", "LTC"]),
    amount: z.number().min(0, "Amount must be non-negative"),
});
const updateInvestmentSchema = z.object({
    currentProfit: z.number().min(0).optional(),
    status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
    completedReferrals: z.number().min(0).optional(),
    isEligibleForAirdrop: z.boolean().optional(),
});
const uuidSchema = z.string().uuid("Invalid ID format");
export class CrowdfundingController {
    // ==================== SETTINGS ====================
    static async getSettings(c) {
        try {
            const settings = await crowdfundingService.getSettings();
            return c.json({ data: settings }, 200);
        }
        catch (error) {
            console.error("Error getting crowdfunding settings:", error);
            return c.json({ error: "Failed to get settings" }, 500);
        }
    }
    static async updateSettings(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const body = await c.req.json();
            const validationResult = updateSettingsSchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const result = await crowdfundingService.updateSettings(validationResult.data);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error updating crowdfunding settings:", error);
            return c.json({ error: "Failed to update settings" }, 500);
        }
    }
    // ==================== POOLS ====================
    static async getAllPools(c) {
        try {
            const pools = await crowdfundingService.getAllPools();
            return c.json({ data: pools }, 200);
        }
        catch (error) {
            console.error("Error getting pools:", error);
            return c.json({ error: "Failed to get pools" }, 500);
        }
    }
    static async getPool(c) {
        try {
            const poolId = c.req.param("id");
            const idValidation = uuidSchema.safeParse(poolId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid pool ID format" }, 400);
            }
            const pool = await crowdfundingService.getPool(idValidation.data);
            if (!pool) {
                return c.json({ error: "Pool not found" }, 404);
            }
            return c.json({ data: pool }, 200);
        }
        catch (error) {
            console.error("Error getting pool:", error);
            return c.json({ error: "Failed to get pool" }, 500);
        }
    }
    static async createPool(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const body = await c.req.json();
            const validationResult = createPoolSchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const result = await crowdfundingService.createPool(Object.assign(Object.assign({}, validationResult.data), { targetParticipants: validationResult.data.targetParticipants || 100 }));
            return c.json(result, 201);
        }
        catch (error) {
            console.error("Error creating pool:", error);
            return c.json({ error: "Failed to create pool" }, 500);
        }
    }
    static async updatePool(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const poolId = c.req.param("id");
            const idValidation = uuidSchema.safeParse(poolId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid pool ID format" }, 400);
            }
            const body = await c.req.json();
            const validationResult = updatePoolSchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const result = await crowdfundingService.updatePool(idValidation.data, validationResult.data);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error updating pool:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update pool";
            const statusCode = errorMessage.includes("not found") ? 404 : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    static async deletePool(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const poolId = c.req.param("id");
            const idValidation = uuidSchema.safeParse(poolId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid pool ID format" }, 400);
            }
            const result = await crowdfundingService.deletePool(idValidation.data);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error deleting pool:", error);
            return c.json({ error: "Failed to delete pool" }, 500);
        }
    }
    // ==================== INVESTMENTS ====================
    static async joinPool(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const poolId = c.req.param("id");
            const idValidation = uuidSchema.safeParse(poolId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid pool ID format" }, 400);
            }
            const body = await c.req.json();
            const validationResult = joinPoolSchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const { currency, amount } = validationResult.data;
            const result = await crowdfundingService.joinPool(user.id, idValidation.data, currency, amount);
            return c.json(result, 201);
        }
        catch (error) {
            console.error("Error joining pool:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to join pool";
            const statusCode = errorMessage.includes("Insufficient") ||
                errorMessage.includes("not found") ||
                errorMessage.includes("Minimum")
                ? 400
                : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    static async getUserInvestments(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const investments = await crowdfundingService.getUserInvestments(user.id);
            return c.json({ data: investments }, 200);
        }
        catch (error) {
            console.error("Error getting user investments:", error);
            return c.json({ error: "Failed to get investments" }, 500);
        }
    }
    static async getAllInvestments(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const investments = await crowdfundingService.getAllInvestments();
            return c.json({ data: investments }, 200);
        }
        catch (error) {
            console.error("Error getting all investments:", error);
            return c.json({ error: "Failed to get investments" }, 500);
        }
    }
    static async updateInvestment(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const investmentId = c.req.param("id");
            const idValidation = uuidSchema.safeParse(investmentId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid investment ID format" }, 400);
            }
            const body = await c.req.json();
            const validationResult = updateInvestmentSchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const result = await crowdfundingService.updateInvestment(idValidation.data, validationResult.data);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error updating investment:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update investment";
            const statusCode = errorMessage.includes("not found") ? 404 : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    // ==================== REFERRALS ====================
    static async getUserReferrals(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const referrals = await crowdfundingService.getUserReferrals(user.id);
            return c.json({ data: referrals }, 200);
        }
        catch (error) {
            console.error("Error getting user referrals:", error);
            return c.json({ error: "Failed to get referrals" }, 500);
        }
    }
    static async createReferral(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const body = await c.req.json();
            const { referreeId, investmentId } = body;
            if (!referreeId) {
                return c.json({ error: "Referree ID is required" }, 400);
            }
            const idValidation = uuidSchema.safeParse(referreeId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid referree ID format" }, 400);
            }
            const result = await crowdfundingService.createCrowdfundingReferral(user.id, idValidation.data, investmentId);
            return c.json(result, 201);
        }
        catch (error) {
            console.error("Error creating referral:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create referral";
            const statusCode = errorMessage.includes("must invest") ||
                errorMessage.includes("already exists")
                ? 400
                : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    static async markReferralComplete(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Forbidden: Admin access required" }, 403);
            }
            const referralId = c.req.param("id");
            const idValidation = uuidSchema.safeParse(referralId);
            if (!idValidation.success) {
                return c.json({ error: "Invalid referral ID format" }, 400);
            }
            const result = await crowdfundingService.markReferralComplete(idValidation.data);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error marking referral complete:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to mark referral complete";
            const statusCode = errorMessage.includes("not found") || errorMessage.includes("already")
                ? 400
                : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    // ==================== STATS ====================
    static async getSystemStats(c) {
        try {
            const stats = await crowdfundingService.getSystemStats();
            return c.json({ data: stats }, 200);
        }
        catch (error) {
            console.error("Error getting system stats:", error);
            return c.json({ error: "Failed to get stats" }, 500);
        }
    }
}
