import { Hono } from "hono";
import { UserController } from "../controllers/user.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const userRouter = new Hono();

// Public routes
userRouter.get("/public/:id", UserController.getPublicUser);
userRouter.get("/profile-picture/:filename", UserController.getProfilePicture);

// Apply authentication middleware to all other user routes
userRouter.use("*", requireAuth);

// Get a single user (accessible by the user themselves or admin)
userRouter.get("/:id", UserController.getUser);

// Get all users (admin only)
userRouter.get("/", requireAdmin, UserController.getAllUsers);

// Delete users (admin only)
userRouter.delete("/", requireAdmin, UserController.deleteUsers);

// Update user info (accessible by the user themselves or admin)
userRouter.put("/:id", UserController.updateUserInfo);

// Profile picture routes (update only, get is public)
userRouter.put("/:id/profile-picture", UserController.updateProfilePicture);

export default userRouter; 