import type { Context } from "hono";
import { ReferralService } from "../services/referral.service.js";
import { CrowdfundingService } from "../services/crowdfunding.service.js";
import { z } from "zod";

const referralService = ReferralService.getInstance();
const crowdfundingService = CrowdfundingService.getInstance();

const adminCreateReferralSchema = z.object({
  referrerId: z.string().min(1, "Referrer ID is required"),
  referreeId: z.string().min(1, "Referree ID is required"),
  rewardAmount: z.string().default("50"),
  adjustBalance: z.boolean().default(false),
});

export class ReferralController {
  // Public endpoint for signup referrals - no auth required
  // Creates both regular referral AND crowdfunding referral
  static async createReferralFromSignup(c: Context) {
    try {
      const { referrerId, referreeId } = await c.req.json();

      if (!referrerId || !referreeId) {
        return c.json(
          { error: "Missing required fields: referrerId and referreeId" },
          400
        );
      }

      // Prevent self-referral
      if (referrerId === referreeId) {
        return c.json({ error: "Cannot refer yourself" }, 400);
      }

      // Create regular referral
      const regularResult = await referralService.createReferral(
        referrerId,
        referreeId
      );

      // Also create pending crowdfunding referral (this won't fail if referrer hasn't invested)
      let crowdfundingResult = null;
      try {
        crowdfundingResult =
          await crowdfundingService.createPendingReferralFromSignup(
            referrerId,
            referreeId
          );
      } catch (cfError) {
        console.error("Failed to create crowdfunding referral:", cfError);
        // Don't fail the whole request if crowdfunding referral fails
      }

      return c.json(
        {
          ...regularResult,
          crowdfundingReferral: crowdfundingResult,
        },
        201
      );
    } catch (error) {
      console.error("Error creating referral from signup:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create referral",
        },
        500
      );
    }
  }

  // Authenticated endpoint - uses session user as referree
  static async createReferral(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const { referrerId } = await c.req.json();
      if (!referrerId) {
        return c.json({ error: "Missing required field: referrerId" }, 400);
      }

      // Prevent self-referral
      if (user.id === referrerId) {
        return c.json({ error: "Cannot refer yourself" }, 400);
      }

      const result = await referralService.createReferral(referrerId, user.id);
      return c.json(result, 201);
    } catch (error) {
      console.error("Error creating referral:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create referral",
        },
        500
      );
    }
  }

  static async getUserReferrals(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      let targetUserId = user.id;
      if (user.role === "ADMIN") {
        const queryUserId = c.req.query("userId");
        if (queryUserId) {
          targetUserId = queryUserId;
        }
      }

      const referrals = await referralService.getReferralsByReferrerId(targetUserId);
      return c.json({ data: referrals }, 200);
    } catch (error) {
      console.error("Error getting user referrals:", error);
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to get referrals",
        },
        500
      );
    }
  }

  static async getReferralStats(c: Context) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized: No user found" }, 401);
      }

      const stats = await referralService.getReferralStats(user.id);
      return c.json({ data: stats }, 200);
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to get referral stats",
        },
        500
      );
    }
  }

  static async adminCreateReferral(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Forbidden: Admin access required" }, 403);
      }

      const body = await c.req.json();
      const validationResult = adminCreateReferralSchema.safeParse(body);

      if (!validationResult.success) {
        return c.json(
          {
            error: "Invalid input",
            details: validationResult.error.flatten().fieldErrors,
          },
          400
        );
      }

      const { referrerId, referreeId, rewardAmount, adjustBalance } =
        validationResult.data;

      if (referrerId === referreeId) {
        return c.json({ error: "Referrer and referree cannot be the same" }, 400);
      }

      const referral = await referralService.adminCreateReferral(
        referrerId,
        referreeId,
        rewardAmount,
        adjustBalance
      );

      return c.json({ data: referral }, 201);
    } catch (error: unknown) {
      console.error("Error admin-creating referral:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create referral";
      const statusCode = errorMessage.includes("not found") ? 400 : 500;
      return c.json({ error: errorMessage }, statusCode);
    }
  }

  static async deleteReferral(c: Context) {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ error: "Forbidden: Admin access required" }, 403);
      }

      const referralId = c.req.param("id");
      if (!referralId) {
        return c.json({ error: "Referral ID is required" }, 400);
      }

      await referralService.deleteReferral(referralId);
      return c.json({ message: "Referral deleted successfully" }, 200);
    } catch (error: unknown) {
      console.error("Error deleting referral:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete referral";
      const statusCode = errorMessage.includes("not found") ? 404 : 500;
      return c.json({ error: errorMessage }, statusCode);
    }
  }
}
