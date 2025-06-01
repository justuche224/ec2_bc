import { DepositService } from "../services/deposit.service.js";
const depositService = DepositService.getInstance();
export class DepositController {
    static async serveCashappDepositProof(c) {
        try {
            const filename = c.req.param("filename");
            console.log("filename", filename);
            const user = c.get("user");
            const userId = user === null || user === void 0 ? void 0 : user.id;
            const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "ADMIN";
            if (!userId) {
                return c.json({ error: "Unauthorized: No user ID found" }, 401);
            }
            const fileBuffer = await depositService.getCashappDepositProof(filename);
            console.log("fileBuffer", fileBuffer);
            return new Response(fileBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "image/jpeg",
                },
            });
        }
        catch (error) {
            console.error("Error serving proof image:", error);
            return new Response(error instanceof Error ? error.message : "File not found", { status: 404 });
        }
    }
    static async getAllDeposits(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Unauthorized: Admin access required" }, 403);
            }
            const deposits = await depositService.getAllDeposits();
            return c.json({ data: deposits }, 200);
        }
        catch (error) {
            console.error("Error getting all deposits:", error);
            return c.json({
                error: error instanceof Error ? error.message : "Failed to get deposits",
            }, 500);
        }
    }
    static async getAllCashappDeposits(c) {
        console.log("getAllCashappDeposits");
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Unauthorized: Admin access required" }, 403);
            }
            const deposits = await depositService.getAllCashappDeposits();
            return c.json({ data: deposits }, 200);
        }
        catch (error) {
            console.error("Error getting all cashapp deposits:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to get cashapp deposits",
            }, 500);
        }
    }
    static async createDeposit(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const { systemWalletId, currency, amount } = await c.req.json();
            if (!systemWalletId || !currency || !amount) {
                return c.json({
                    error: "Missing required fields: systemWalletId, currency, and amount are required",
                }, 400);
            }
            const result = await depositService.createDeposit(user.id, systemWalletId, currency, amount);
            return c.json({ success: true, deposit: result }, 201);
        }
        catch (error) {
            console.error("Error creating deposit:", error);
            return c.json({
                error: error instanceof Error ? error.message : "Failed to create deposit",
            }, 500);
        }
    }
    static async createCashappDeposit(c) {
        try {
            console.log("createCashappDeposit");
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            console.log("user found");
            const { amount, cashtag, cashappName } = await c.req.json();
            console.log("amount, cashtag, cashappName", amount, cashtag, cashappName);
            if (!amount || !cashtag || !cashappName) {
                console.log("missing required fields");
                return c.json({ error: "Missing required fields" }, 400);
            }
            console.log("amount, cashtag, cashappName found");
            const result = await depositService.createCashappDeposit(user.id, amount, cashtag, cashappName);
            console.log("cashapp deposit created");
            return c.json({ success: true, deposit: result }, 201);
        }
        catch (error) {
            console.error("Error creating cashapp deposit:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to create cashapp deposit",
            }, 500);
        }
    }
    static async getUserCashappDeposits(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const deposits = await depositService.getCashappDeposits(user.id);
            return c.json({ data: deposits }, 200);
        }
        catch (error) {
            console.error("Error getting user deposits:", error);
            return c.json({
                error: error instanceof Error ? error.message : "Failed to get deposits",
            }, 500);
        }
    }
    static async getUserCashappDepositById(c) {
        console.log("getUserCashappDepositById");
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const depositId = c.req.param("id");
            console.log("depositId", depositId);
            if (!depositId) {
                return c.json({ error: "Deposit ID is required" }, 400);
            }
            const deposit = await depositService.getUserCashappDepositById(depositId, user.id);
            if (!deposit) {
                return c.json({ error: "Deposit not found" }, 404);
            }
            return c.json({ data: deposit }, 200);
        }
        catch (error) {
            console.error("Error getting user deposit:", error);
            return c.json({
                error: error instanceof Error ? error.message : "Failed to get deposit",
            }, 500);
        }
    }
    static async uploadCashappDepositProof(c) {
        console.log("uploadCashappDepositProof");
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            console.log("user found");
            const formData = await c.req.formData();
            const depositId = c.req.param("id");
            const proofFile = formData.get("proof");
            if (!depositId || !proofFile) {
                return c.json({ error: "Deposit ID and proof file are required" }, 400);
            }
            console.log("depositId and proofFile found");
            const result = await depositService.uploadCashappDepositProof(depositId, proofFile, user.id);
            console.log("result", result);
            return c.json({ success: true, deposit: result }, 200);
        }
        catch (error) {
            console.error("Error uploading cashapp deposit proof:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to upload cashapp deposit proof",
            }, 500);
        }
    }
    static async getUserDeposits(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const deposits = await depositService.getUserDeposits(user.id);
            return c.json({ data: deposits }, 200);
        }
        catch (error) {
            console.error("Error getting user deposits:", error);
            return c.json({
                error: error instanceof Error ? error.message : "Failed to get deposits",
            }, 500);
        }
    }
    static async approveDeposit(c) {
        console.log("approveDeposit");
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Unauthorized: Admin access required" }, 403);
            }
            const depositId = c.req.param("id");
            const result = await depositService.approveDeposit(depositId);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error approving deposit:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to approve deposit",
            }, 500);
        }
    }
    static async approveCashappDeposit(c) {
        try {
            const user = c.get("user");
            if (!user || user.role !== "ADMIN") {
                return c.json({ error: "Unauthorized: Admin access required" }, 403);
            }
            const depositId = c.req.param("id");
            console.log("depositId", depositId);
            const result = await depositService.approveCashappDeposit(depositId);
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error approving cashapp deposit:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to approve cashapp deposit",
            }, 500);
        }
    }
    static async rejectDeposit(c) {
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
            const result = await depositService.rejectDeposit(depositId, rejectionReason);
            return c.json({ success: true, deposit: result }, 200);
        }
        catch (error) {
            console.error("Error rejecting deposit:", error);
            return c.json({
                error: error instanceof Error ? error.message : "Failed to reject deposit",
            }, 500);
        }
    }
    static async rejectCashappDeposit(c) {
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
            const result = await depositService.rejectCashappDeposit(depositId, rejectionReason);
            return c.json({ success: true, deposit: result }, 200);
        }
        catch (error) {
            console.error("Error rejecting cashapp deposit:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to reject cashapp deposit",
            }, 500);
        }
    }
    static async markCashappDepositAsFailed(c) {
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
            const result = await depositService.markCashappDepositAsFailed(depositId, reason);
            return c.json({ success: true, deposit: result }, 200);
        }
        catch (error) {
            console.error("Error marking cashapp deposit as failed:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to mark cashapp deposit as failed",
            }, 500);
        }
    }
    static async markDepositAsFailed(c) {
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
            const result = await depositService.markDepositAsFailed(depositId, reason);
            return c.json({ success: true, deposit: result }, 200);
        }
        catch (error) {
            console.error("Error marking deposit as failed:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to mark deposit as failed",
            }, 500);
        }
    }
}
