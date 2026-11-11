import db from "../db/index.js";
import { icoRounds, icoPurchases, user } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { BalanceService } from "./balance.service.js";
import type { Currency } from "./wallet.service.js";

const balanceService = BalanceService.getInstance();

export class IcoService {
  private static instance: IcoService;

  public static getInstance(): IcoService {
    if (!IcoService.instance) {
      IcoService.instance = new IcoService();
    }
    return IcoService.instance;
  }

  // Get active ICO stage/round with real dynamic sum
  async getActiveRound() {
    const rounds = await db
      .select()
      .from(icoRounds)
      .where(eq(icoRounds.status, "ACTIVE"))
      .orderBy(icoRounds.stageNumber)
      .limit(1);

    if (rounds.length === 0) {
      // Fallback: return most recent round
      const fallback = await db
        .select()
        .from(icoRounds)
        .orderBy(desc(icoRounds.stageNumber))
        .limit(1);
      return fallback[0] || null;
    }

    const round = rounds[0];

    // Compute actual sold tokens dynamically from real confirmed purchases
    const [purchasesSum] = await db
      .select({
        totalSold: sql<number>`COALESCE(SUM(${icoPurchases.tokensAllocated}), 0)`,
      })
      .from(icoPurchases)
      .where(eq(icoPurchases.roundId, round.id));

    const realSoldTokens = Number(purchasesSum?.totalSold || 0);
    const percentSold = ((realSoldTokens / round.totalTokens) * 100).toFixed(2);
    const hardCapUsd = round.totalTokens * round.priceUsd;
    const raisedUsd = realSoldTokens * round.priceUsd;

    return {
      ...round,
      soldTokens: realSoldTokens,
      percentSold: Number(percentSold),
      hardCapUsd,
      raisedUsd,
    };
  }

  // Get all rounds (for roadmap / stage view)
  async getAllRounds() {
    return await db.select().from(icoRounds).orderBy(icoRounds.stageNumber);
  }

  // Process an ICO purchase
  async recordPurchase(
    userId: string,
    roundId: string,
    amountPaid: number,
    currencyPaid: string,
    usdValue: number,
    xrplWalletAddress?: string
  ) {
    const [round] = await db
      .select()
      .from(icoRounds)
      .where(eq(icoRounds.id, roundId))
      .limit(1);

    if (!round) {
      throw new Error("ICO round not found");
    }

    if (round.status !== "ACTIVE") {
      throw new Error("This ICO stage is currently not accepting purchases");
    }

    if (usdValue < round.minPurchaseUsd) {
      throw new Error(`Minimum purchase amount is $${round.minPurchaseUsd} USD`);
    }

    if (usdValue > round.maxPurchaseUsd) {
      throw new Error(`Maximum purchase amount is $${round.maxPurchaseUsd} USD`);
    }

    // Calculate tokens to allocate: USD value / token price
    const tokensAllocated = usdValue / round.priceUsd;

    // Check remaining supply in this stage
    const [purchasesSum] = await db
      .select({
        totalSold: sql<number>`COALESCE(SUM(${icoPurchases.tokensAllocated}), 0)`,
      })
      .from(icoPurchases)
      .where(eq(icoPurchases.roundId, round.id));

    const currentSold = Number(purchasesSum?.totalSold || 0);
    const remaining = round.totalTokens - currentSold;

    if (tokensAllocated > remaining) {
      throw new Error(
        `Only ${remaining.toLocaleString()} $ECO remaining in this round`
      );
    }

    // Check and deduct user balance from database
    const validCurrencies: Currency[] = ["BTC", "ETH", "USDT", "SOL", "BNB", "LTC"];
    const cur = currencyPaid.toUpperCase() as Currency;

    if (validCurrencies.includes(cur)) {
      const userBalance = await balanceService.getUserBalance(userId, cur);
      const amountString = amountPaid.toString();

      if (
        !userBalance ||
        balanceService.safeAmountToBigInt(userBalance.amount) <
          balanceService.safeAmountToBigInt(amountString)
      ) {
        const available = userBalance ? userBalance.amount : "0";
        throw new Error(
          `Insufficient ${cur} balance (Available: ${available} ${cur}, Required: ${amountPaid} ${cur}). Please deposit funds into your wallet first.`
        );
      }

      // Deduct balance from user wallet
      await balanceService.decrementBalance(userId, cur, amountString);
    }

    // Record purchase
    const [purchase] = await db
      .insert(icoPurchases)
      .values({
        id: crypto.randomUUID(),
        userId,
        roundId,
        tokensAllocated,
        currencyPaid: cur,
        amountPaid,
        usdValue,
        xrplWalletAddress: xrplWalletAddress || null,
        status: "CONFIRMED",
      })
      .returning();

    // Update soldTokens in round
    await db
      .update(icoRounds)
      .set({
        soldTokens: sql`${icoRounds.soldTokens} + ${tokensAllocated}`,
        updatedAt: new Date(),
      })
      .where(eq(icoRounds.id, roundId));

    return {
      success: true,
      purchase,
      tokensAllocated,
    };
  }

  // Get user's purchase history
  async getUserPurchases(userId: string) {
    const purchases = await db
      .select({
        id: icoPurchases.id,
        roundId: icoPurchases.roundId,
        tokensAllocated: icoPurchases.tokensAllocated,
        currencyPaid: icoPurchases.currencyPaid,
        amountPaid: icoPurchases.amountPaid,
        usdValue: icoPurchases.usdValue,
        xrplWalletAddress: icoPurchases.xrplWalletAddress,
        status: icoPurchases.status,
        createdAt: icoPurchases.createdAt,
        roundName: icoRounds.name,
        priceUsd: icoRounds.priceUsd,
      })
      .from(icoPurchases)
      .leftJoin(icoRounds, eq(icoPurchases.roundId, icoRounds.id))
      .where(eq(icoPurchases.userId, userId))
      .orderBy(desc(icoPurchases.createdAt));

    const totalTokensSecured = purchases.reduce(
      (sum, p) => sum + p.tokensAllocated,
      0
    );
    const totalUsdInvested = purchases.reduce((sum, p) => sum + p.usdValue, 0);

    return {
      purchases,
      totalTokensSecured,
      totalUsdInvested,
    };
  }
}
