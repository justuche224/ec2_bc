import { z } from "zod";
import { BeneficiaryService, } from "../services/beneficiary.service.js";
const beneficiaryService = BeneficiaryService.getInstance();
// Treat empty strings as "not provided" for optional fields
const optionalString = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());
const optionalDate = z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.date().optional());
const beneficiarySchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    email: z.preprocess((v) => (v === "" ? undefined : v), z.string().email("Invalid email").optional()),
    phone: optionalString,
    address: optionalString,
    city: optionalString,
    country: optionalString,
    postalCode: optionalString,
    dateOfBirth: optionalDate,
    bankName: optionalString,
    bankAccountNumber: optionalString,
    bankAccountName: optionalString,
});
const beneficiaryUpdateSchema = beneficiarySchema.partial();
export class BeneficiaryController {
    static async create(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const body = await c.req.json();
            const validationResult = beneficiarySchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const beneficiary = await beneficiaryService.createBeneficiary(user.id, validationResult.data);
            return c.json({ data: beneficiary }, 201);
        }
        catch (error) {
            console.error("Error creating beneficiary:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to create beneficiary",
            }, 500);
        }
    }
    static async list(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const data = await beneficiaryService.getBeneficiariesByUserId(user.id);
            return c.json({ data }, 200);
        }
        catch (error) {
            console.error("Error getting beneficiaries:", error);
            return c.json({
                error: error instanceof Error
                    ? error.message
                    : "Failed to get beneficiaries",
            }, 500);
        }
    }
    static async getById(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const id = c.req.param("id");
            const beneficiary = await beneficiaryService.getBeneficiaryById(id, user.id);
            return c.json({ data: beneficiary }, 200);
        }
        catch (error) {
            console.error("Error getting beneficiary:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to get beneficiary";
            const statusCode = errorMessage.includes("not found") ? 404 : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    static async update(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const id = c.req.param("id");
            const body = await c.req.json();
            const validationResult = beneficiaryUpdateSchema.safeParse(body);
            if (!validationResult.success) {
                return c.json({
                    error: "Invalid input",
                    details: validationResult.error.flatten().fieldErrors,
                }, 400);
            }
            const beneficiary = await beneficiaryService.updateBeneficiary(id, user.id, validationResult.data);
            return c.json({ data: beneficiary }, 200);
        }
        catch (error) {
            console.error("Error updating beneficiary:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update beneficiary";
            const statusCode = errorMessage.includes("not found") ? 404 : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
    static async remove(c) {
        try {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized: No user found" }, 401);
            }
            const id = c.req.param("id");
            await beneficiaryService.deleteBeneficiary(id, user.id);
            return c.json({ message: "Beneficiary deleted successfully" }, 200);
        }
        catch (error) {
            console.error("Error deleting beneficiary:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to delete beneficiary";
            const statusCode = errorMessage.includes("not found") ? 404 : 500;
            return c.json({ error: errorMessage }, statusCode);
        }
    }
}
