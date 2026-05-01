import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { WithdrawalController } from "../controllers/withdrawal.controller.js";

const withdrawalRouter = new Hono();

// Apply authentication middleware to all withdrawal routes
withdrawalRouter.use("*", requireAuth);

// User withdrawal routes
withdrawalRouter.get("/lock-status", WithdrawalController.getLockStatus);
withdrawalRouter.post("/", WithdrawalController.createWithdrawal);
withdrawalRouter.get("/", WithdrawalController.getUserWithdrawals);
withdrawalRouter.post("/cashapp", WithdrawalController.createCashappWithdrawal);
withdrawalRouter.get("/cashapp", WithdrawalController.getUserCashappWithdrawals);
withdrawalRouter.post("/paypal", WithdrawalController.createPaypalWithdrawal);
withdrawalRouter.get("/paypal", WithdrawalController.getUserPaypalWithdrawals);
withdrawalRouter.post("/bank", WithdrawalController.createBankWithdrawal);
withdrawalRouter.get("/bank", WithdrawalController.getUserBankWithdrawals);

// Admin-only withdrawal management routes
withdrawalRouter.post("/admin/create", requireAdmin, WithdrawalController.adminCreateWithdrawal);
withdrawalRouter.delete("/admin/:id", requireAdmin, WithdrawalController.deleteWithdrawal);
withdrawalRouter.get("/all", requireAdmin, WithdrawalController.getAllWithdrawals);
withdrawalRouter.get("/:id/approve", requireAdmin, WithdrawalController.approveWithdrawal);
withdrawalRouter.post("/:id/reject", requireAdmin, WithdrawalController.rejectWithdrawal);
withdrawalRouter.get("/cashapp/all", requireAdmin, WithdrawalController.getAllCashappWithdrawals);
withdrawalRouter.get("/cashapp/:id/approve", requireAdmin, WithdrawalController.approveCashappWithdrawal);
withdrawalRouter.post("/cashapp/:id/reject", requireAdmin, WithdrawalController.rejectCashappWithdrawal);
withdrawalRouter.get("/paypal/all", requireAdmin, WithdrawalController.getAllPaypalWithdrawals);
withdrawalRouter.get("/paypal/:id/approve", requireAdmin, WithdrawalController.approvePaypalWithdrawal);
withdrawalRouter.post("/paypal/:id/reject", requireAdmin, WithdrawalController.rejectPaypalWithdrawal);
withdrawalRouter.get("/bank/all", requireAdmin, WithdrawalController.getAllBankWithdrawals);
withdrawalRouter.get("/bank/:id/approve", requireAdmin, WithdrawalController.approveBankWithdrawal);
withdrawalRouter.post("/bank/:id/reject", requireAdmin, WithdrawalController.rejectBankWithdrawal);

export default withdrawalRouter; 