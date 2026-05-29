import { and, desc, eq } from "drizzle-orm";
import db from "../db/index.js";
import { beneficiaries } from "../db/schema.js";
export class BeneficiaryService {
    constructor() { }
    static getInstance() {
        if (!BeneficiaryService.instance) {
            BeneficiaryService.instance = new BeneficiaryService();
        }
        return BeneficiaryService.instance;
    }
    async createBeneficiary(userId, data) {
        const now = new Date();
        const result = await db
            .insert(beneficiaries)
            .values(Object.assign(Object.assign({ userId }, data), { createdAt: now, updatedAt: now }))
            .returning();
        return result[0];
    }
    async getBeneficiariesByUserId(userId) {
        return await db
            .select()
            .from(beneficiaries)
            .where(eq(beneficiaries.userId, userId))
            .orderBy(desc(beneficiaries.createdAt));
    }
    async getBeneficiaryById(id, userId) {
        const result = await db
            .select()
            .from(beneficiaries)
            .where(and(eq(beneficiaries.id, id), eq(beneficiaries.userId, userId)))
            .limit(1);
        if (!result[0]) {
            throw new Error("Beneficiary not found");
        }
        return result[0];
    }
    async updateBeneficiary(id, userId, data) {
        // Ensure the beneficiary exists and belongs to the user
        await this.getBeneficiaryById(id, userId);
        const result = await db
            .update(beneficiaries)
            .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
            .where(and(eq(beneficiaries.id, id), eq(beneficiaries.userId, userId)))
            .returning();
        return result[0];
    }
    async deleteBeneficiary(id, userId) {
        // Ensure the beneficiary exists and belongs to the user
        await this.getBeneficiaryById(id, userId);
        await db
            .delete(beneficiaries)
            .where(and(eq(beneficiaries.id, id), eq(beneficiaries.userId, userId)));
        return { success: true };
    }
}
