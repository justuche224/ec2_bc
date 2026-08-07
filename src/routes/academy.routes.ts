import { Hono } from "hono";
import { AcademyController } from "../controllers/academy.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = new Hono();

// Public routes for fetching items
router.get("/items", AcademyController.getAllItems);
router.get("/items/:id", AcademyController.getItem);
router.get("/settings", AcademyController.getSettings);

// Public routes for images/files
router.get("/image/:filename", AcademyController.getCoverImage);
router.get("/download/:filename", AcademyController.getDeliveryFile);
router.get("/proof/:filename", requireAuth, AcademyController.getProofImage);

// Protected routes for purchasing
router.post("/purchases", requireAuth, AcademyController.submitPurchase);
router.get("/purchases", requireAuth, AcademyController.getPurchases); 

// Admin routes for managing items and settings
router.post("/items", requireAuth, requireAdmin, AcademyController.createItem);
router.put("/items/:id", requireAuth, requireAdmin, AcademyController.updateItem);
router.delete("/items/:id", requireAuth, requireAdmin, AcademyController.deleteItem);

router.put("/settings", requireAuth, requireAdmin, AcademyController.updateSettings);

// Admin routes for verifying purchases
router.post("/purchases/:id/verify", requireAuth, requireAdmin, AcademyController.verifyPurchase);

export default router;
