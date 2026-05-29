import { and, desc, eq } from "drizzle-orm";
import db from "../db/index.js";
import { beneficiaries } from "../db/schema.js";

export interface BeneficiaryInput {
  fullName: string;
  relationship: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  dateOfBirth?: Date | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

export class BeneficiaryService {
  private static instance: BeneficiaryService;

  private constructor() {}

  public static getInstance(): BeneficiaryService {
    if (!BeneficiaryService.instance) {
      BeneficiaryService.instance = new BeneficiaryService();
    }
    return BeneficiaryService.instance;
  }

  async createBeneficiary(userId: string, data: BeneficiaryInput) {
    const now = new Date();
    const result = await db
      .insert(beneficiaries)
      .values({
        userId,
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return result[0];
  }

  async getBeneficiariesByUserId(userId: string) {
    return await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, userId))
      .orderBy(desc(beneficiaries.createdAt));
  }

  async getBeneficiaryById(id: string, userId: string) {
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

  async updateBeneficiary(
    id: string,
    userId: string,
    data: Partial<BeneficiaryInput>
  ) {
    // Ensure the beneficiary exists and belongs to the user
    await this.getBeneficiaryById(id, userId);

    const result = await db
      .update(beneficiaries)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.userId, userId)))
      .returning();

    return result[0];
  }

  async deleteBeneficiary(id: string, userId: string) {
    // Ensure the beneficiary exists and belongs to the user
    await this.getBeneficiaryById(id, userId);

    await db
      .delete(beneficiaries)
      .where(and(eq(beneficiaries.id, id), eq(beneficiaries.userId, userId)));

    return { success: true };
  }
}
