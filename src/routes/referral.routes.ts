import { Hono } from "hono";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ReferralController } from "../controllers/referral.controller.js";

const referralRouter = new Hono();

// Public route for signup referrals - no auth required
referralRouter.post("/signup", ReferralController.createReferralFromSignup);

// Apply authentication middleware to remaining referral routes
referralRouter.use("/*", requireAuth);

// Authenticated referral routes
referralRouter.post("/", ReferralController.createReferral);
referralRouter.get("/", ReferralController.getUserReferrals);
referralRouter.get("/stats", ReferralController.getReferralStats);

// Admin referral routes
referralRouter.post("/admin/create", requireAdmin, ReferralController.adminCreateReferral);
referralRouter.delete("/admin/:id", requireAdmin, ReferralController.deleteReferral);

export default referralRouter;
