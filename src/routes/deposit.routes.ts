import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { DepositController } from "../controllers/deposit.controller.js";

const depositRouter = new Hono();

// Apply authentication middleware to all deposit routes
depositRouter.use("*", requireAuth);

// User deposit routes
depositRouter.post("/", DepositController.createDeposit);
depositRouter.get("/", DepositController.getUserDeposits);
depositRouter.get("/cashapp", DepositController.getUserCashappDeposits);
depositRouter.get("/paypal", DepositController.getUserPaypalDeposits);
depositRouter.get("/bank", DepositController.getUserBankDeposits);
depositRouter.post("/cashapp", DepositController.createCashappDeposit);
depositRouter.post("/paypal", DepositController.createPaypalDeposit);
depositRouter.post("/bank", DepositController.createBankDeposit);
depositRouter.get("/cashapp/all", requireAdmin, DepositController.getAllCashappDeposits);
depositRouter.get("/paypal/all", requireAdmin, DepositController.getAllPaypalDeposits);
depositRouter.get("/bank/all", requireAdmin, DepositController.getAllBankDeposits);
depositRouter.get("/cashapp/images/:filename", DepositController.serveCashappDepositProof);
depositRouter.get("/paypal/images/:filename", DepositController.servePaypalDepositProof);
depositRouter.get("/bank/images/:filename", DepositController.serveBankDepositProof);
depositRouter.get("/cashapp/:id", DepositController.getUserCashappDepositById);
depositRouter.get("/paypal/:id", DepositController.getUserPaypalDepositById);
depositRouter.get("/bank/:id", DepositController.getUserBankDepositById);
depositRouter.post("/cashapp/:id/proof", DepositController.uploadCashappDepositProof);
depositRouter.post("/paypal/:id/proof", DepositController.uploadPaypalDepositProof);
depositRouter.post("/bank/:id/proof", DepositController.uploadBankDepositProof);

// Admin-only deposit management routes
depositRouter.use("/*", requireAdmin);
depositRouter.get("/all", DepositController.getAllDeposits);
depositRouter.get("/:id/approve", DepositController.approveDeposit);
depositRouter.get("/:id/approve/cashapp", DepositController.approveCashappDeposit);
depositRouter.get("/:id/approve/paypal", DepositController.approvePaypalDeposit);
depositRouter.get("/:id/approve/bank", DepositController.approveBankDeposit);
depositRouter.post("/:id/reject", DepositController.rejectDeposit);
depositRouter.post("/:id/reject/cashapp", DepositController.rejectCashappDeposit);
depositRouter.post("/:id/reject/paypal", DepositController.rejectPaypalDeposit);
depositRouter.post("/:id/reject/bank", DepositController.rejectBankDeposit);
depositRouter.post("/:id/fail", DepositController.markDepositAsFailed);
depositRouter.post("/:id/fail/cashapp", DepositController.markCashappDepositAsFailed);
depositRouter.post("/:id/fail/paypal", DepositController.markPaypalDepositAsFailed);
depositRouter.post("/:id/fail/bank", DepositController.markBankDepositAsFailed);
export default depositRouter;
