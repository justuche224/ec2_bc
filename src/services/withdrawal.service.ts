import { eq, desc, sql, and } from "drizzle-orm";
import db from "../db/index.js";
import { withdrawal, user, cashappWithdrawal, paypalWithdrawal, bankWithdrawal } from "../db/schema.js";
import type { Currency } from "./wallet.service.js";
import { BalanceService } from "./balance.service.js";
import { mailService } from "./mail.service.js";

const balanceService = BalanceService.getInstance();

export class WithdrawalService {
  private static instance: WithdrawalService;
  private constructor() {}

  public static getInstance(): WithdrawalService {
    if (!WithdrawalService.instance) {
      WithdrawalService.instance = new WithdrawalService();
    }
    return WithdrawalService.instance;
  }

  async getAllWithdrawals() {
    return await db
      .select({
        id: withdrawal.id,
        userId: withdrawal.userId,
        currency: withdrawal.currency,
        amount: withdrawal.amount,
        status: withdrawal.status,
        destinationAddress: withdrawal.destinationAddress,
        rejectionReason: withdrawal.rejectionReason,
        approvedAt: withdrawal.approvedAt,
        rejectedAt: withdrawal.rejectedAt,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(withdrawal)
      .leftJoin(user, eq(withdrawal.userId, user.id))
      .orderBy(desc(withdrawal.createdAt));
  }

  async getAllCashappWithdrawals() {
    return await db.select({
      id: cashappWithdrawal.id,
      userId: cashappWithdrawal.userId,
      currency: cashappWithdrawal.currency,
      amount: cashappWithdrawal.amount,
      cashtag: cashappWithdrawal.cashtag,
      cashappName: cashappWithdrawal.cashappName,
      status: cashappWithdrawal.status,
      rejectionReason: cashappWithdrawal.rejectionReason,
      approvedAt: cashappWithdrawal.approvedAt,
      rejectedAt: cashappWithdrawal.rejectedAt,
      createdAt: cashappWithdrawal.createdAt,
      updatedAt: cashappWithdrawal.updatedAt,
      user: { 
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(cashappWithdrawal)
      .leftJoin(user, eq(cashappWithdrawal.userId, user.id))
      .orderBy(desc(cashappWithdrawal.createdAt));
  }

  async getAllPaypalWithdrawals() {
    return await db.select({
      id: paypalWithdrawal.id,
      userId: paypalWithdrawal.userId,
      currency: paypalWithdrawal.currency,
      amount: paypalWithdrawal.amount,
      paypalEmail: paypalWithdrawal.paypalEmail,
      paypalName: paypalWithdrawal.paypalName,
      status: paypalWithdrawal.status,
      rejectionReason: paypalWithdrawal.rejectionReason,
      approvedAt: paypalWithdrawal.approvedAt,
      rejectedAt: paypalWithdrawal.rejectedAt,
      createdAt: paypalWithdrawal.createdAt,
      updatedAt: paypalWithdrawal.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(paypalWithdrawal)
      .leftJoin(user, eq(paypalWithdrawal.userId, user.id))
      .orderBy(desc(paypalWithdrawal.createdAt));
  }

  async getAllBankWithdrawals() {
    return await db.select({
      id: bankWithdrawal.id,
      userId: bankWithdrawal.userId,
      currency: bankWithdrawal.currency,
      amount: bankWithdrawal.amount,
      bankName: bankWithdrawal.bankName,
      bankAccountNumber: bankWithdrawal.bankAccountNumber,
      bankAccountName: bankWithdrawal.bankAccountName,
      status: bankWithdrawal.status,
      rejectionReason: bankWithdrawal.rejectionReason,
      approvedAt: bankWithdrawal.approvedAt,
      rejectedAt: bankWithdrawal.rejectedAt,
      createdAt: bankWithdrawal.createdAt,
      updatedAt: bankWithdrawal.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(bankWithdrawal)
      .leftJoin(user, eq(bankWithdrawal.userId, user.id))
      .orderBy(desc(bankWithdrawal.createdAt));
  }

  async getUserWithdrawals(userId: string) {
    return await db
      .select()
      .from(withdrawal)
      .where(eq(withdrawal.userId, userId))
      .orderBy(desc(withdrawal.createdAt));
  }

  async getUserCashappWithdrawals(userId: string) {
    return await db
      .select()
      .from(cashappWithdrawal)
      .where(eq(cashappWithdrawal.userId, userId))
      .orderBy(desc(cashappWithdrawal.createdAt));
  }

  async getUserPaypalWithdrawals(userId: string) {
    return await db
      .select()
      .from(paypalWithdrawal)
      .where(eq(paypalWithdrawal.userId, userId))
      .orderBy(desc(paypalWithdrawal.createdAt));
  }

  async getUserBankWithdrawals(userId: string) {
    return await db
      .select()
      .from(bankWithdrawal)
      .where(eq(bankWithdrawal.userId, userId))
      .orderBy(desc(bankWithdrawal.createdAt));
  }

  async getWithdrawalById(withdrawalId: string) {
    const withdrawalRecord = await db
      .select()
      .from(withdrawal)
      .where(eq(withdrawal.id, withdrawalId))
      .limit(1);

    return withdrawalRecord[0] || null;
  }

  async getCashappWithdrawalById(withdrawalId: string) {  
    const withdrawalRecord = await db
      .select()
      .from(cashappWithdrawal)
      .where(eq(cashappWithdrawal.id, withdrawalId))
      .limit(1);

    return withdrawalRecord[0] || null;
  }

  async getPaypalWithdrawalById(withdrawalId: string) {
    const withdrawalRecord = await db
      .select()
      .from(paypalWithdrawal)
      .where(eq(paypalWithdrawal.id, withdrawalId))
      .limit(1);

    return withdrawalRecord[0] || null;
  }

  async getBankWithdrawalById(withdrawalId: string) {
    const withdrawalRecord = await db
      .select()
      .from(bankWithdrawal)
      .where(eq(bankWithdrawal.id, withdrawalId))
      .limit(1);

    return withdrawalRecord[0] || null;
  }

  async createWithdrawal(
    userId: string,
    currency: Currency,
    amount: string,
    destinationAddress: string
  ) {
    // Check if user has sufficient balance in any currency
    const userBalance = await balanceService.getUserBalance(userId, currency);
    console.log(userBalance);
    const balanceAmount = userBalance ? BigInt(userBalance.amount) : BigInt(0);

    if (balanceAmount < BigInt(amount)) {
      throw new Error("Insufficient balance");
    }

    // Create withdrawal record
    const result = await db.insert(withdrawal).values({
      userId,
      currency,
      amount,
      destinationAddress,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send email notification
    const userRecord = await this.getUserById(userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount,
        currency,
        status: "PENDING",
        method: "CRYPTO",
        date: new Date(),
        address: destinationAddress,
      });
    }

    return result;
  }

  async createCashappWithdrawal(
    userId: string,
    currency: Currency,
    amount: string,
    cashtag: string,
    cashappName: string
  ) {
    const userBalance = await balanceService.getUserBalance(userId, currency);
    const balanceAmount = userBalance ? BigInt(userBalance.amount) : BigInt(0);

    if (balanceAmount < BigInt(amount)) {
      throw new Error("Insufficient balance");
    }

    const result = await db.insert(cashappWithdrawal).values({
      userId,
      currency,
      amount,
      cashtag,
      cashappName,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userRecord = await this.getUserById(userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount,
        currency,
        status: "PENDING",
        method: "CASHAPP",
        date: new Date(),
        cashtag,
        cashappName,
      });
    }

    return result;
  }

  async createPaypalWithdrawal(
    userId: string,
    currency: Currency,
    amount: string,
    paypalEmail: string,
    paypalName: string
  ) {
    const userBalance = await balanceService.getUserBalance(userId, currency);
    const balanceAmount = userBalance ? BigInt(userBalance.amount) : BigInt(0);

    if (balanceAmount < BigInt(amount)) {
      throw new Error("Insufficient balance");
    }

    const result = await db.insert(paypalWithdrawal).values({
      userId,
      currency,
      amount,
      paypalEmail,
      paypalName,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userRecord = await this.getUserById(userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount,
        currency,
        status: "PENDING",
        method: "PAYPAL",
        date: new Date(),
        paypalEmail,
        paypalName,
      });
    }

    return result; 
  }

  async createBankWithdrawal(
    userId: string,
    currency: Currency,
    amount: string,
    bankName: string,
    bankAccountNumber: string,
    bankAccountName: string
  ) {
    const userBalance = await balanceService.getUserBalance(userId, currency);
    const balanceAmount = userBalance ? BigInt(userBalance.amount) : BigInt(0);

    if (balanceAmount < BigInt(amount)) {
      throw new Error("Insufficient balance");
    }

    const result = await db.insert(bankWithdrawal).values({
      userId,
      currency,
      amount,
      bankName,
      bankAccountNumber,
      bankAccountName,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userRecord = await this.getUserById(userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount,
        currency,
        status: "PENDING",
        method: "BANK TRANSFER",
        date: new Date(),
        bankName,
        bankAccountNumber,
        bankAccountName,
      });
    }

    return result;
  }

  async approveWithdrawal(withdrawalId: string) {
    const withdrawalRecord = await this.getWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot approve withdrawal with status: ${withdrawalRecord.status}`
      );
    }

    // Start a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Update withdrawal status
      await tx
        .update(withdrawal)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(withdrawal.id, withdrawalId));

      // Decrement user balance
      await balanceService.decrementBalance(
        withdrawalRecord.userId,
        withdrawalRecord.currency,
        withdrawalRecord.amount
      );

      return { success: true };
    });

    // Send email notification
    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "APPROVED",
        method: "CRYPTO",
        date: new Date(),
        address: withdrawalRecord.destinationAddress,
      });
    }

    return result;
  }

  async approveCashappWithdrawal(withdrawalId: string) {
    const withdrawalRecord = await this.getCashappWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot approve withdrawal with status: ${withdrawalRecord.status}`
      );
    }

    const result = await db.transaction(async (tx) => {
      await tx
        .update(cashappWithdrawal)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cashappWithdrawal.id, withdrawalId));

      await balanceService.decrementBalance(
        withdrawalRecord.userId,
        withdrawalRecord.currency,
        withdrawalRecord.amount
      );

      return { success: true };
    });

    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "APPROVED",
        method: "CASHAPP",
        date: new Date(),
        cashtag: withdrawalRecord.cashtag,
        cashappName: withdrawalRecord.cashappName,
      });
    }

    return result;
  }

  async approvePaypalWithdrawal(withdrawalId: string) {
    const withdrawalRecord = await this.getPaypalWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot approve withdrawal with status: ${withdrawalRecord.status}`
      );
    }
   
    const result = await db.transaction(async (tx) => {
      await tx
        .update(paypalWithdrawal)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paypalWithdrawal.id, withdrawalId));

      await balanceService.decrementBalance(
        withdrawalRecord.userId,
        withdrawalRecord.currency,
        withdrawalRecord.amount
      );

      return { success: true };
    });

    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "APPROVED",
        method: "PAYPAL",
        date: new Date(),
        paypalEmail: withdrawalRecord.paypalEmail,
        paypalName: withdrawalRecord.paypalName,
      });
    }

    return result;
  }

  async approveBankWithdrawal(withdrawalId: string) {
    const withdrawalRecord = await this.getBankWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot approve withdrawal with status: ${withdrawalRecord.status}`
      );
    }
   
    const result = await db.transaction(async (tx) => {
      await tx
        .update(bankWithdrawal)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bankWithdrawal.id, withdrawalId));

      await balanceService.decrementBalance(
        withdrawalRecord.userId,
        withdrawalRecord.currency,
        withdrawalRecord.amount
      );

      return { success: true };
    });

    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "APPROVED",
        method: "BANK TRANSFER",
        date: new Date(),
        bankName: withdrawalRecord.bankName,
        bankAccountNumber: withdrawalRecord.bankAccountNumber,
        bankAccountName: withdrawalRecord.bankAccountName,
      });
    }
  }

  async rejectWithdrawal(withdrawalId: string, rejectionReason: string) {
    const withdrawalRecord = await this.getWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot reject withdrawal with status: ${withdrawalRecord.status}`
      );
    }

    const result = await db
      .update(withdrawal)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawal.id, withdrawalId));

    // Send email notification
    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "REJECTED",
        method: "CRYPTO",
        date: new Date(),
        rejectionReason,
      });
    }

    return result;
  }

  async rejectCashappWithdrawal(withdrawalId: string, rejectionReason: string) {
    const withdrawalRecord = await this.getCashappWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot reject withdrawal with status: ${withdrawalRecord.status}`
      );
    }

    const result = await db
      .update(cashappWithdrawal)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cashappWithdrawal.id, withdrawalId));

    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "REJECTED",
        method: "CASHAPP",
        date: new Date(),
        cashtag: withdrawalRecord.cashtag,
        cashappName: withdrawalRecord.cashappName,
        rejectionReason,
      });
    }

    return result;
  }

  async rejectPaypalWithdrawal(withdrawalId: string, rejectionReason: string) {
    const withdrawalRecord = await this.getPaypalWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot reject withdrawal with status: ${withdrawalRecord.status}`
      );
    }

    const result = await db
      .update(paypalWithdrawal)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paypalWithdrawal.id, withdrawalId));

    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "REJECTED",
        method: "PAYPAL",
        date: new Date(),
        paypalEmail: withdrawalRecord.paypalEmail,
        paypalName: withdrawalRecord.paypalName,
        rejectionReason,
      });
    }

    return result;
  }

  async rejectBankWithdrawal(withdrawalId: string, rejectionReason: string) {
    const withdrawalRecord = await this.getBankWithdrawalById(withdrawalId);
    if (!withdrawalRecord) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawalRecord.status !== "PENDING") {
      throw new Error(
        `Cannot reject withdrawal with status: ${withdrawalRecord.status}`
      );
    }

    const result = await db
      .update(bankWithdrawal)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bankWithdrawal.id, withdrawalId));

    const userRecord = await this.getUserById(withdrawalRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendWithdrawalNotification({
        name: userRecord.name,
        email: userRecord.email,
        amount: withdrawalRecord.amount,
        currency: withdrawalRecord.currency,
        status: "REJECTED",
        method: "BANK TRANSFER",
        date: new Date(),
        bankName: withdrawalRecord.bankName,
        bankAccountNumber: withdrawalRecord.bankAccountNumber,
        bankAccountName: withdrawalRecord.bankAccountName,
        rejectionReason,
      });
    }

    return result;
  }

  async getTotalWithdrawalsCount() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawal);
    return result[0].count;
  }

  async getPendingWithdrawalsCount() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawal)
      .where(eq(withdrawal.status, "PENDING"));
    return result[0].count;
  }

  async getApprovedWithdrawalsAmount() {
    const result = await db
      .select({
        currency: withdrawal.currency,
        totalAmount: sql<string>`SUM(${withdrawal.amount}::NUMERIC)`,
      })
      .from(withdrawal)
      .where(eq(withdrawal.status, "APPROVED"))
      .groupBy(withdrawal.currency);
    return result;
  }

  async getRecentWithdrawals(limit: number = 5) {
    return await db
      .select({
        id: withdrawal.id,
        userId: withdrawal.userId,
        currency: withdrawal.currency,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(withdrawal)
      .leftJoin(user, eq(withdrawal.userId, user.id))
      .orderBy(desc(withdrawal.createdAt))
      .limit(limit);
  }

  async getUserApprovedWithdrawalsAmount(userId: string) {
    const result = await db
      .select({
        currency: withdrawal.currency,
        totalAmount: sql<string>`SUM(${withdrawal.amount}::NUMERIC)`,
      })
      .from(withdrawal)
      .where(
        and(eq(withdrawal.userId, userId), eq(withdrawal.status, "APPROVED"))
      )
      .groupBy(withdrawal.currency);
    return result;
  }

  // Helper method to get user by ID
  private async getUserById(userId: string) {
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return userRecord[0] || null;
  }
}
