import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { InvestmentController } from "../controllers/investment.controller.js";

const investmentRouter = new Hono();

// Apply authentication middleware to all investment routes
investmentRouter.use("*", requireAuth);

// Investment routes
investmentRouter.post("/", InvestmentController.createInvestment);
investmentRouter.get("/", InvestmentController.getUserInvestments);

// Admin routes - MUST come before /:id to avoid route conflicts
investmentRouter.get(
  "/all",
  requireAdmin,
  InvestmentController.getAllInvestments
);
investmentRouter.post(
  "/:id/status",
  requireAdmin,
  InvestmentController.updateInvestmentStatus
);
investmentRouter.post(
  "/:id/profit",
  requireAdmin,
  InvestmentController.updateInvestmentProfit
);

// Dynamic routes - MUST come after specific routes like /all
investmentRouter.get("/:id", InvestmentController.getInvestmentById);

export default investmentRouter;
