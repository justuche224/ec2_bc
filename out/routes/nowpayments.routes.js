import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { NowPaymentsController } from "../controllers/nowpayments.controller.js";
const nowPaymentsRouter = new Hono();
// Webhook listener - no cookie session auth, authenticated via HMAC-SHA512 header
nowPaymentsRouter.post("/ipn", NowPaymentsController.handleIpn);
// Currency list and price estimate
nowPaymentsRouter.get("/currencies", NowPaymentsController.getCurrencies);
nowPaymentsRouter.get("/estimate", NowPaymentsController.getEstimate);
// Protected user deposit routes
nowPaymentsRouter.post("/create", requireAuth, NowPaymentsController.createDeposit);
nowPaymentsRouter.get("/status/:paymentId", requireAuth, NowPaymentsController.getStatus);
export default nowPaymentsRouter;
