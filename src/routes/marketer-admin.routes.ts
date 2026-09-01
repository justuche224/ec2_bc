import { Hono } from "hono";
import db from "../db/index.js";
import { marketers, marketerReferrals, marketerCommissions, marketerSettings, user } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const marketerAdminRouter = new Hono();

// All routes require auth and admin
marketerAdminRouter.use("/*", requireAuth, requireAdmin);

// Get all marketers
marketerAdminRouter.get("/", async (c) => {
  try {
    const allMarketers = await db.query.marketers.findMany({
      orderBy: [desc(marketers.createdAt)],
      with: {
        referrals: {
          columns: { id: true, isActive: true }
        },
        commissions: {
          columns: { amount: true, status: true }
        }
      }
    });

    const enriched = allMarketers.map(m => {
      const { passwordHash, ...safeMarketer } = m;
      const activeReferrals = safeMarketer.referrals.filter(r => r.isActive).length;
      const totalEarnings = safeMarketer.commissions.reduce((sum, c) => sum + Number(c.amount), 0);
      
      return {
        ...safeMarketer,
        stats: {
          totalReferrals: safeMarketer.referrals.length,
          activeReferrals,
          totalEarnings
        }
      };
    });

    return c.json(enriched);
  } catch (error) {
    console.error("Get marketers admin error:", error);
    return c.json({ error: "Failed to get marketers" }, 500);
  }
});

// Get marketer details
marketerAdminRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const marketer = await db.query.marketers.findFirst({
      where: eq(marketers.id, id),
      with: {
        referrals: {
          with: {
            user: { columns: { name: true, email: true, kyc_verified: true, createdAt: true } }
          }
        },
        commissions: {
          with: {
            user: { columns: { name: true, email: true } }
          },
          orderBy: [desc(marketerCommissions.createdAt)]
        }
      }
    });

    if (!marketer) {
      return c.json({ error: "Marketer not found" }, 404);
    }

    const { passwordHash, ...safeMarketer } = marketer;
    return c.json(safeMarketer);
  } catch (error) {
    console.error("Get marketer details admin error:", error);
    return c.json({ error: "Failed to get marketer details" }, 500);
  }
});

// Update marketer status (Approve/Suspend)
marketerAdminRouter.put("/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();

    if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const [updated] = await db.update(marketers)
      .set({ status, updatedAt: new Date() })
      .where(eq(marketers.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Marketer not found" }, 404);
    }

    const { passwordHash, ...safeMarketer } = updated;
    return c.json(safeMarketer);
  } catch (error) {
    console.error("Update marketer status error:", error);
    return c.json({ error: "Failed to update marketer status" }, 500);
  }
});

// Get global commission settings
marketerAdminRouter.get("/settings/commissions", async (c) => {
  try {
    let settings = await db.query.marketerSettings.findFirst();
    if (!settings) {
      const [newSettings] = await db.insert(marketerSettings).values({}).returning();
      settings = newSettings;
    }
    return c.json(settings);
  } catch (error) {
    console.error("Get marketer settings error:", error);
    return c.json({ error: "Failed to get settings" }, 500);
  }
});

// Update global commission settings
marketerAdminRouter.put("/settings/commissions", async (c) => {
  try {
    const { depositCommissionPercent, bookCommissionPercent, courseCommissionPercent } = await c.req.json();
    
    let settings = await db.query.marketerSettings.findFirst();
    
    if (settings) {
      const [updated] = await db.update(marketerSettings)
        .set({
          depositCommissionPercent: depositCommissionPercent ?? settings.depositCommissionPercent,
          bookCommissionPercent: bookCommissionPercent ?? settings.bookCommissionPercent,
          courseCommissionPercent: courseCommissionPercent ?? settings.courseCommissionPercent,
          updatedAt: new Date()
        })
        .where(eq(marketerSettings.id, settings.id))
        .returning();
      return c.json(updated);
    } else {
      const [newSettings] = await db.insert(marketerSettings).values({
        depositCommissionPercent: depositCommissionPercent ?? 5,
        bookCommissionPercent: bookCommissionPercent ?? 10,
        courseCommissionPercent: courseCommissionPercent ?? 10
      }).returning();
      return c.json(newSettings);
    }
  } catch (error) {
    console.error("Update marketer settings error:", error);
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

export default marketerAdminRouter;
