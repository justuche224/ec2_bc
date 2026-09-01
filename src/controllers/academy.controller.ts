import type { Context } from "hono";
import { AcademyService } from "../services/academy.service.js";
import { join } from "path";
import { readFile } from "fs/promises";
import { config } from "../config/index.js";

const academyService = AcademyService.getInstance();

export class AcademyController {
  // Settings
  static async getSettings(c: Context) {
    try {
      const settings = await academyService.getSettings();
      return c.json(settings, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to get settings" }, 500);
    }
  }

  static async updateSettings(c: Context) {
    try {
      const data = await c.req.json();
      const settings = await academyService.updateSettings(data);
      return c.json(settings, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update settings" }, 500);
    }
  }

  // Items
  static async getAllItems(c: Context) {
    try {
      const type = c.req.query("type") as "BOOK" | "COURSE" | undefined;
      const items = await academyService.getAllItems(type);
      return c.json({ data: items }, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to get items" }, 500);
    }
  }

  static async getItem(c: Context) {
    try {
      const id = c.req.param("id");
      const item = await academyService.getItem(id);
      return c.json(item, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to get item" }, 404);
    }
  }

  static async createItem(c: Context) {
    try {
      const formData = await c.req.formData();
      const type = formData.get("type") as "BOOK" | "COURSE";
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const price = parseFloat(formData.get("price") as string);
      const coverImageFile = formData.get("coverImage") as File;
      const deliveryFile = formData.get("deliveryFile") as File | null;
      const deliveryUrl = formData.get("deliveryUrl") as string | null;

      if (!type || !title || !description || isNaN(price) || !coverImageFile) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const item = await academyService.createItem({
        type,
        title,
        description,
        price,
        coverImageFile,
        deliveryFile: deliveryFile || undefined,
        deliveryUrl: deliveryUrl || undefined,
      });

      return c.json(item, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create item" }, 500);
    }
  }

  static async updateItem(c: Context) {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData();
      
      const updateData: any = {};
      if (formData.has("title")) updateData.title = formData.get("title");
      if (formData.has("description")) updateData.description = formData.get("description");
      if (formData.has("price")) updateData.price = parseFloat(formData.get("price") as string);
      if (formData.has("type")) updateData.type = formData.get("type");
      if (formData.has("coverImage")) updateData.coverImageFile = formData.get("coverImage");
      if (formData.has("deliveryFile")) updateData.deliveryFile = formData.get("deliveryFile");
      if (formData.has("deliveryUrl")) updateData.deliveryUrl = formData.get("deliveryUrl");

      const item = await academyService.updateItem(id, updateData);
      return c.json(item, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update item" }, 500);
    }
  }

  static async deleteItem(c: Context) {
    try {
      const id = c.req.param("id");
      await academyService.deleteItem(id);
      return c.json({ success: true }, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to delete item" }, 500);
    }
  }

  // File serving
  static async getCoverImage(c: Context) {
    try {
      const filename = c.req.param("filename");
      const filepath = join(config.storage.academyImages, filename);
      const buffer = await readFile(filepath);
      return new Response(buffer, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    } catch (error) {
      return new Response("Image not found", { status: 404 });
    }
  }

  static async getDeliveryFile(c: Context) {
    try {
      const filename = c.req.param("filename");
      const filepath = join(config.storage.academyFiles, filename);
      const buffer = await readFile(filepath);
      return new Response(buffer, {
        status: 200,
        headers: { "Content-Disposition": `attachment; filename="${filename}"` },
      });
    } catch (error) {
      return new Response("File not found", { status: 404 });
    }
  }
  
  static async getProofImage(c: Context) {
    try {
      const filename = c.req.param("filename");
      const filepath = join(config.storage.academyProofs, filename);
      const buffer = await readFile(filepath);
      return new Response(buffer, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    } catch (error) {
      return new Response("Image not found", { status: 404 });
    }
  }

  // Purchases
  static async submitPurchase(c: Context) {
    try {
      const user = c.get("user");
      const formData = await c.req.formData();
      const itemId = formData.get("itemId") as string;
      const amount = parseFloat(formData.get("amount") as string);
      const proofFile = formData.get("proof") as File;
      const marketerCode = formData.get("marketerCode") as string | undefined;

      if (!itemId || isNaN(amount) || !proofFile) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      const purchase = await academyService.submitPurchase(user.id, itemId, amount, proofFile, marketerCode);
      return c.json(purchase, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to submit purchase" }, 500);
    }
  }

  static async getPurchases(c: Context) {
    try {
      const user = c.get("user");
      // Admin sees all, user sees their own
      const purchases = await academyService.getPurchases(user.role === "ADMIN" ? undefined : user.id);
      return c.json({ data: purchases }, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to get purchases" }, 500);
    }
  }

  static async verifyPurchase(c: Context) {
    try {
      const id = c.req.param("id");
      const { status, reason } = await c.req.json();
      
      if (!status || !["APPROVED", "REJECTED"].includes(status)) {
        return c.json({ error: "Invalid status" }, 400);
      }

      const purchase = await academyService.verifyPurchase(id, status as "APPROVED"|"REJECTED", reason);
      return c.json(purchase, 200);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to verify purchase" }, 500);
    }
  }
}
