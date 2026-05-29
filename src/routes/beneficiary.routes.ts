import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { BeneficiaryController } from "../controllers/beneficiary.controller.js";

const beneficiaryRouter = new Hono();

// All beneficiary routes require authentication
beneficiaryRouter.use("/*", requireAuth);

beneficiaryRouter.post("/", BeneficiaryController.create);
beneficiaryRouter.get("/", BeneficiaryController.list);
beneficiaryRouter.get("/:id", BeneficiaryController.getById);
beneficiaryRouter.put("/:id", BeneficiaryController.update);
beneficiaryRouter.delete("/:id", BeneficiaryController.remove);

export default beneficiaryRouter;
