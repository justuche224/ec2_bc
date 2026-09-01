import { AcademyService } from "../services/academy.service.js";
import { join } from "path";
import { readFile } from "fs/promises";
import { config } from "../config/index.js";
const academyService = AcademyService.getInstance();
export class AcademyController {
    // Settings
    static async getSettings(c) {
        try {
            const settings = await academyService.getSettings();
            return c.json(settings, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to get settings" }, 500);
        }
    }
    static async updateSettings(c) {
        try {
            const data = await c.req.json();
            const settings = await academyService.updateSettings(data);
            return c.json(settings, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to update settings" }, 500);
        }
    }
    // Items
    static async getAllItems(c) {
        try {
            const type = c.req.query("type");
            const items = await academyService.getAllItems(type);
            return c.json({ data: items }, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to get items" }, 500);
        }
    }
    static async getItem(c) {
        try {
            const id = c.req.param("id");
            const item = await academyService.getItem(id);
            return c.json(item, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to get item" }, 404);
        }
    }
    static async createItem(c) {
        try {
            const formData = await c.req.formData();
            const type = formData.get("type");
            const title = formData.get("title");
            const description = formData.get("description");
            const price = parseFloat(formData.get("price"));
            const coverImageFile = formData.get("coverImage");
            const deliveryFile = formData.get("deliveryFile");
            const deliveryUrl = formData.get("deliveryUrl");
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
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to create item" }, 500);
        }
    }
    static async updateItem(c) {
        try {
            const id = c.req.param("id");
            const formData = await c.req.formData();
            const updateData = {};
            if (formData.has("title"))
                updateData.title = formData.get("title");
            if (formData.has("description"))
                updateData.description = formData.get("description");
            if (formData.has("price"))
                updateData.price = parseFloat(formData.get("price"));
            if (formData.has("type"))
                updateData.type = formData.get("type");
            if (formData.has("coverImage"))
                updateData.coverImageFile = formData.get("coverImage");
            if (formData.has("deliveryFile"))
                updateData.deliveryFile = formData.get("deliveryFile");
            if (formData.has("deliveryUrl"))
                updateData.deliveryUrl = formData.get("deliveryUrl");
            const item = await academyService.updateItem(id, updateData);
            return c.json(item, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to update item" }, 500);
        }
    }
    static async deleteItem(c) {
        try {
            const id = c.req.param("id");
            await academyService.deleteItem(id);
            return c.json({ success: true }, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to delete item" }, 500);
        }
    }
    // File serving
    static async getCoverImage(c) {
        try {
            const filename = c.req.param("filename");
            const filepath = join(config.storage.academyImages, filename);
            const buffer = await readFile(filepath);
            return new Response(buffer, {
                status: 200,
                headers: { "Content-Type": "image/jpeg" },
            });
        }
        catch (error) {
            return new Response("Image not found", { status: 404 });
        }
    }
    static async getDeliveryFile(c) {
        try {
            const filename = c.req.param("filename");
            const filepath = join(config.storage.academyFiles, filename);
            const buffer = await readFile(filepath);
            return new Response(buffer, {
                status: 200,
                headers: { "Content-Disposition": `attachment; filename="${filename}"` },
            });
        }
        catch (error) {
            return new Response("File not found", { status: 404 });
        }
    }
    static async getProofImage(c) {
        try {
            const filename = c.req.param("filename");
            const filepath = join(config.storage.academyProofs, filename);
            const buffer = await readFile(filepath);
            return new Response(buffer, {
                status: 200,
                headers: { "Content-Type": "image/jpeg" },
            });
        }
        catch (error) {
            return new Response("Image not found", { status: 404 });
        }
    }
    // Purchases
    static async submitPurchase(c) {
        try {
            const user = c.get("user");
            const formData = await c.req.formData();
            const itemId = formData.get("itemId");
            const amount = parseFloat(formData.get("amount"));
            const proofFile = formData.get("proof");
            const marketerCode = formData.get("marketerCode");
            if (!itemId || isNaN(amount) || !proofFile) {
                return c.json({ error: "Missing required fields" }, 400);
            }
            const purchase = await academyService.submitPurchase(user.id, itemId, amount, proofFile, marketerCode);
            return c.json(purchase, 201);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to submit purchase" }, 500);
        }
    }
    static async getPurchases(c) {
        try {
            const user = c.get("user");
            // Admin sees all, user sees their own
            const purchases = await academyService.getPurchases(user.role === "ADMIN" ? undefined : user.id);
            return c.json({ data: purchases }, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to get purchases" }, 500);
        }
    }
    static async verifyPurchase(c) {
        try {
            const id = c.req.param("id");
            const { status, reason } = await c.req.json();
            if (!status || !["APPROVED", "REJECTED"].includes(status)) {
                return c.json({ error: "Invalid status" }, 400);
            }
            const purchase = await academyService.verifyPurchase(id, status, reason);
            return c.json(purchase, 200);
        }
        catch (error) {
            return c.json({ error: error instanceof Error ? error.message : "Failed to verify purchase" }, 500);
        }
    }
}
