import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { WithdrawalController } from "../controllers/withdrawal.controller.js";
const withdrawalRouter = new Hono();
// Apply authentication middleware to all withdrawal routes
withdrawalRouter.use("*", requireAuth);
// User withdrawal routes
withdrawalRouter.post("/", WithdrawalController.createWithdrawal);
withdrawalRouter.get("/", WithdrawalController.getUserWithdrawals);
withdrawalRouter.post("/cashapp", WithdrawalController.createCashappWithdrawal);
withdrawalRouter.get("/cashapp", WithdrawalController.getUserCashappWithdrawals);
withdrawalRouter.post("/paypal", WithdrawalController.createPaypalWithdrawal);
withdrawalRouter.get("/paypal", WithdrawalController.getUserPaypalWithdrawals);
withdrawalRouter.post("/bank", WithdrawalController.createBankWithdrawal);
withdrawalRouter.get("/bank", WithdrawalController.getUserBankWithdrawals);
// Admin-only withdrawal management routes
withdrawalRouter.use("/*", requireAdmin);
withdrawalRouter.get("/all", WithdrawalController.getAllWithdrawals);
withdrawalRouter.get("/:id/approve", WithdrawalController.approveWithdrawal);
withdrawalRouter.post("/:id/reject", WithdrawalController.rejectWithdrawal);
withdrawalRouter.get("/cashapp/all", WithdrawalController.getAllCashappWithdrawals);
withdrawalRouter.get("/cashapp/:id/approve", WithdrawalController.approveCashappWithdrawal);
withdrawalRouter.post("/cashapp/:id/reject", WithdrawalController.rejectCashappWithdrawal);
withdrawalRouter.get("/paypal/all", WithdrawalController.getAllPaypalWithdrawals);
withdrawalRouter.get("/paypal/:id/approve", WithdrawalController.approvePaypalWithdrawal);
withdrawalRouter.post("/paypal/:id/reject", WithdrawalController.rejectPaypalWithdrawal);
withdrawalRouter.get("/bank/all", WithdrawalController.getAllBankWithdrawals);
withdrawalRouter.get("/bank/:id/approve", WithdrawalController.approveBankWithdrawal);
withdrawalRouter.post("/bank/:id/reject", WithdrawalController.rejectBankWithdrawal);
export default withdrawalRouter;
