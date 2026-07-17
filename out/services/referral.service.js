import { eq, and, or } from "drizzle-orm";
import db from "../db/index.js";
import { referrals, user } from "../db/schema.js";
import { BalanceService } from "./balance.service.js";
export class ReferralService {
    constructor() {
        this.balanceService = BalanceService.getInstance();
    }
    static getInstance() {
        if (!ReferralService.instance) {
            ReferralService.instance = new ReferralService();
        }
        return ReferralService.instance;
    }
    async createReferral(referrerId, referreeId) {
        const referrer = await db
            .select()
            .from(user)
            .where(eq(user.id, referrerId));
        if (referrer.length === 0) {
            throw new Error("Referrer not found");
        }
        const existingReferral = await db
            .select()
            .from(referrals)
            .where(or(and(eq(referrals.referrerId, referrerId), eq(referrals.referreeId, referreeId)), and(eq(referrals.referrerId, referreeId), eq(referrals.referreeId, referrerId))));
        if (existingReferral.length > 0) {
            throw new Error("Referral already exists");
        }
        await db.insert(referrals).values({
            referrerId,
            referreeId,
            status: "PENDING",
            createdAt: new Date(),
        });
        return { success: true, message: "Referral created. Commission is pending." };
    }
    async getReferralsByReferrerId(referrerId) {
        return await db
            .select()
            .from(referrals)
            .where(eq(referrals.referrerId, referrerId));
    }
    async getReferralsByReferreeId(referreeId) {
        return await db
            .select()
            .from(referrals)
            .where(eq(referrals.referreeId, referreeId));
    }
    async getReferralStats(userId) {
        const userReferrals = await this.getReferralsByReferrerId(userId);
        const totalReferrals = userReferrals.length;
        const totalRewards = userReferrals.reduce((sum, r) => sum + BigInt(r.rewardAmount || "50"), BigInt(0)).toString();
        // Calculate Rank
        let rank = "Bronze Affiliate";
        if (totalReferrals >= 500)
            rank = "Ambassador";
        else if (totalReferrals >= 100)
            rank = "Diamond Affiliate";
        else if (totalReferrals >= 50)
            rank = "Platinum Affiliate";
        else if (totalReferrals >= 20)
            rank = "Gold Affiliate";
        else if (totalReferrals >= 5)
            rank = "Silver Affiliate";
        return {
            totalReferrals,
            totalRewards,
            currency: "USDT",
            rank,
        };
    }
    async adminCreateReferral(referrerId, referreeId, rewardAmount, adjustBalance) {
        const referrer = await db
            .select()
            .from(user)
            .where(eq(user.id, referrerId));
        if (referrer.length === 0) {
            throw new Error("Referrer not found");
        }
        const referree = await db
            .select()
            .from(user)
            .where(eq(user.id, referreeId));
        if (referree.length === 0) {
            throw new Error("Referree not found");
        }
        const result = await db
            .insert(referrals)
            .values({
            referrerId,
            referreeId,
            rewardAmount,
            createdAt: new Date(),
        })
            .returning();
        if (adjustBalance && BigInt(rewardAmount) > 0) {
            try {
                await this.balanceService.incrementBalance(referrerId, "USDT", rewardAmount);
            }
            catch (error) {
                console.error("Failed to adjust referrer balance:", error);
            }
        }
        return result[0];
    }
    async deleteReferral(referralId) {
        const result = await db
            .select()
            .from(referrals)
            .where(eq(referrals.id, referralId))
            .limit(1);
        if (!result[0]) {
            throw new Error("Referral not found");
        }
        await db.delete(referrals).where(eq(referrals.id, referralId));
        return { success: true };
    }
    async getPendingCommissions(userId) {
        const pendingReferrals = await db
            .select()
            .from(referrals)
            .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "PENDING")));
        const totalPending = pendingReferrals.reduce((sum, r) => sum + BigInt(r.rewardAmount || "50"), BigInt(0)).toString();
        return {
            totalPending,
            pendingCount: pendingReferrals.length,
            currency: "USDT",
            referrals: pendingReferrals,
        };
    }
    async withdrawCommissions(userId) {
        const pendingReferrals = await db
            .select()
            .from(referrals)
            .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "PENDING")));
        if (pendingReferrals.length === 0) {
            throw new Error("No pending commissions to withdraw");
        }
        const totalReward = pendingReferrals.reduce((sum, r) => sum + BigInt(r.rewardAmount || "50"), BigInt(0)).toString();
        // Mark them as REQUESTED
        await db
            .update(referrals)
            .set({ status: "REQUESTED" })
            .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "PENDING")));
        return {
            success: true,
            message: `Successfully requested withdrawal of ${totalReward} USDT. Pending admin approval.`,
            amount: totalReward,
        };
    }
    async getRequestedCommissions() {
        // Returns users with REQUESTED commissions and their totals
        const requestedReferrals = await db
            .select({
            id: referrals.id,
            referrerId: referrals.referrerId,
            rewardAmount: referrals.rewardAmount,
            createdAt: referrals.createdAt,
        })
            .from(referrals)
            .where(eq(referrals.status, "REQUESTED"));
        return requestedReferrals;
    }
    async approveCommission(referralId) {
        const referralResult = await db
            .select()
            .from(referrals)
            .where(and(eq(referrals.id, referralId), eq(referrals.status, "REQUESTED")))
            .limit(1);
        const ref = referralResult[0];
        if (!ref) {
            throw new Error("Commission request not found or already processed");
        }
        await db
            .update(referrals)
            .set({ status: "PAID" })
            .where(eq(referrals.id, referralId));
        try {
            await this.balanceService.incrementBalance(ref.referrerId, "USDT", ref.rewardAmount || "50");
        }
        catch (error) {
            console.error("Failed to add balance on commission approval:", error);
            throw new Error("Failed to process commission payment");
        }
        return { success: true, message: "Commission approved and paid" };
    }
}
