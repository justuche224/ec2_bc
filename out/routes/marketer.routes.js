import { Hono } from "hono";
import { MarketerController } from "../controllers/marketer.controller.js";
import { requireMarketer } from "../middleware/marketer-auth.js";
const marketerRouter = new Hono();
// Public routes
marketerRouter.post("/register", MarketerController.register);
marketerRouter.post("/login", MarketerController.login);
marketerRouter.get("/validate-code/:code", MarketerController.validateCode);
marketerRouter.post("/track-signup", MarketerController.trackSignup);
// Authenticated marketer routes
const authRouter = new Hono();
authRouter.use("/*", requireMarketer);
authRouter.get("/me", MarketerController.getProfile);
authRouter.put("/me", MarketerController.updateProfile);
authRouter.get("/dashboard", MarketerController.getDashboardStats);
authRouter.get("/referrals", MarketerController.getReferrals);
authRouter.get("/commissions", MarketerController.getCommissions);
marketerRouter.route("/", authRouter);
export default marketerRouter;
