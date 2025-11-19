import { eq, desc, sql, and } from "drizzle-orm";
import db from "../db/index.js";
import { deposit, user, cashapp, paypal, bank } from "../db/schema.js";
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
        assignedDepositTag: cashapp.adminCashtag,
        assignedDepositName: cashapp.adminCashappName,
        instructionsSent: cashapp.instructionsSent,
      })
      .from(cashapp)
      .leftJoin(user, eq(cashapp.userId, user.id))
      .orderBy(desc(cashapp.createdAt));
  }

  async getAllPaypalDeposits() {
    return await db
      .select({
        id: paypal.id,
        userId: paypal.userId,
        amount: paypal.amount,
        paypalEmail: paypal.paypalEmail,
        paypalName: paypal.paypalName,
        paymentProof: paypal.paymentProof,
        status: paypal.status,
        rejectionReason: paypal.rejectionReason,
        approvedAt: paypal.approvedAt,
        rejectedAt: paypal.rejectedAt,
        createdAt: paypal.createdAt,
        updatedAt: paypal.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        assignedDepositEmail: paypal.adminPaypalEmail,
        assignedDepositName: paypal.adminPaypalName,
        instructionsSent: paypal.instructionsSent,
      })
      .from(paypal)
      .leftJoin(user, eq(paypal.userId, user.id))
      .orderBy(desc(paypal.createdAt));
  }

  async getAllBankDeposits() {
    return await db
      .select({
        id: bank.id,
        userId: bank.userId,
        amount: bank.amount,
        bankName: bank.bankName,
        bankAccountName: bank.bankAccountName,
        bankAccountNumber: bank.bankAccountNumber,
        paymentProof: bank.paymentProof,
        status: bank.status,
        rejectionReason: bank.rejectionReason,
        approvedAt: bank.approvedAt,
        rejectedAt: bank.rejectedAt,
        createdAt: bank.createdAt,
        updatedAt: bank.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        assignedDepositBankName: bank.adminBankName,
        assignedDepositAccountName: bank.adminBankAccountName,
        assignedDepositAccountNumber: bank.adminBankAccountNumber,
        instructionsSent: bank.instructionsSent,
      })
      .from(bank)
      .leftJoin(user, eq(bank.userId, user.id))
      .orderBy(desc(bank.createdAt));
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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount,
        currency,
        status: "PENDING",
        method: "CRYPTO",
        date: new Date(),
      });
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

    // Note: Email will be sent after admin assigns payment details
    return result;
  }

  async createPaypalDeposit(
    userId: string,
    amount: string,
    paypalEmail: string,
    paypalName: string
  ) {
    const userRecord = await this.getUserById(userId);
    if (!userRecord) {
      throw new Error("User not found");
    }
    const id = uuidv4();
    const result = await db.insert(paypal).values({
      id,
      userId,
      amount,
      paypalEmail,
      paypalName,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Note: Email will be sent after admin assigns payment details
    return result;
  }

  async createBankDeposit(
    userId: string,
    amount: string,
    bankName: string,
    bankAccountName: string,
    bankAccountNumber: string
  ) {
    const userRecord = await this.getUserById(userId);
    if (!userRecord) {
      throw new Error("User not found");
    }
    const id = uuidv4();
    const result = await db.insert(bank).values({
      id,
      userId,
      amount,
      bankName,
      bankAccountName,
      bankAccountNumber,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Note: Email will be sent after admin assigns payment details
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

  async getPaypalDeposits(userId: string) {
    return await db
      .select()
      .from(paypal)
      .where(eq(paypal.userId, userId))
      .orderBy(desc(paypal.createdAt));
  }

  async getBankDeposits(userId: string) {
    return await db
      .select()
      .from(bank)
      .where(eq(bank.userId, userId))
      .orderBy(desc(bank.createdAt));
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

  async getPaypalDepositById(depositId: string) {
    const depositRecord = await db
      .select()
      .from(paypal)
      .where(eq(paypal.id, depositId))
      .limit(1);
    return depositRecord[0] || null;
  }

  async getBankDepositById(depositId: string) {
    const depositRecord = await db
      .select()
      .from(bank)
      .where(eq(bank.id, depositId))
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

  async getUserPaypalDepositById(depositId: string, userId: string) {
    const depositRecord = await db
      .select()
      .from(paypal)
      .where(and(eq(paypal.id, depositId), eq(paypal.userId, userId)))
      .limit(1);
    return depositRecord[0] || null;
  }

  async getUserBankDepositById(depositId: string, userId: string) {
    const depositRecord = await db
      .select()
      .from(bank)
      .where(and(eq(bank.id, depositId), eq(bank.userId, userId)))
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

  async uploadPaypalDepositProof(
    depositId: string,
    proofFile: File,
    userId: string
  ) {
    const depositRecord = await this.getUserPaypalDepositById(
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
    const filepath = join(config.storage.paypalProofs, filename);
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
      .update(paypal)
      .set({
        paymentProof: filename,
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where(eq(paypal.id, depositId));

    return { success: true };
  }

  async uploadBankDepositProof(
    depositId: string,
    proofFile: File,
    userId: string
  ) {
    const depositRecord = await this.getUserBankDepositById(depositId, userId);
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
    const filepath = join(config.storage.bankProofs, filename);
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
      .update(bank)
      .set({
        paymentProof: filename,
        status: "PROCESSING",
        updatedAt: new Date(),
      })
      .where(eq(bank.id, depositId));

    return { success: true };
  }

  async getCashappDepositProof(filename: string) {
    const filepath = join(config.storage.depositProofs, filename);
    return await readFile(filepath);
  }

  async getPaypalDepositProof(filename: string) {
    const filepath = join(config.storage.paypalProofs, filename);
    return await readFile(filepath);
  }

  async getBankDepositProof(filename: string) {
    const filepath = join(config.storage.bankProofs, filename);
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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: depositRecord.currency,
        status: "APPROVED",
        method: "CRYPTO",
        date: new Date(),
      });
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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "APPROVED",
        method: "CASHAPP",
        date: new Date(),
      });
    }

    return result;
  }

  async approvePaypalDeposit(depositId: string) {
    const depositRecord = await this.getPaypalDepositById(depositId);
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
        .update(paypal)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paypal.id, depositId));

      balanceService.incrementBalance(
        depositRecord.userId,
        "USDT",
        depositRecord.amount
      );

      return { success: true };
    });

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "APPROVED",
        method: "PAYPAL",
        date: new Date(),
      });
    }

    return result;
  }

  async approveBankDeposit(depositId: string) {
    const depositRecord = await this.getBankDepositById(depositId);
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
        .update(bank)
        .set({
          status: "APPROVED",
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bank.id, depositId));

      balanceService.incrementBalance(
        depositRecord.userId,
        "USDT",
        depositRecord.amount
      );

      return { success: true };
    });

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "APPROVED",
        method: "BANK TRANSFER",
        date: new Date(),
      });
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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: depositRecord.currency,
        status: "REJECTED",
        method: "CRYPTO",
        date: new Date(),
      });
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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "REJECTED",
        method: "CASHAPP",
        date: new Date(),
      });
    }

    return result;
  }

  async rejectPaypalDeposit(depositId: string, rejectionReason: string) {
    const depositRecord = await this.getPaypalDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }
    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot reject deposit with status: ${depositRecord.status}`
      );
    }
    const result = await db
      .update(paypal)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paypal.id, depositId));

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "REJECTED",
        method: "PAYPAL",
        date: new Date(),
      });
    }

    return result;
  }

  async rejectBankDeposit(depositId: string, rejectionReason: string) {
    const depositRecord = await this.getBankDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }
    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot reject deposit with status: ${depositRecord.status}`
      );
    }
    const result = await db
      .update(bank)
      .set({
        status: "REJECTED",
        rejectionReason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bank.id, depositId));

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "REJECTED",
        method: "BANK TRANSFER",
        date: new Date(),
      });
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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: depositRecord.currency,
        status: "FAILED",
        method: "CRYPTO",
        date: new Date(),
      });
    }

    return result;
  }

  async markCashappDepositAsFailed(depositId: string, reason: string) {
    const depositRecord = await this.getCashappDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    // if (depositRecord.status !== "PROCESSING") {
    //   throw new Error(
    //     `Cannot mark as failed deposit with status: ${depositRecord.status}`
    //   );
    // }

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
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "FAILED",
        method: "CASHAPP",
        date: new Date(),
      });
    }

    return result;
  }

  async markPaypalDepositAsFailed(depositId: string, reason: string) {
    const depositRecord = await this.getPaypalDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }
    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot mark as failed deposit with status: ${depositRecord.status}`
      );
    }
    const result = await db
      .update(paypal)
      .set({
        status: "FAILED",
        rejectionReason: reason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paypal.id, depositId));

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "FAILED",
        method: "PAYPAL",
        date: new Date(),
      });
    }

    return result;
  }

  async markBankDepositAsFailed(depositId: string, reason: string) {
    const depositRecord = await this.getBankDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }
    if (depositRecord.status !== "PROCESSING") {
      throw new Error(
        `Cannot mark as failed deposit with status: ${depositRecord.status}`
      );
    }
    const result = await db
      .update(bank)
      .set({
        status: "FAILED",
        rejectionReason: reason,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bank.id, depositId));

    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      mailService.sendDepositNotification({
        email: userRecord.email,
        amount: depositRecord.amount,
        currency: "USD",
        status: "FAILED",
        method: "BANK TRANSFER",
        date: new Date(),
      });
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

  async assignCashappDetails(
    depositId: string,
    adminCashtag: string,
    adminCashappName: string
  ) {
    const depositRecord = await this.getCashappDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PENDING") {
      throw new Error("Can only assign details to pending deposits");
    }

    // Update deposit with admin-assigned payment details
    await db
      .update(cashapp)
      .set({
        updatedAt: new Date(),
        adminCashtag,
        adminCashappName,
      })
      .where(eq(cashapp.id, depositId));

    // Get user details for email
    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      await mailService.sendCashappDepositInstructions(
        userRecord.email,
        depositRecord.amount,
        adminCashtag,
        adminCashappName,
        depositId
      );

      await db
        .update(cashapp)
        .set({
          instructionsSent: true,
        })
        .where(eq(cashapp.id, depositId));
    }

    return {
      success: true,
      message: "Cashapp details assigned and instructions sent",
    };
  }

  async assignPaypalDetails(
    depositId: string,
    adminPaypalEmail: string,
    adminPaypalName: string
  ) {
    const depositRecord = await this.getPaypalDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PENDING") {
      throw new Error("Can only assign details to pending deposits");
    }

    // Update deposit with admin-assigned payment details
    await db
      .update(paypal)
      .set({
        adminPaypalEmail,
        adminPaypalName,
        updatedAt: new Date(),
      })
      .where(eq(paypal.id, depositId));

    // Get user details for email
    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      await mailService.sendPaypalDepositInstructions(
        userRecord.email,
        depositRecord.amount,
        adminPaypalEmail,
        adminPaypalName,
        depositId
      );

      await db
        .update(paypal)
        .set({
          instructionsSent: true,
        })
        .where(eq(paypal.id, depositId));
    }

    return {
      success: true,
      message: "Paypal details assigned and instructions sent",
    };
  }

  async assignBankDetails(
    depositId: string,
    adminBankName: string,
    adminBankAccountName: string,
    adminBankAccountNumber: string
  ) {
    const depositRecord = await this.getBankDepositById(depositId);
    if (!depositRecord) {
      throw new Error("Deposit not found");
    }

    if (depositRecord.status !== "PENDING") {
      throw new Error("Can only assign details to pending deposits");
    }

    // Update deposit with admin-assigned payment details
    await db
      .update(bank)
      .set({
        updatedAt: new Date(),
        adminBankName,
        adminBankAccountName,
        adminBankAccountNumber,
      })
      .where(eq(bank.id, depositId));

    // Get user details for email
    const userRecord = await this.getUserById(depositRecord.userId);
    if (userRecord && userRecord.email) {
      await mailService.sendBankDepositInstructions(
        userRecord.email,
        depositRecord.amount,
        adminBankName,
        adminBankAccountName,
        adminBankAccountNumber,
        depositId
      );

      await db
        .update(bank)
        .set({
          instructionsSent: true,
        })
        .where(eq(bank.id, depositId));
    }

    return {
      success: true,
      message: "Bank details assigned and instructions sent",
    };
  }

  // Get deposits pending instructions grouped by type
  async getDepositsPendingInstructions() {
    // Get cashapp deposits pending instructions
    const cashappPending = await db
      .select({ count: sql<number>`count(*)` })
      .from(cashapp)
      .where(
        and(eq(cashapp.status, "PENDING"), eq(cashapp.instructionsSent, false))
      );

    // Get paypal deposits pending instructions
    const paypalPending = await db
      .select({ count: sql<number>`count(*)` })
      .from(paypal)
      .where(
        and(eq(paypal.status, "PENDING"), eq(paypal.instructionsSent, false))
      );

    // Get bank deposits pending instructions
    const bankPending = await db
      .select({ count: sql<number>`count(*)` })
      .from(bank)
      .where(and(eq(bank.status, "PENDING"), eq(bank.instructionsSent, false)));

    const cashappCount = Number(cashappPending[0]?.count || 0);
    const paypalCount = Number(paypalPending[0]?.count || 0);
    const bankCount = Number(bankPending[0]?.count || 0);

    return {
      cashapp: cashappCount,
      paypal: paypalCount,
      bank: bankCount,
      total: cashappCount + paypalCount + bankCount,
    };
  }

  // Get detailed list of deposits pending instructions
  async getDetailedDepositsPendingInstructions() {
    // Get cashapp deposits pending instructions
    const cashappDeposits = await db
      .select({
        id: cashapp.id,
        userId: cashapp.userId,
        amount: cashapp.amount,
        cashtag: cashapp.cashtag,
        cashappName: cashapp.cashappName,
        status: cashapp.status,
        createdAt: cashapp.createdAt,
        type: sql<string>`'cashapp'`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(cashapp)
      .leftJoin(user, eq(cashapp.userId, user.id))
      .where(
        and(eq(cashapp.status, "PENDING"), eq(cashapp.instructionsSent, false))
      )
      .orderBy(desc(cashapp.createdAt));

    // Get paypal deposits pending instructions
    const paypalDeposits = await db
      .select({
        id: paypal.id,
        userId: paypal.userId,
        amount: paypal.amount,
        paypalEmail: paypal.paypalEmail,
        paypalName: paypal.paypalName,
        status: paypal.status,
        createdAt: paypal.createdAt,
        type: sql<string>`'paypal'`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(paypal)
      .leftJoin(user, eq(paypal.userId, user.id))
      .where(
        and(eq(paypal.status, "PENDING"), eq(paypal.instructionsSent, false))
      )
      .orderBy(desc(paypal.createdAt));

    // Get bank deposits pending instructions
    const bankDeposits = await db
      .select({
        id: bank.id,
        userId: bank.userId,
        amount: bank.amount,
        bankName: bank.bankName,
        bankAccountName: bank.bankAccountName,
        bankAccountNumber: bank.bankAccountNumber,
        status: bank.status,
        createdAt: bank.createdAt,
        type: sql<string>`'bank'`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(bank)
      .leftJoin(user, eq(bank.userId, user.id))
      .where(and(eq(bank.status, "PENDING"), eq(bank.instructionsSent, false)))
      .orderBy(desc(bank.createdAt));

    return {
      cashapp: cashappDeposits,
      paypal: paypalDeposits,
      bank: bankDeposits,
      summary: {
        cashapp: cashappDeposits.length,
        paypal: paypalDeposits.length,
        bank: bankDeposits.length,
        total:
          cashappDeposits.length + paypalDeposits.length + bankDeposits.length,
      },
    };
  }
}
