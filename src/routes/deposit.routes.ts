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
depositRouter.post("/cashapp", DepositController.createCashappDeposit);
depositRouter.get("/cashapp/all", requireAdmin, DepositController.getAllCashappDeposits);
depositRouter.get("/cashapp/images/:filename", DepositController.serveCashappDepositProof);
depositRouter.get("/cashapp/:id", DepositController.getUserCashappDepositById);
depositRouter.post("/cashapp/:id/proof", DepositController.uploadCashappDepositProof);


// Admin-only deposit management routes
depositRouter.use("/*", requireAdmin);
depositRouter.get("/all", DepositController.getAllDeposits);
depositRouter.get("/:id/approve", DepositController.approveDeposit);
depositRouter.get("/:id/approve/cashapp", DepositController.approveCashappDeposit);
depositRouter.post("/:id/reject", DepositController.rejectDeposit);
depositRouter.post("/:id/reject/cashapp", DepositController.rejectCashappDeposit);
depositRouter.post("/:id/fail", DepositController.markDepositAsFailed);
depositRouter.post("/:id/fail/cashapp", DepositController.markCashappDepositAsFailed);
export default depositRouter;
