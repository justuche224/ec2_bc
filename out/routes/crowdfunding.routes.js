import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { CrowdfundingController } from "../controllers/crowdfunding.controller.js";
const crowdfundingRouter = new Hono();
// Apply authentication middleware to all routes
crowdfundingRouter.use("*", requireAuth);
// Settings routes
crowdfundingRouter.get("/settings", CrowdfundingController.getSettings);
crowdfundingRouter.put("/settings", requireAdmin, CrowdfundingController.updateSettings);
// Pool routes - MUST come before /:id routes
crowdfundingRouter.get("/pools", CrowdfundingController.getAllPools);
crowdfundingRouter.post("/pools", requireAdmin, CrowdfundingController.createPool);
crowdfundingRouter.get("/pools/:id", CrowdfundingController.getPool);
crowdfundingRouter.put("/pools/:id", requireAdmin, CrowdfundingController.updatePool);
crowdfundingRouter.delete("/pools/:id", requireAdmin, CrowdfundingController.deletePool);
crowdfundingRouter.post("/pools/:id/join", CrowdfundingController.joinPool);
// Investment routes - User
crowdfundingRouter.get("/my-investments", CrowdfundingController.getUserInvestments);
// Investment routes - Admin
crowdfundingRouter.get("/investments", requireAdmin, CrowdfundingController.getAllInvestments);
crowdfundingRouter.put("/investments/:id", requireAdmin, CrowdfundingController.updateInvestment);
// Referral routes
crowdfundingRouter.get("/my-referrals", CrowdfundingController.getUserReferrals);
crowdfundingRouter.post("/referrals", CrowdfundingController.createReferral);
crowdfundingRouter.put("/referrals/:id/complete", requireAdmin, CrowdfundingController.markReferralComplete);
// Stats route
crowdfundingRouter.get("/stats", CrowdfundingController.getSystemStats);
export default crowdfundingRouter;
