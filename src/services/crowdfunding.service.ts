import { eq, desc, and, sql } from "drizzle-orm";
import db from "../db/index.js";
import {
  crowdfundingSettings,
  crowdfundingPools,
  crowdfundingInvestments,
  crowdfundingReferrals,
  user,
} from "../db/schema.js";
import { BalanceService } from "./balance.service.js";
import type { Currency } from "./wallet.service.js";
import { v4 as uuidv4 } from "uuid";

const balanceService = BalanceService.getInstance();

export class CrowdfundingService {
  private static instance: CrowdfundingService;
  private constructor() {}

  public static getInstance(): CrowdfundingService {
    if (!CrowdfundingService.instance) {
      CrowdfundingService.instance = new CrowdfundingService();
    }
    return CrowdfundingService.instance;
  }

  // ==================== SETTINGS ====================

  async getSettings() {
    const settings = await db.select().from(crowdfundingSettings).limit(1);
    if (settings.length === 0) {
      // Create default settings if none exist
      const newSettings = await db
        .insert(crowdfundingSettings)
        .values({
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return newSettings[0];
    }
    return settings[0];
  }

  async updateSettings(data: {
    minInvestmentAmount?: number;
    requiredReferrals?: number;
    systemTargetParticipants?: number;
    poolTargetParticipants?: number;
    referralBonusPercent?: number;
    isActive?: boolean;
  }) {
    const settings = await this.getSettings();
    await db
      .update(crowdfundingSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(crowdfundingSettings.id, settings.id));
    return { success: true };
  }

  // ==================== POOLS ====================

  async getAllPools() {
    return await db
      .select()
      .from(crowdfundingPools)
      .orderBy(desc(crowdfundingPools.createdAt));
  }

  async getPool(poolId: string) {
    const pool = await db
      .select()
      .from(crowdfundingPools)
      .where(eq(crowdfundingPools.id, poolId))
      .limit(1);
    return pool[0] || null;
  }

  async createPool(data: {
    name: string;
    description?: string;
    beneficiaryFor?: string;
    targetParticipants: number;
    minInvestmentAmount: number;
  }) {
    const newPool = await db
      .insert(crowdfundingPools)
      .values({
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return { success: true, pool: newPool[0] };
  }

  async updatePool(
    poolId: string,
    data: {
      name?: string;
      description?: string;
      beneficiaryFor?: string;
      targetParticipants?: number;
      currentParticipants?: number;
      totalInvested?: number;
      minInvestmentAmount?: number;
      status?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    },
  ) {
    const pool = await this.getPool(poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }
    await db
      .update(crowdfundingPools)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(crowdfundingPools.id, poolId));
    return { success: true };
  }

  async deletePool(poolId: string) {
    await db.delete(crowdfundingPools).where(eq(crowdfundingPools.id, poolId));
    return { success: true };
  }

  // ==================== INVESTMENTS ====================

  async joinPool(
    userId: string,
    poolId: string,
    currency: Currency,
    amount: number,
  ) {
    const pool = await this.getPool(poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }

    if (pool.status !== "PENDING" && pool.status !== "ACTIVE") {
      throw new Error("Pool is not accepting investments");
    }

    if (amount < pool.minInvestmentAmount) {
      throw new Error(`Minimum investment is $${pool.minInvestmentAmount}`);
    }

    // Check user balance
    const userBalance = await balanceService.getUserBalance(userId, currency);
    const amountString = amount.toString();
    if (
      !userBalance ||
      balanceService.safeAmountToBigInt(userBalance.amount) <
        balanceService.safeAmountToBigInt(amountString)
    ) {
      throw new Error(`Insufficient ${currency} balance`);
    }

    // Get current settings for required referrals
    const settings = await this.getSettings();

    // Decrement user balance
    await balanceService.decrementBalance(userId, currency, amountString);

    // Create investment record
    const newInvestment = await db
      .insert(crowdfundingInvestments)
      .values({
        id: uuidv4(),
        userId,
        poolId,
        currency,
        amount,
        requiredReferrals: settings.requiredReferrals,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update pool participant count and total invested
    await db
      .update(crowdfundingPools)
      .set({
        currentParticipants: sql`${crowdfundingPools.currentParticipants} + 1`,
        totalInvested: sql`${crowdfundingPools.totalInvested} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(crowdfundingPools.id, poolId));

    // Check if pool reached target (auto-activate)
    const updatedPool = await this.getPool(poolId);
    if (
      updatedPool &&
      updatedPool.currentParticipants >= updatedPool.targetParticipants &&
      updatedPool.status === "PENDING"
    ) {
      await this.updatePool(poolId, { status: "ACTIVE" });
    }

    return { success: true, investment: newInvestment[0] };
  }

  async getUserInvestments(userId: string) {
    return await db
      .select({
        investment: crowdfundingInvestments,
        poolName: crowdfundingPools.name,
        poolStatus: crowdfundingPools.status,
        poolTargetParticipants: crowdfundingPools.targetParticipants,
        poolCurrentParticipants: crowdfundingPools.currentParticipants,
      })
      .from(crowdfundingInvestments)
      .leftJoin(
        crowdfundingPools,
        eq(crowdfundingInvestments.poolId, crowdfundingPools.id),
      )
      .where(eq(crowdfundingInvestments.userId, userId))
      .orderBy(desc(crowdfundingInvestments.createdAt));
  }

  async getAllInvestments() {
    return await db
      .select({
        investment: crowdfundingInvestments,
        userName: user.name,
        userEmail: user.email,
        poolName: crowdfundingPools.name,
        poolStatus: crowdfundingPools.status,
      })
      .from(crowdfundingInvestments)
      .leftJoin(user, eq(crowdfundingInvestments.userId, user.id))
      .leftJoin(
        crowdfundingPools,
        eq(crowdfundingInvestments.poolId, crowdfundingPools.id),
      )
      .orderBy(desc(crowdfundingInvestments.createdAt));
  }

  async getInvestmentById(investmentId: string) {
    const investment = await db
      .select()
      .from(crowdfundingInvestments)
      .where(eq(crowdfundingInvestments.id, investmentId))
      .limit(1);
    return investment[0] || null;
  }

  async updateInvestment(
    investmentId: string,
    data: {
      currentProfit?: number;
      status?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
      completedReferrals?: number;
      isEligibleForAirdrop?: boolean;
    },
  ) {
    const investment = await this.getInvestmentById(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }
    await db
      .update(crowdfundingInvestments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(crowdfundingInvestments.id, investmentId));
    return { success: true };
  }

  // ==================== REFERRALS ====================

  async getUserReferrals(userId: string) {
    return await db
      .select({
        referral: crowdfundingReferrals,
        referreeName: user.name,
        referreeEmail: user.email,
      })
      .from(crowdfundingReferrals)
      .leftJoin(user, eq(crowdfundingReferrals.referreeId, user.id))
      .where(eq(crowdfundingReferrals.referrerId, userId))
      .orderBy(desc(crowdfundingReferrals.createdAt));
  }

  async createCrowdfundingReferral(
    referrerId: string,
    referreeId: string,
    investmentId?: string,
  ) {
    // Check if referrer has an active investment (must invest before recruiting)
    const referrerInvestments = await this.getUserInvestments(referrerId);
    if (referrerInvestments.length === 0) {
      throw new Error(
        "You must invest in a pool before you can make referrals",
      );
    }

    // Check if referral already exists
    const existingReferral = await db
      .select()
      .from(crowdfundingReferrals)
      .where(
        and(
          eq(crowdfundingReferrals.referrerId, referrerId),
          eq(crowdfundingReferrals.referreeId, referreeId),
        ),
      )
      .limit(1);

    if (existingReferral.length > 0) {
      throw new Error("Referral already exists");
    }

    const newReferral = await db
      .insert(crowdfundingReferrals)
      .values({
        id: uuidv4(),
        referrerId,
        referreeId,
        investmentId,
        createdAt: new Date(),
      })
      .returning();

    return { success: true, referral: newReferral[0] };
  }

  // For signup flow - creates pending referral without requiring referrer to have invested
  async createPendingReferralFromSignup(
    referrerId: string,
    referreeId: string,
  ) {
    // Check if referral already exists
    const existingReferral = await db
      .select()
      .from(crowdfundingReferrals)
      .where(
        and(
          eq(crowdfundingReferrals.referrerId, referrerId),
          eq(crowdfundingReferrals.referreeId, referreeId),
        ),
      )
      .limit(1);

    if (existingReferral.length > 0) {
      // Don't throw error, just return existing referral
      return { success: true, referral: existingReferral[0], existed: true };
    }

    const newReferral = await db
      .insert(crowdfundingReferrals)
      .values({
        id: uuidv4(),
        referrerId,
        referreeId,
        status: "PENDING",
        createdAt: new Date(),
      })
      .returning();

    return { success: true, referral: newReferral[0], existed: false };
  }

  async markReferralComplete(referralId: string) {
    const referral = await db
      .select()
      .from(crowdfundingReferrals)
      .where(eq(crowdfundingReferrals.id, referralId))
      .limit(1);

    if (referral.length === 0) {
      throw new Error("Referral not found");
    }

    if (referral[0].status === "COMPLETED") {
      throw new Error("Referral already completed");
    }

    // Update referral status
    await db
      .update(crowdfundingReferrals)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
      })
      .where(eq(crowdfundingReferrals.id, referralId));

    // Increment referrer's completed referrals count on their investments
    const referrerInvestments = await db
      .select()
      .from(crowdfundingInvestments)
      .where(eq(crowdfundingInvestments.userId, referral[0].referrerId));

    for (const investment of referrerInvestments) {
      const newCompletedCount = investment.completedReferrals + 1;
      const isEligible = newCompletedCount >= investment.requiredReferrals;

      await db
        .update(crowdfundingInvestments)
        .set({
          completedReferrals: newCompletedCount,
          isEligibleForAirdrop: isEligible,
          updatedAt: new Date(),
        })
        .where(eq(crowdfundingInvestments.id, investment.id));
    }

    return { success: true };
  }

  // ==================== STATS ====================

  async getSystemStats() {
    const settings = await this.getSettings();

    // Total participants (unique users with investments)
    const participantsResult = await db
      .select({
        count: sql<number>`count(distinct ${crowdfundingInvestments.userId})`,
      })
      .from(crowdfundingInvestments);

    const totalParticipants = participantsResult[0]?.count || 0;

    // Total invested amount
    const investedResult = await db
      .select({
        total: sql<number>`coalesce(sum(${crowdfundingInvestments.amount}), 0)`,
      })
      .from(crowdfundingInvestments);

    const totalInvested = investedResult[0]?.total || 0;

    // Eligible for airdrop count
    const eligibleResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(crowdfundingInvestments)
      .where(eq(crowdfundingInvestments.isEligibleForAirdrop, true));

    const eligibleForAirdrop = eligibleResult[0]?.count || 0;

    // Active pools count
    const poolsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(crowdfundingPools)
      .where(eq(crowdfundingPools.status, "ACTIVE"));

    const activePools = poolsResult[0]?.count || 0;

    return {
      totalParticipants,
      targetParticipants: settings.systemTargetParticipants,
      progressPercent: Math.min(
        100,
        (totalParticipants / settings.systemTargetParticipants) * 100,
      ),
      totalInvested,
      eligibleForAirdrop,
      activePools,
      isAirdropReady: totalParticipants >= settings.systemTargetParticipants,
    };
  }
}
