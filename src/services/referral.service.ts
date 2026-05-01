import { eq, and, or } from "drizzle-orm";
import db from "../db/index.js";
import { referrals, user } from "../db/schema.js";
import { BalanceService } from "./balance.service.js";

export class ReferralService {
  private static instance: ReferralService;
  private balanceService: BalanceService;
  
  private constructor() {
    this.balanceService = BalanceService.getInstance();
  }

  public static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  async createReferral(referrerId: string, referreeId: string) {

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
        createdAt: new Date(),
    });

    try {
      await this.balanceService.incrementBalance(referrerId, "USDT", "50");
    } catch (error) {
      console.error("Failed to reward referrer:", error);
    }

    return { success: true, message: "Referral created and reward processed" };
  }

  async getReferralsByReferrerId(referrerId: string) {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));
  }

  async getReferralsByReferreeId(referreeId: string) {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referreeId, referreeId));
  }

  async getReferralStats(userId: string) {
    const userReferrals = await this.getReferralsByReferrerId(userId);
    const totalReferrals = userReferrals.length;
    const totalRewards = userReferrals.reduce(
      (sum, r) => sum + BigInt(r.rewardAmount || "50"),
      BigInt(0)
    ).toString();

    return {
      totalReferrals,
      totalRewards,
      currency: "USDT",
    };
  }

  async adminCreateReferral(
    referrerId: string,
    referreeId: string,
    rewardAmount: string,
    adjustBalance: boolean
  ) {
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
      } catch (error) {
        console.error("Failed to adjust referrer balance:", error);
      }
    }

    return result[0];
  }

  async deleteReferral(referralId: string) {
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
}