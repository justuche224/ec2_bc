import type { Context } from "hono";
import { DepositService } from "../services/deposit.service.js";
import type { Currency } from "../services/wallet.service.js";

const depositService = DepositService.getInstance();

export class DepositController {
  static async serveCashappDepositProof(c: Context) {
    try {
      const filename = c.req.param("filename");
      const user = c.get("user");
      const userId = user?.id;
      const isAdmin = user?.role === "ADMIN";

      if (!userId) {
        return c.json({ error: "Unauthorized: No user ID found" }, 401);
      }

      const fileBuffer = await depositService.getCashappDepositProof(filename);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
    } catch (error) {
      console.error("Error serving proof image:", error);
      return new Response(
        error instanceof Error ? error.message : "File not found",
        { status: 404 }
      );
    }
  }

  static async servePaypalDepositProof(c: Context) {
    try {
      const filename = c.req.param("filename");
      const user = c.get("user");
      const userId = user?.id;
      const isAdmin = user?.role === "ADMIN";

      if (!userId) {
        return c.json({ error: "Unauthorized: No user ID found" }, 401);
      }

      const fileBuffer = await depositService.getPaypalDepositProof(filename);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
    } catch (error) {
      console.error("Error serving paypal deposit proof:", error);
      return new Response(
        error instanceof Error ? error.message : "File not found",
        { status: 404 }
      );
    }
  }

  static async serveBankDepositProof(c: Context) {
    try {
      const filename = c.req.param("filename");
      const user = c.get("user");
      const userId = user?.id;
      const isAdmin = user?.role === "ADMIN";

      if (!userId) {
        return c.json({ error: "Unauthorized: No user ID found" }, 401);
      }

      const fileBuffer = await depositService.getBankDepositProof(filename);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
    } catch (error) {
      console.error("Error serving bank deposit proof:", error);
      return new Response(
        error instanceof Error ? error.message : "File not found",
        { status: 404 }
      );
    }
  }

  static async getAllDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const deposits = await depositService.getAllDeposits();
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting all deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposits",
        },
        500
      );
    }
  }

  static async getAllCashappDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const deposits = await depositService.getAllCashappDeposits();
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting all cashapp deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to get cashapp deposits",
        },
        500
      );
    }
  }

  static async getAllPaypalDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const deposits = await depositService.getAllPaypalDeposits();
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting all paypal deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to get paypal deposits",
        },
        500
      );
    }
  }

  static async getAllBankDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const deposits = await depositService.getAllBankDeposits();
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting all bank deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to get bank deposits",
        },
        500
      );
    }
  }

  static async createDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const { systemWalletId, currency, amount } = await c.req.json();

      if (!systemWalletId || !currency || !amount) {
        return c.json(
          {
            error:
              "Missing required fields: systemWalletId, currency, and amount are required",
          },
          400
        );
      }

      const result = await depositService.createDeposit(
        user.id,
        systemWalletId,
        currency,
        amount
      );

      return c.json({ success: true, deposit: result }, 201);
    } catch (error) {
      console.error("Error creating deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create deposit",
        },
        500
      );
    }
  }

  static async createCashappDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const { amount, cashtag, cashappName } = await c.req.json();
      if (!amount || !cashtag || !cashappName) {
        return c.json({ error: "Missing required fields" }, 400);
      }
      const result = await depositService.createCashappDeposit(
        user.id,
        amount,
        cashtag,
        cashappName
      );
      return c.json({ success: true, deposit: result }, 201);
    } catch (error) {
      console.error("Error creating cashapp deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create cashapp deposit",
        },
        500
      );
    }
  }

  static async createPaypalDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const { amount, paypalEmail, paypalName } = await c.req.json();
      if (!amount || !paypalEmail || !paypalName) {
        return c.json({ error: "Missing required fields" }, 400);
      }
      const result = await depositService.createPaypalDeposit(
        user.id,
        amount,
        paypalEmail,
        paypalName
      );
      return c.json({ success: true, deposit: result }, 201);
    } catch (error) {
      console.error("Error creating paypal deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create paypal deposit",
        },
        500
      );
    }
  }

  static async createBankDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const { amount, bankName, bankAccountName, bankAccountNumber } =
        await c.req.json();
      if (!amount || !bankName || !bankAccountName || !bankAccountNumber) {
        return c.json({ error: "Missing required fields" }, 400);
      }
      const result = await depositService.createBankDeposit(
        user.id,
        amount,
        bankName,
        bankAccountName,
        bankAccountNumber
      );
      return c.json({ success: true, deposit: result }, 201);
    } catch (error) {
      console.error("Error creating bank deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create bank deposit",
        },
        500
      );
    }
  }

  static async getUserCashappDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const deposits = await depositService.getCashappDeposits(user.id);
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting user deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposits",
        },
        500
      );
    }
  }

  static async getUserPaypalDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const deposits = await depositService.getPaypalDeposits(user.id);
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting user paypal deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposits",
        },
        500
      );
    }
  }

  static async getUserBankDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const deposits = await depositService.getBankDeposits(user.id);
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting user bank deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposits",
        },
        500
      );
    }
  }

  static async getUserCashappDepositById(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const depositId = c.req.param("id");
      if (!depositId) {
        return c.json({ error: "Deposit ID is required" }, 400);
      }
      const deposit = await depositService.getUserCashappDepositById(
        depositId,
        user.id
      );
      if (!deposit) {
        return c.json({ error: "Deposit not found" }, 404);
      }
      return c.json({ data: deposit }, 200);
    } catch (error) {
      console.error("Error getting user deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposit",
        },
        500
      );
    }
  }

  static async getUserPaypalDepositById(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const depositId = c.req.param("id");
      if (!depositId) {
        return c.json({ error: "Deposit ID is required" }, 400);
      }
      const deposit = await depositService.getUserPaypalDepositById(
        depositId,
        user.id
      );
      if (!deposit) {
        return c.json({ error: "Deposit not found" }, 404);
      }
      return c.json({ data: deposit }, 200);
    } catch (error) {
      console.error("Error getting user paypal deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposit",
        },
        500
      );
    }
  }

  static async getUserBankDepositById(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const depositId = c.req.param("id");
      if (!depositId) {
        return c.json({ error: "Deposit ID is required" }, 400);
      }
      const deposit = await depositService.getUserBankDepositById(
        depositId,
        user.id
      );
      if (!deposit) {
        return c.json({ error: "Deposit not found" }, 404);
      }
      return c.json({ data: deposit }, 200);
    } catch (error) {
      console.error("Error getting user bank deposit by id:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposit",
        },
        500
      );
    }
  }

  static async uploadCashappDepositProof(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const formData = await c.req.formData();
      const depositId = c.req.param("id");
      const proofFile = formData.get("proof") as File;
      if (!depositId || !proofFile) {
        return c.json({ error: "Deposit ID and proof file are required" }, 400);
      }
      const result = await depositService.uploadCashappDepositProof(
        depositId,
        proofFile,
        user.id
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error uploading cashapp deposit proof:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to upload cashapp deposit proof",
        },
        500
      );
    }
  }

  static async uploadPaypalDepositProof(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const formData = await c.req.formData();
      const depositId = c.req.param("id");
      const proofFile = formData.get("proof") as File;
      if (!depositId || !proofFile) {
        return c.json({ error: "Deposit ID and proof file are required" }, 400);
      }
      const result = await depositService.uploadPaypalDepositProof(
        depositId,
        proofFile,
        user.id
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error uploading paypal deposit proof:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to upload paypal deposit proof",
        },
        500
      );
    }
  }

  static async uploadBankDepositProof(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }
      const formData = await c.req.formData();
      const depositId = c.req.param("id");
      const proofFile = formData.get("proof") as File;
      if (!depositId || !proofFile) {
        return c.json({ error: "Deposit ID and proof file are required" }, 400);
      }
      const result = await depositService.uploadBankDepositProof(
        depositId,
        proofFile,
        user.id
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error uploading bank deposit proof:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to upload bank deposit proof",
        },
        500
      );
    }
  }

  static async getUserDeposits(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const deposits = await depositService.getUserDeposits(user.id);
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting user deposits:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposits",
        },
        500
      );
    }
  }

  static async approveDeposit(c: Context) {
    console.log("approveDeposit");
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const depositId = c.req.param("id");
      const result = await depositService.approveDeposit(depositId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to approve deposit",
        },
        500
      );
    }
  }

  static async approveCashappDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const result = await depositService.approveCashappDeposit(depositId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving cashapp deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to approve cashapp deposit",
        },
        500
      );
    }
  }

  static async approvePaypalDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const result = await depositService.approvePaypalDeposit(depositId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving paypal deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to approve paypal deposit",
        },
        500
      );
    }
  }

  static async approveBankDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const result = await depositService.approveBankDeposit(depositId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving bank deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to approve bank deposit",
        },
        500
      );
    }
  }

  static async rejectDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      console.log("rejectDeposit");
      const depositId = c.req.param("id");
      console.log("depositId", depositId);
      const { rejectionReason } = await c.req.json();
      console.log("rejectionReason", rejectionReason);

      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }

      const result = await depositService.rejectDeposit(
        depositId,
        rejectionReason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to reject deposit",
        },
        500
      );
    }
  }

  static async rejectCashappDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const { rejectionReason } = await c.req.json();
      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }
      const result = await depositService.rejectCashappDeposit(
        depositId,
        rejectionReason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error rejecting cashapp deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to reject cashapp deposit",
        },
        500
      );
    }
  }

  static async rejectPaypalDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const { rejectionReason } = await c.req.json();
      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }
      const result = await depositService.rejectPaypalDeposit(
        depositId,
        rejectionReason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error rejecting paypal deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to reject paypal deposit",
        },
        500
      );
    }
  }

  static async rejectBankDeposit(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const { rejectionReason } = await c.req.json();
      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }
      const result = await depositService.rejectBankDeposit(
        depositId,
        rejectionReason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error rejecting bank deposit:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to reject bank deposit",
        },
        500
      );
    }
  }

  static async markCashappDepositAsFailed(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const { reason } = await c.req.json();
      if (!reason) {
        return c.json({ error: "Failure reason is required" }, 400);
      }
      const result = await depositService.markCashappDepositAsFailed(
        depositId,
        reason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error marking cashapp deposit as failed:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to mark cashapp deposit as failed",
        },
        500
      );
    }
  }

  static async markPaypalDepositAsFailed(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const { reason } = await c.req.json();
      if (!reason) {
        return c.json({ error: "Failure reason is required" }, 400);
      }
      const result = await depositService.markPaypalDepositAsFailed(
        depositId,
        reason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error marking paypal deposit as failed:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to mark paypal deposit as failed",
        },
        500
      );
    }
  }

  static async markBankDepositAsFailed(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const depositId = c.req.param("id");
      const { reason } = await c.req.json();
      if (!reason) {
        return c.json({ error: "Failure reason is required" }, 400);
      }
      const result = await depositService.markBankDepositAsFailed(
        depositId,
        reason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error marking bank deposit as failed:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to mark bank deposit as failed",
        },
        500
      );
    }
  }
  static async markDepositAsFailed(c: Context) {
    console.log("markDepositAsFailed");
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const depositId = c.req.param("id");
      const { reason } = await c.req.json();

      if (!reason) {
        return c.json({ error: "Failure reason is required" }, 400);
      }

      const result = await depositService.markDepositAsFailed(
        depositId,
        reason
      );
      return c.json({ success: true, deposit: result }, 200);
    } catch (error) {
      console.error("Error marking deposit as failed:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to mark deposit as failed",
        },
        500
      );
    }
  }

  // Admin methods to assign payment details and send instructions
  static async assignCashappDetails(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const depositId = c.req.param("id");
      const { adminCashtag, adminCashappName } = await c.req.json();

      if (!adminCashtag || !adminCashappName) {
        return c.json(
          {
            error: "Admin cashtag and cashapp name are required",
          },
          400
        );
      }

      const result = await depositService.assignCashappDetails(
        depositId,
        adminCashtag,
        adminCashappName
      );

      return c.json(result, 200);
    } catch (error) {
      console.error("Error assigning cashapp details:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to assign cashapp details",
        },
        500
      );
    }
  }

  static async assignPaypalDetails(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const depositId = c.req.param("id");
      const { adminPaypalEmail, adminPaypalName } = await c.req.json();

      if (!adminPaypalEmail || !adminPaypalName) {
        return c.json(
          {
            error: "Admin paypal email and name are required",
          },
          400
        );
      }

      const result = await depositService.assignPaypalDetails(
        depositId,
        adminPaypalEmail,
        adminPaypalName
      );

      return c.json(result, 200);
    } catch (error) {
      console.error("Error assigning paypal details:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to assign paypal details",
        },
        500
      );
    }
  }

  static async assignBankDetails(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const depositId = c.req.param("id");
      const { adminBankName, adminBankAccountName, adminBankAccountNumber } =
        await c.req.json();

      if (!adminBankName || !adminBankAccountName || !adminBankAccountNumber) {
        return c.json(
          {
            error:
              "Admin bank name, account name, and account number are required",
          },
          400
        );
      }

      const result = await depositService.assignBankDetails(
        depositId,
        adminBankName,
        adminBankAccountName,
        adminBankAccountNumber
      );

      return c.json(result, 200);
    } catch (error) {
      console.error("Error assigning bank details:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to assign bank details",
        },
        500
      );
    }
  }

  static async getDepositsPendingInstructions(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const deposits = await depositService.getDepositsPendingInstructions();
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error("Error getting deposits pending instructions:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get deposits",
        },
        500
      );
    }
  }

  static async getDetailedDepositsPendingInstructions(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const deposits =
        await depositService.getDetailedDepositsPendingInstructions();
      return c.json({ data: deposits }, 200);
    } catch (error) {
      console.error(
        "Error getting detailed deposits pending instructions:",
        error
      );
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to get detailed deposits",
        },
        500
      );
    }
  }
}
