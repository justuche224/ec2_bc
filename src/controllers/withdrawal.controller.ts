import type { Context } from "hono";
import { WithdrawalService } from "../services/withdrawal.service.js";

const withdrawalService = WithdrawalService.getInstance();

export class WithdrawalController {
  static async getAllWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawals = await withdrawalService.getAllWithdrawals();
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting all withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get withdrawals",
        },
        500
      );
    }
  }

  static async getAllCashappWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const withdrawals = await withdrawalService.getAllCashappWithdrawals();
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting all cashapp withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to get all cashapp withdrawals",
        },
        500
      );
    }
  }

  static async getAllPaypalWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const withdrawals = await withdrawalService.getAllPaypalWithdrawals();
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting all paypal withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get all paypal withdrawals",
        },
        500
      );
    }
  }

  static async getAllBankWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }
      const withdrawals = await withdrawalService.getAllBankWithdrawals();
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting all bank withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get all bank withdrawals",
        },
        500
      );
    }
  }

  static async createWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const { currency, amount, destinationAddress } = await c.req.json();

      if (!currency || !amount || !destinationAddress) {
        return c.json(
          {
            error:
              "Missing required fields: currency, amount, and destinationAddress are required",
          },
          400
        );
      }

      const result = await withdrawalService.createWithdrawal(
        user.id,
        currency,
        amount,
        destinationAddress
      );

      return c.json({ success: true, withdrawal: result }, 201);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create withdrawal",
        },
        500
      );
    }
  }

  static async createCashappWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const { currency, amount, cashtag, cashappName } = await c.req.json();
      
      if (!currency || !amount || !cashtag || !cashappName) {
        return c.json(
          {
            error: "Missing required fields: currency, amount, cashtag, and cashappName are required",
          },
          400
        );
      }

      const result = await withdrawalService.createCashappWithdrawal(
        user.id,
        currency,
        amount,
        cashtag,
        cashappName
      );

      return c.json({ success: true, withdrawal: result }, 201);
    } catch (error) {
      console.error("Error creating cashapp withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create cashapp withdrawal",
        },
        500
      );
    }
  }

  static async createPaypalWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const { currency, amount, paypalEmail, paypalName } = await c.req.json();

      if (!currency || !amount || !paypalEmail || !paypalName) {
        return c.json(
          {
            error: "Missing required fields: currency, amount, paypalEmail, and paypalName are required",
          },
          400
        );
      }

      const result = await withdrawalService.createPaypalWithdrawal(
        user.id,
        currency,
        amount,
        paypalEmail,
        paypalName
      );

      return c.json({ success: true, withdrawal: result }, 201);
    } catch (error) {
      console.error("Error creating paypal withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create paypal withdrawal",
        },
        500
      );
    }
  }

  static async createBankWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const { currency, amount, bankName, bankAccountNumber, bankAccountName } = await c.req.json();

      if (!currency || !amount || !bankName || !bankAccountNumber || !bankAccountName) {
        return c.json({ error: "Missing required fields: currency, amount, bankName, bankAccountNumber, and bankAccountName are required" }, 400);
      }

      const result = await withdrawalService.createBankWithdrawal(
        user.id,
        currency,
        amount,
        bankName,
        bankAccountNumber,
        bankAccountName
      );

      return c.json({ success: true, withdrawal: result }, 201);
    } catch (error) {
      console.error("Error creating bank withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create bank withdrawal",
        },
        500
      );
    }
  }

  static async getUserWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const withdrawals = await withdrawalService.getUserWithdrawals(user.id);
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting user withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get withdrawals",
        },
        500
      );
    }
  }

  static async getUserCashappWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const withdrawals = await withdrawalService.getUserCashappWithdrawals(user.id);
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting user cashapp withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get user cashapp withdrawals",
        },
        500
      );
    }
  }

  static async getUserPaypalWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const withdrawals = await withdrawalService.getUserPaypalWithdrawals(user.id);
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting user paypal withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get user paypal withdrawals",
        },
        500
      );
    }
  }

  static async getUserBankWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const withdrawals = await withdrawalService.getUserBankWithdrawals(user.id);
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting user bank withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get user bank withdrawals",
        },
        500
      );
    }
  }
  

  static async approveWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      const result = await withdrawalService.approveWithdrawal(withdrawalId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to approve withdrawal",
        },
        500
      );
    }
  }

  static async approveCashappWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      const result = await withdrawalService.approveCashappWithdrawal(withdrawalId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving cashapp withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to approve cashapp withdrawal",
        },
        500
      );
    }
  }

  static async approvePaypalWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      const result = await withdrawalService.approvePaypalWithdrawal(withdrawalId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving paypal withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to approve paypal withdrawal",
        },
        500
      );
    }
  }

  static async approveBankWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      const result = await withdrawalService.approveBankWithdrawal(withdrawalId);
      return c.json(result, 200);
    } catch (error) {
      console.error("Error approving bank withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to approve bank withdrawal",
        },
        500
      );
    }
  }

  static async rejectWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      console.log(withdrawalId);
      const { rejectionReason } = await c.req.json();
      console.log(rejectionReason);
      if (!rejectionReason) {
        return c.json(
          { error: "Rejection reason is required" },
          400
        );
      }

      const result = await withdrawalService.rejectWithdrawal(withdrawalId, rejectionReason);
      return c.json({ success: true, withdrawal: result }, 200);
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to reject withdrawal",
        },
        500
      );
    }
  }

  static async rejectCashappWithdrawal(c: Context) {
    console.log("rejectCashappWithdrawal");
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      console.log(withdrawalId);
      const { rejectionReason } = await c.req.json();
      console.log(rejectionReason);
      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }
      const result = await withdrawalService.rejectCashappWithdrawal(withdrawalId, rejectionReason);
      return c.json({ success: true, withdrawal: result }, 200);
    } catch (error) {
      console.error("Error rejecting cashapp withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to reject cashapp withdrawal",
        },
        500
      );
    }
  }

  static async rejectPaypalWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      const { rejectionReason } = await c.req.json();
      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }

      const result = await withdrawalService.rejectPaypalWithdrawal(withdrawalId, rejectionReason);
      return c.json({ success: true, withdrawal: result }, 200);
    } catch (error) {
      console.error("Error rejecting paypal withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to reject paypal withdrawal",
        },
        500
      );
    }
  }

  static async rejectBankWithdrawal(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Unauthorized: Admin access required" }, 403);
      }

      const withdrawalId = c.req.param("id");
      const { rejectionReason } = await c.req.json();
      if (!rejectionReason) {
        return c.json({ error: "Rejection reason is required" }, 400);
      }
      const result = await withdrawalService.rejectBankWithdrawal(withdrawalId, rejectionReason);
      return c.json({ success: true, withdrawal: result }, 200);
    } catch (error) {
      console.error("Error rejecting bank withdrawal:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to reject bank withdrawal",
        },
        500
      );
    }
  }

  static async getUserApprovedWithdrawals(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const withdrawals = await withdrawalService.getUserApprovedWithdrawalsAmount(user.id);
      return c.json({ data: withdrawals }, 200);
    } catch (error) {
      console.error("Error getting user approved withdrawals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get approved withdrawals",
        },
        500
      );
    }
  }
} 