import { eq, and } from "drizzle-orm";
import db from "../db/index.js";
import { balance } from "../db/schema.js";
import type { Currency } from "./wallet.service.js";

export class BalanceService {
  private static instance: BalanceService;
  private constructor() {}

  /**
   * Safely convert a decimal amount string to BigInt
   * Multiplies by 10^8 to handle decimals (satoshi precision)
   */
  public safeAmountToBigInt(amount: string): bigint {
    try {
      // Check if amount contains a decimal point
      if (amount.includes('.')) {
        const [whole, decimal = ''] = amount.split('.');
        // Pad or truncate to 8 decimal places (satoshi precision)
        const paddedDecimal = (decimal + '00000000').slice(0, 8);
        const amountStr = whole + paddedDecimal;
        return BigInt(amountStr);
      } else {
        // If no decimal, multiply by 10^8 to maintain consistency
        return BigInt(amount) * BigInt(100000000);
      }
    } catch (error) {
      console.error(`Error converting amount to BigInt: ${amount}`, error);
      return BigInt(0);
    }
  }

  /**
   * Convert BigInt back to decimal string
   */
  public bigIntToAmount(value: bigint): string {
    const valueStr = value.toString();
    if (valueStr === '0') return '0';
    
    // Ensure minimum length for decimal placement
    const paddedValue = valueStr.padStart(9, '0');
    const whole = paddedValue.slice(0, -8) || '0';
    const decimal = paddedValue.slice(-8);
    
    // Remove trailing zeros from decimal part
    const trimmedDecimal = decimal.replace(/0+$/, '');
    
    if (trimmedDecimal === '') {
      return whole;
    }
    return `${whole}.${trimmedDecimal}`;
  }

  public static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService();
    }
    return BalanceService.instance;
  }

  async getUserBalance(userId: string, currency: Currency) {
    const balanceRecord = await db
      .select()
      .from(balance)
      .where(and(eq(balance.userId, userId), eq(balance.currency, currency)))
      .limit(1);

    return balanceRecord[0] || null;
  }

  async getAllUserBalances(userId: string) {
    const balances = await db
      .select()
      .from(balance)
      .where(eq(balance.userId, userId));

    return balances;
  }

  async incrementBalance(userId: string, currency: Currency, amount: string) {
    const existingBalance = await this.getUserBalance(userId, currency);

    if (!existingBalance) {
      // Create new balance record if it doesn't exist
      return await db.insert(balance).values({
        userId,
        currency,
        amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update existing balance
    const currentAmount = this.safeAmountToBigInt(existingBalance.amount);
    const incrementAmount = this.safeAmountToBigInt(amount);
    const newAmount = this.bigIntToAmount(currentAmount + incrementAmount);
    return await db
      .update(balance)
      .set({
        amount: newAmount,
        updatedAt: new Date(),
      })
      .where(and(eq(balance.userId, userId), eq(balance.currency, currency)));
  }

  async decrementBalance(userId: string, currency: Currency, amount: string) {
    const existingBalance = await this.getUserBalance(userId, currency);

    if (!existingBalance) {
      throw new Error("No balance found for this currency");
    }

    // Check if user has sufficient balance
    const currentAmount = this.safeAmountToBigInt(existingBalance.amount);
    const decrementAmount = this.safeAmountToBigInt(amount);
    if (currentAmount < decrementAmount) {
      throw new Error("Insufficient balance");
    }

    // Update existing balance
    const newAmount = this.bigIntToAmount(currentAmount - decrementAmount);
    return await db
      .update(balance)
      .set({
        amount: newAmount,
        updatedAt: new Date(),
      })
      .where(and(eq(balance.userId, userId), eq(balance.currency, currency)));
  }

  async getTotalSystemBalance() {
    const currencies = ["BTC", "ETH", "USDT", "SOL", "BNB", "LTC"] as const;
    const totalBalances: Record<Currency, string> = {
      BTC: "0",
      ETH: "0",
      USDT: "0",
      SOL: "0",
      BNB: "0",
      LTC: "0",
    };

    // Get all balances
    const balances = await db
      .select({
        currency: balance.currency,
        amount: balance.amount,
      })
      .from(balance);

    // Sum up balances for each currency
    for (const record of balances) {
      const currentTotal = this.safeAmountToBigInt(totalBalances[record.currency]);
      const recordAmount = this.safeAmountToBigInt(record.amount);
      const newTotal = currentTotal + recordAmount;
      totalBalances[record.currency] = this.bigIntToAmount(newTotal);
    }

    return totalBalances;
  }

  async getUserTotalBalance(userId: string) {
    const currencies = ["BTC", "ETH", "USDT", "SOL", "BNB", "LTC"] as const;
    const totalBalances: Record<Currency, string> = {
      BTC: "0",
      ETH: "0",
      USDT: "0",
      SOL: "0",
      BNB: "0",
      LTC: "0",
    };

    // Get all balances for the user
    const balances = await db
      .select({
        currency: balance.currency,
        amount: balance.amount,
      })
      .from(balance)
      .where(eq(balance.userId, userId));

    console.log("balances in service", balances);

    // Sum up balances for each currency
    for (const record of balances) {
      const currentTotal = this.safeAmountToBigInt(totalBalances[record.currency]);
      const recordAmount = this.safeAmountToBigInt(record.amount);
      const newTotal = currentTotal + recordAmount;
      totalBalances[record.currency] = this.bigIntToAmount(newTotal);
    }

    console.log("totalBalances in service", totalBalances);
    return totalBalances;
  }

  async adminAdjustBalance(userId: string, currency: Currency, amount: string, adminUserId: string) {
    // Input validation: Ensure amount is valid
    let adjustmentAmount: bigint;
    try {
      adjustmentAmount = this.safeAmountToBigInt(amount);
      console.log(adjustmentAmount);
    } catch (error) {
      throw new Error("Invalid amount format.");
    }

    const existingBalance = await this.getUserBalance(userId, currency);
    console.log(existingBalance);
    let newAmount: string;

    if (!existingBalance) {
      // If balance doesn't exist and adjustment is positive, create it.
      if (adjustmentAmount > 0n) {
        const amountToStore = this.bigIntToAmount(adjustmentAmount);
        await db.insert(balance).values({
          userId,
          currency,
          amount: amountToStore,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Admin (${adminUserId}) created balance for user (${userId}) with ${amountToStore} ${currency}`);
        return { success: true, newBalance: amountToStore };
      } else {
        // Cannot decrease a non-existent balance
        throw new Error("Cannot decrease balance: User has no balance for this currency.");
      }
    } else {
      // Calculate new balance
      const currentBalance = this.safeAmountToBigInt(existingBalance.amount);
      const calculatedNewAmount = currentBalance + adjustmentAmount;
      console.log("calculatedNewAmount", calculatedNewAmount);

      // Ensure balance does not go below zero
      if (calculatedNewAmount < 0n) {
        throw new Error("Insufficient balance: Adjustment would result in a negative balance.");
      }
      newAmount = this.bigIntToAmount(calculatedNewAmount);
      console.log("newAmount", newAmount);
    }

    // Update existing balance
    await db
      .update(balance)
      .set({
        amount: newAmount,
        updatedAt: new Date(),
      })
      .where(and(eq(balance.userId, userId), eq(balance.currency, currency)));

    console.log(`Admin (${adminUserId}) adjusted balance for user (${userId}) by ${amount} ${currency}. New balance: ${newAmount}`);
    return { success: true, newBalance: newAmount };
  }
}
