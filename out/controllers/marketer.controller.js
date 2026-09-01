var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import db from "../db/index.js";
import { marketers, marketerReferrals, marketerCommissions } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { marketerAuth } from "../lib/marketer-auth.js";
import { MarketerService } from "../services/marketer.service.js";
export const MarketerController = {
    // Public - Register
    async register(c) {
        try {
            const body = await c.req.json();
            const { name, email, phone, password, bio, socialLinks } = body;
            if (!name || !email || !phone || !password) {
                return c.json({ error: "Missing required fields" }, 400);
            }
            // Check if email exists
            const existing = await db.query.marketers.findFirst({
                where: eq(marketers.email, email),
            });
            if (existing) {
                return c.json({ error: "Email already registered" }, 400);
            }
            const passwordHash = await marketerAuth.hashPassword(password);
            const marketerCode = await MarketerService.generateMarketerCode();
            const [newMarketer] = await db.insert(marketers).values({
                name,
                email,
                phone,
                passwordHash,
                bio,
                socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
                marketerCode,
                status: "PENDING", // Requires admin approval
            }).returning();
            return c.json({
                message: "Registration successful. Pending admin approval.",
                marketer: {
                    id: newMarketer.id,
                    name: newMarketer.name,
                    email: newMarketer.email,
                    status: newMarketer.status
                }
            }, 201);
        }
        catch (error) {
            console.error("Marketer register error:", error);
            return c.json({ error: "Failed to register marketer" }, 500);
        }
    },
    // Public - Login
    async login(c) {
        try {
            const { email, password } = await c.req.json();
            if (!email || !password) {
                return c.json({ error: "Email and password are required" }, 400);
            }
            const marketer = await db.query.marketers.findFirst({
                where: eq(marketers.email, email),
            });
            if (!marketer) {
                return c.json({ error: "Invalid credentials" }, 401);
            }
            const isValid = await marketerAuth.verifyPassword(password, marketer.passwordHash);
            if (!isValid) {
                return c.json({ error: "Invalid credentials" }, 401);
            }
            const token = marketerAuth.signToken(marketer.id);
            return c.json({
                token,
                marketer: {
                    id: marketer.id,
                    name: marketer.name,
                    email: marketer.email,
                    status: marketer.status,
                    marketerCode: marketer.marketerCode,
                }
            });
        }
        catch (error) {
            console.error("Marketer login error:", error);
            return c.json({ error: "Failed to login" }, 500);
        }
    },
    // Public - Validate Code
    async validateCode(c) {
        try {
            const code = c.req.param("code");
            if (!code) {
                return c.json({ error: "Code is required" }, 400);
            }
            const marketer = await db.query.marketers.findFirst({
                where: eq(marketers.marketerCode, code),
            });
            if (!marketer) {
                return c.json({ valid: false, error: "Invalid code" }, 404);
            }
            if (marketer.status !== "ACTIVE") {
                return c.json({ valid: false, error: "Marketer is not active" }, 400);
            }
            return c.json({ valid: true, marketerId: marketer.id, name: marketer.name });
        }
        catch (error) {
            console.error("Validate code error:", error);
            return c.json({ error: "Failed to validate code" }, 500);
        }
    },
    // Authenticated - Get Profile
    async getProfile(c) {
        const marketer = c.get("marketer");
        // Omit password hash
        const { passwordHash } = marketer, profile = __rest(marketer, ["passwordHash"]);
        return c.json(profile);
    },
    // Authenticated - Update Profile
    async updateProfile(c) {
        try {
            const marketer = c.get("marketer");
            const body = await c.req.json();
            const updateData = {};
            if (body.name)
                updateData.name = body.name;
            if (body.phone)
                updateData.phone = body.phone;
            if (body.bio !== undefined)
                updateData.bio = body.bio;
            if (body.socialLinks)
                updateData.socialLinks = JSON.stringify(body.socialLinks);
            if (body.password) {
                updateData.passwordHash = await marketerAuth.hashPassword(body.password);
            }
            updateData.updatedAt = new Date();
            const [updated] = await db.update(marketers)
                .set(updateData)
                .where(eq(marketers.id, marketer.id))
                .returning();
            const { passwordHash } = updated, profile = __rest(updated, ["passwordHash"]);
            return c.json(profile);
        }
        catch (error) {
            console.error("Update profile error:", error);
            return c.json({ error: "Failed to update profile" }, 500);
        }
    },
    // Authenticated - Dashboard Stats
    async getDashboardStats(c) {
        try {
            const marketer = c.get("marketer");
            // Total earnings
            const commissions = await db.query.marketerCommissions.findMany({
                where: eq(marketerCommissions.marketerId, marketer.id),
            });
            const totalEarnings = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
            const pendingCommissions = commissions
                .filter(c => c.status === "PENDING")
                .reduce((sum, c) => sum + Number(c.amount), 0);
            // Active referrals
            const referrals = await db.query.marketerReferrals.findMany({
                where: eq(marketerReferrals.marketerId, marketer.id),
            });
            const activeReferralsCount = referrals.filter(r => r.isActive).length;
            const totalReferralsCount = referrals.length;
            // This month's earnings
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const thisMonthEarnings = commissions
                .filter(c => new Date(c.createdAt) >= startOfMonth)
                .reduce((sum, c) => sum + Number(c.amount), 0);
            return c.json({
                totalEarnings,
                pendingCommissions,
                activeReferralsCount,
                totalReferralsCount,
                thisMonthEarnings,
                recentCommissions: commissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
            });
        }
        catch (error) {
            console.error("Get dashboard stats error:", error);
            return c.json({ error: "Failed to get dashboard stats" }, 500);
        }
    },
    // Authenticated - Get Referrals
    async getReferrals(c) {
        try {
            const marketer = c.get("marketer");
            const referrals = await db.query.marketerReferrals.findMany({
                where: eq(marketerReferrals.marketerId, marketer.id),
                with: {
                    user: {
                        columns: {
                            name: true,
                            email: true,
                            kyc_verified: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: [desc(marketerReferrals.createdAt)]
            });
            return c.json(referrals);
        }
        catch (error) {
            console.error("Get referrals error:", error);
            return c.json({ error: "Failed to get referrals" }, 500);
        }
    },
    // Authenticated - Get Commissions
    async getCommissions(c) {
        try {
            const marketer = c.get("marketer");
            const commissionsList = await db.query.marketerCommissions.findMany({
                where: eq(marketerCommissions.marketerId, marketer.id),
                with: {
                    user: {
                        columns: {
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: [desc(marketerCommissions.createdAt)]
            });
            return c.json(commissionsList);
        }
        catch (error) {
            console.error("Get commissions error:", error);
            return c.json({ error: "Failed to get commissions" }, 500);
        }
    },
    // Public (Internal) - Track Signup
    async trackSignup(c) {
        try {
            const { marketerCode, userId } = await c.req.json();
            if (!marketerCode || !userId) {
                return c.json({ error: "Missing required fields" }, 400);
            }
            const marketer = await db.query.marketers.findFirst({
                where: eq(marketers.marketerCode, marketerCode),
            });
            if (!marketer || marketer.status !== "ACTIVE") {
                return c.json({ error: "Invalid or inactive marketer" }, 400);
            }
            // Check if already referred
            const existing = await db.query.marketerReferrals.findFirst({
                where: eq(marketerReferrals.userId, userId),
            });
            if (existing) {
                return c.json({ error: "User already referred" }, 400);
            }
            await db.insert(marketerReferrals).values({
                marketerId: marketer.id,
                userId: userId,
                isActive: false, // Activated when KYC is done
            });
            return c.json({ success: true });
        }
        catch (error) {
            console.error("Track signup error:", error);
            return c.json({ error: "Failed to track signup" }, 500);
        }
    }
};
