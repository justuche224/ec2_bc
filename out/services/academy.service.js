import db from "../db/index.js";
import { academyItems, academyPurchases, academySettings, user } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import sharp from "sharp";
import { config } from "../config/index.js";
import { mailService } from "./mail.service.js";
export class AcademyService {
    constructor() { }
    static getInstance() {
        if (!AcademyService.instance) {
            AcademyService.instance = new AcademyService();
        }
        return AcademyService.instance;
    }
    // --- SETTINGS ---
    async getSettings() {
        let settings = await db.select().from(academySettings).limit(1);
        if (!settings.length) {
            const newSettings = await db.insert(academySettings).values({
                id: uuidv4(),
            }).returning();
            return newSettings[0];
        }
        return settings[0];
    }
    async updateSettings(data) {
        let settings = await db.select().from(academySettings).limit(1);
        if (!settings.length) {
            const newSettings = await db.insert(academySettings).values(Object.assign({ id: uuidv4() }, data)).returning();
            return newSettings[0];
        }
        else {
            const updated = await db.update(academySettings).set(Object.assign(Object.assign({}, data), { updatedAt: new Date() })).where(eq(academySettings.id, settings[0].id)).returning();
            return updated[0];
        }
    }
    // --- ITEMS ---
    async getAllItems(type) {
        const query = db.select().from(academyItems);
        if (type) {
            query.where(eq(academyItems.type, type));
        }
        const items = await query.orderBy(desc(academyItems.createdAt));
        return items.map(item => (Object.assign(Object.assign({}, item), { coverImageUrl: `${process.env.BASE_URL}/api/academy/image/${item.coverImage}` })));
    }
    async getItem(id) {
        const items = await db.select().from(academyItems).where(eq(academyItems.id, id)).limit(1);
        if (!items.length)
            throw new Error("Item not found");
        const item = items[0];
        return Object.assign(Object.assign({}, item), { coverImageUrl: `${process.env.BASE_URL}/api/academy/image/${item.coverImage}` });
    }
    async createItem(data) {
        if (!data.coverImageFile.type.startsWith("image/")) {
            throw new Error("Cover file must be an image");
        }
        const coverFilename = `${uuidv4()}-${data.coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const coverPath = join(config.storage.academyImages, coverFilename);
        const coverBuffer = Buffer.from(await data.coverImageFile.arrayBuffer());
        await sharp(coverBuffer)
            .resize(800, 1000, { fit: "inside" })
            .jpeg({ quality: 80 })
            .toFile(coverPath);
        let deliveryLink = data.deliveryUrl || "";
        if (data.deliveryFile) {
            const deliveryFilename = `${uuidv4()}-${data.deliveryFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const deliveryPath = join(config.storage.academyFiles, deliveryFilename);
            const deliveryBuffer = Buffer.from(await data.deliveryFile.arrayBuffer());
            await writeFile(deliveryPath, deliveryBuffer);
            deliveryLink = deliveryFilename;
        }
        const newItem = await db.insert(academyItems).values({
            id: uuidv4(),
            type: data.type,
            title: data.title,
            description: data.description,
            price: data.price,
            coverImage: coverFilename,
            deliveryLink,
        }).returning();
        return Object.assign(Object.assign({}, newItem[0]), { coverImageUrl: `${process.env.BASE_URL}/api/academy/image/${coverFilename}` });
    }
    async updateItem(id, data) {
        const existing = await db.select().from(academyItems).where(eq(academyItems.id, id)).limit(1);
        if (!existing.length)
            throw new Error("Item not found");
        const updateData = {};
        if (data.title)
            updateData.title = data.title;
        if (data.description)
            updateData.description = data.description;
        if (data.price)
            updateData.price = data.price;
        if (data.type)
            updateData.type = data.type;
        if (data.coverImageFile) {
            if (!data.coverImageFile.type.startsWith("image/"))
                throw new Error("Cover must be an image");
            // delete old
            try {
                await unlink(join(config.storage.academyImages, existing[0].coverImage));
            }
            catch (e) { }
            const coverFilename = `${uuidv4()}-${data.coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const coverPath = join(config.storage.academyImages, coverFilename);
            const coverBuffer = Buffer.from(await data.coverImageFile.arrayBuffer());
            await sharp(coverBuffer)
                .resize(800, 1000, { fit: "inside" })
                .jpeg({ quality: 80 })
                .toFile(coverPath);
            updateData.coverImage = coverFilename;
        }
        if (data.deliveryFile) {
            // delete old file if it was a file (has no http prefix)
            if (existing[0].deliveryLink && !existing[0].deliveryLink.startsWith("http")) {
                try {
                    await unlink(join(config.storage.academyFiles, existing[0].deliveryLink));
                }
                catch (e) { }
            }
            const deliveryFilename = `${uuidv4()}-${data.deliveryFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const deliveryPath = join(config.storage.academyFiles, deliveryFilename);
            const deliveryBuffer = Buffer.from(await data.deliveryFile.arrayBuffer());
            await writeFile(deliveryPath, deliveryBuffer);
            updateData.deliveryLink = deliveryFilename;
        }
        else if (data.deliveryUrl) {
            updateData.deliveryLink = data.deliveryUrl;
        }
        updateData.updatedAt = new Date();
        const updated = await db.update(academyItems).set(updateData).where(eq(academyItems.id, id)).returning();
        return updated[0];
    }
    async deleteItem(id) {
        const existing = await db.select().from(academyItems).where(eq(academyItems.id, id)).limit(1);
        if (!existing.length)
            throw new Error("Item not found");
        try {
            await unlink(join(config.storage.academyImages, existing[0].coverImage));
        }
        catch (e) { }
        if (existing[0].deliveryLink && !existing[0].deliveryLink.startsWith("http")) {
            try {
                await unlink(join(config.storage.academyFiles, existing[0].deliveryLink));
            }
            catch (e) { }
        }
        await db.delete(academyItems).where(eq(academyItems.id, id));
        return { success: true };
    }
    // --- PURCHASES ---
    async submitPurchase(userId, itemId, amount, proofFile) {
        if (!proofFile.type.startsWith("image/")) {
            throw new Error("Proof must be an image");
        }
        const proofFilename = `${uuidv4()}-${proofFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const proofPath = join(config.storage.academyProofs, proofFilename);
        const proofBuffer = Buffer.from(await proofFile.arrayBuffer());
        await sharp(proofBuffer)
            .resize(800, 1000, { fit: "inside" })
            .jpeg({ quality: 80 })
            .toFile(proofPath);
        const purchase = await db.insert(academyPurchases).values({
            id: uuidv4(),
            userId,
            itemId,
            amount,
            paymentProof: proofFilename,
            status: "PENDING",
        }).returning();
        return purchase[0];
    }
    async getPurchases(userId) {
        const query = db
            .select({
            purchase: academyPurchases,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            item: {
                id: academyItems.id,
                title: academyItems.title,
                type: academyItems.type,
            }
        })
            .from(academyPurchases)
            .innerJoin(user, eq(academyPurchases.userId, user.id))
            .innerJoin(academyItems, eq(academyPurchases.itemId, academyItems.id));
        if (userId) {
            query.where(eq(academyPurchases.userId, userId));
        }
        const purchases = await query.orderBy(desc(academyPurchases.createdAt));
        return purchases.map(p => (Object.assign(Object.assign({}, p.purchase), { user: p.user, item: p.item, proofUrl: `${process.env.BASE_URL}/api/academy/proof/${p.purchase.paymentProof}` })));
    }
    async verifyPurchase(id, status, reason) {
        const existing = await db.select().from(academyPurchases).where(eq(academyPurchases.id, id)).limit(1);
        if (!existing.length)
            throw new Error("Purchase not found");
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (status === "APPROVED") {
            updateData.approvedAt = new Date();
        }
        else {
            updateData.rejectedAt = new Date();
            updateData.rejectionReason = reason;
        }
        const updated = await db.update(academyPurchases).set(updateData).where(eq(academyPurchases.id, id)).returning();
        if (status === "APPROVED") {
            // Send email
            const u = await db.select().from(user).where(eq(user.id, updated[0].userId)).limit(1);
            const i = await db.select().from(academyItems).where(eq(academyItems.id, updated[0].itemId)).limit(1);
            if (u.length && i.length) {
                let deliveryContent = i[0].deliveryLink;
                if (!deliveryContent.startsWith("http")) {
                    deliveryContent = `${process.env.BASE_URL}/api/academy/download/${deliveryContent}`;
                }
                await mailService.sendAcademyItemDelivery(u[0].email, u[0].name, i[0].title, deliveryContent);
            }
        }
        return updated[0];
    }
}
