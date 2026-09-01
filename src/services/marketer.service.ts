import db from "../db/index.js";
import { 
  marketers, 
  marketerReferrals, 
  marketerCommissions, 
  marketerSettings,
  user
} from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

export const MarketerService = {
  async generateMarketerCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let code = "";

    while (!isUnique) {
      code = "ECO-";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await db.query.marketers.findFirst({
        where: eq(marketers.marketerCode, code),
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return code;
  },

  async getGlobalSettings() {
    let settings = await db.query.marketerSettings.findFirst();
    if (!settings) {
      // Create default if it doesn't exist
      const [newSettings] = await db.insert(marketerSettings).values({}).returning();
      settings = newSettings;
    }
    return settings;
  },

  async creditDepositCommission(depositId: string, userId: string, amount: number) {
    // 1. Check if user is referred
    const referral = await db.query.marketerReferrals.findFirst({
      where: and(
        eq(marketerReferrals.userId, userId),
        eq(marketerReferrals.isActive, true)
      ),
      with: {
        marketer: true
      }
    });

    if (!referral || referral.marketer.status !== "ACTIVE") {
      return null;
    }

    // 2. Get commission rate
    const settings = await this.getGlobalSettings();
    const percentage = settings.depositCommissionPercent;
    
    // 3. Calculate commission amount
    const commissionAmount = amount * (percentage / 100);

    // 4. Record commission
    const [commission] = await db.insert(marketerCommissions).values({
      marketerId: referral.marketerId,
      sourceType: "DEPOSIT",
      sourceId: depositId,
      userId: userId,
      amount: commissionAmount,
      percentage: percentage,
      status: "PENDING", // By default it's pending until maybe paid out, or maybe credited automatically. We'll set to CREDITED for simplicity or leave PENDING for admin to payout.
    }).returning();

    return commission;
  },

  async creditPurchaseCommission(purchaseId: string, userId: string, amount: number, itemType: "BOOK" | "COURSE", marketerCode: string) {
    // 1. Find marketer by code
    const marketer = await db.query.marketers.findFirst({
      where: eq(marketers.marketerCode, marketerCode),
    });

    if (!marketer || marketer.status !== "ACTIVE") {
      return null;
    }

    // 2. Get commission rate
    const settings = await this.getGlobalSettings();
    const percentage = itemType === "BOOK" ? settings.bookCommissionPercent : settings.courseCommissionPercent;

    // 3. Calculate commission amount
    const commissionAmount = amount * (percentage / 100);

    // 4. Record commission
    const [commission] = await db.insert(marketerCommissions).values({
      marketerId: marketer.id,
      sourceType: itemType,
      sourceId: purchaseId,
      userId: userId,
      amount: commissionAmount,
      percentage: percentage,
      status: "PENDING",
    }).returning();

    return commission;
  },

  async activateReferral(userId: string) {
    await db.update(marketerReferrals)
      .set({ isActive: true })
      .where(eq(marketerReferrals.userId, userId));
  },

  async approveCommissionForSource(sourceId: string) {
    await db.update(marketerCommissions)
      .set({ status: "CREDITED" })
      .where(eq(marketerCommissions.sourceId, sourceId));
  }
};
