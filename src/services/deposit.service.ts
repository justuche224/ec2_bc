import { eq, desc, sql, and } from "drizzle-orm";
import db from "../db/index.js";
import { deposit, user, cashapp } from "../db/schema.js";
import type { Currency } from "./wallet.service.js";
import { BalanceService } from "./balance.service.js";
import { config } from "../config/index.js";
import { mailService } from "./mail.service.js";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { join } from "path";
import { readFile } from "fs/promises";

const balanceService = BalanceService.getInstance();

export class DepositService {
  private static instance: DepositService;
  private constructor() {}

  public static getInstance(): DepositService {
    if (!DepositService.instance) {
      DepositService.instance = new DepositService();
    }
    return DepositService.instance;
  }

  async getAllDeposits() {
    return await db
      .select({
        id: deposit.id,
        userId: deposit.userId,
        systemWalletId: deposit.systemWalletId,
        currency: deposit.currency,
        amount: deposit.amount,
        status: deposit.status,
        rejectionReason: deposit.rejectionReason,
        approvedAt: deposit.approvedAt,
        rejectedAt: deposit.rejectedAt,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(deposit)
      .leftJoin(user, eq(deposit.userId, user.id))
      .orderBy(desc(deposit.createdAt));
  }

  async getAllCashappDeposits() {
    return await db
      .select({
        id: cashapp.id,
        userId: cashapp.userId,
        amount: cashapp.amount,
        cashtag: cashapp.cashtag,
        cashappName: cashapp.cashappName,
        paymentProof: cashapp.paymentProof,
        status: cashapp.status,
        rejectionReason: cashapp.rejectionReason,
        approvedAt: cashapp.approvedAt,
        rejectedAt: cashapp.rejectedAt,
        createdAt: cashapp.createdAt,
        updatedAt: cashapp.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(cashapp)
      .leftJoin(user, eq(cashapp.userId, user.id))
      .orderBy(desc(cashapp.createdAt));
  }

  async createDeposit(
    userId: string,
    systemWalletId: string,
    currency: Currency,
    amount: string
  ) {
    const result = await db.insert(deposit).values({
      userId,
      systemWalletId,
      currency,
      amount,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get user email for notification
    const userRecord = await this.getUserById(userId);
    if (userRecord && userRecord.email) {
      await mailService.sendDepositNotification(
        userRecord.email,
        amount,
        currency,
        "PENDING"
      );
    }

    return result;
  }

  async createCashappDeposit(
    userId: string,
    amount: string,
    cashtag: string,
    cashappName: string
  ) {
    const userRecord = await this.getUserById(userId);
    if (!userRecord) {
      throw new Error("User not found");
    }
    const id = uuidv4();
    const result = await db.insert(cashapp).values({
      id,
      userId,
      amount,
      cashtag,
      cashappName,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (userRecord && userRecord.email) {
      mailService.sendCashappDepositInstructions(
        userRecord.email,
        amount,
        cashtag,
        cashappName,
        id
      );
    }
    return result;
  }

  async getUserDeposits(userId: string) {
    return await db
      .select()
      .from(deposit)
      .where(eq(deposit.userId, userId))
      .orderBy(desc(deposit.createdAt));
  }

  async getCashappDeposits(userId: string) {
    return await db
      .select()
      .from(cashapp)
      .where(eq(cashapp.userId, userId))
      .orderBy(desc(cashapp.createdAt));
  }

  async getDepositById(depositId: string) {
    const depositRecord = await db
      .select()
      .from(deposit)
      .where(eq(deposit.id, depositId))
      .limit(1);

    return depositRecord[0] || null;
  }

  async getCashappDepositById(depositId: string) {
    const depositRecord = await db
      .select()
      .from(cashapp)
      .where(eq(cashapp.id, depositId))
      .limit(1);
    return depositRecord[0] || null;
  }

  async getUserCashappDepositById(depositId: string, userId: string) {
    const depositRecord = await db
      .select()
      .from(cashapp)
      .where(and(eq(cashapp.id, depositId), eq(cashapp.userId, userId)))
      .limit(1);

    return depositRecord[0] || null;
  }

  async uploadCashappDepositProof(
    depositId: string,
    proofFile: File,
    userId: string
  ) {
    const depositRecord = await this.getUserCashappDepositById(
      depositId,
      userId
    );
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }
    if (!proofFile.type.startsWith("image/")) {
      throw new Error("Proof must be an image");
    }
    if (proofFile.size > config.upload.maxFileSize) {
      throw new Error("Proof must be under 5MB");
    }
    const filename = `${uuidv4()}-${proofFile.name}`;
    const filepath = join(config.storage.depositProofs, filename);
    const arrayBuffer = await proofFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await sharp(buffer)
      .resize(
        config.upload.imageProcessing.maxWidth,
        config.upload.imageProcessing.maxHeight,
        {
          fit: "inside",
        }
      )
      .jpeg({ quality: config.upload.imageProcessing.quality })
      .toFile(filepath);

    await db
      .update(cashapp)
      .set({
        paymentProof: filename,
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where(eq(cashapp.id, depositId));

    return { success: true };
  }

  async getCashappDepositProof(filename: string) {
    const filepath = join(config.storage.depositProofs, filename);
    return await readFile(filepath);
  }

  async approveDeposit(depositId: string) {
    const depositRecord = await this.getDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PENDING") {
      throw new Error(
        `Cannot approve deposit with status: ${depositRecord.status}`
      );
    }

    // Start a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Update deposit status
      await tx
        .update(deposit)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(deposit.id, depositId));

      // Increment user balance
      balanceService.incrementBalance(
        depositRecord.userId,
        depositRecord.currency,
        depositRecord.amount
      );

      return { success: true };
    });

    // Send email notification
    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      await mailService.sendDepositNotification(
        userRecord.email,
        depositRecord.amount,
        depositRecord.currency,
        "APPROVED"
      );
    }

    return result;
  }

  async approveCashappDeposit(depositId: string) {
    const depositRecord = await this.getCashappDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot approve deposit with status: ${depositRecord.status}`
      );
    }

    const result = await db.transaction(async (tx) => {
      await tx
        .update(cashapp)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cashapp.id, depositId));

      balanceService.incrementBalance(
        depositRecord.userId,
        "USDT",
        depositRecord.amount
      );

      return { success: true };
    });

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      await mailService.sendDepositNotification(
        userRecord.email,
        depositRecord.amount,
        "USD",
        "APPROVED"
      );
    }

    return result;
  }

  async rejectDeposit(depositId: string, rejectionReason: string) {
    const depositRecord = await this.getDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PENDING") {
      throw new Error(
        `Cannot reject deposit with status: ${depositRecord.status}`
      );
    }

    const result = await db
      .update(deposit)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deposit.id, depositId));

    // Send email notification
    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification(
        userRecord.email,
        depositRecord.amount,
        depositRecord.currency,
        "REJECTED"
      );
    }

    return result;
  }

  async rejectCashappDeposit(depositId: string, rejectionReason: string) {
    const depositRecord = await this.getCashappDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot reject deposit with status: ${depositRecord.status}`
      );
    }
    const result = await db
      .update(cashapp)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cashapp.id, depositId));

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification(
        userRecord.email,
        depositRecord.amount,
        "USD",
        "REJECTED"
      );
    }

    return result;
  }

  async markDepositAsFailed(depositId: string, reason: string) {
    const depositRecord = await this.getDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PENDING") {
      throw new Error(
        `Cannot mark as failed deposit with status: ${depositRecord.status}`
      );
    }

    const result = await db
      .update(deposit)
      .set({
        status: "FAILED",
        rejectionReason: reason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deposit.id, depositId));

    // Send email notification
    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      await mailService.sendDepositNotification(
        userRecord.email,
        depositRecord.amount,
        depositRecord.currency,
        "FAILED"
      );
    }

    return result;
  }

  async markCashappDepositAsFailed(depositId: string, reason: string) {
    const depositRecord = await this.getCashappDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot mark as failed deposit with status: ${depositRecord.status}`
      );
    }

    const result = await db
      .update(cashapp)
      .set({
        status: "FAILED",
        rejectionReason: reason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cashapp.id, depositId));

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification(
        userRecord.email,
        depositRecord.amount,
        "USD",
        "FAILED"
      );
    }

    return result;
  }

  async getTotalDepositsCount() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(deposit);
    return result[0].count;
  }

  async getPendingDepositsCount() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(deposit)
      .where(eq(deposit.status, "PENDING"));
    return result[0].count;
  }

  async getApprovedDepositsAmount() {
    const result = await db
      .select({
        currency: deposit.currency,
        totalAmount: sql<string>`SUM(${deposit.amount}::NUMERIC)`,
      })
      .from(deposit)
      .where(eq(deposit.status, "APPROVED"))
      .groupBy(deposit.currency);
    return result;
  }

  async getRecentDeposits(limit: number = 5) {
    return await db
      .select({
        id: deposit.id,
        userId: deposit.userId,
        currency: deposit.currency,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(deposit)
      .leftJoin(user, eq(deposit.userId, user.id))
      .orderBy(desc(deposit.createdAt))
      .limit(limit);
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
