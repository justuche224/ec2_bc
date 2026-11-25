import { eq, desc, and, sql, inArray } from "drizzle-orm";
import db from "../db/index.js";
import { crowdfundingSettings, crowdfundingPools, crowdfundingInvestments, crowdfundingReferrals, crowdfundingUserAchievements, crowdfundingLedger, crowdfundingCycleHistory, crowdfundingCertificates, referrals, user, } from "../db/schema.js";
import { BalanceService } from "./balance.service.js";
import { v4 as uuidv4 } from "uuid";
const balanceService = BalanceService.getInstance();
export class CrowdfundingService {
    constructor() { }
    static getInstance() {
        if (!CrowdfundingService.instance) {
            CrowdfundingService.instance = new CrowdfundingService();
        }
        return CrowdfundingService.instance;
    }
    // ==================== SETTINGS ====================
    async getSettings() {
        const settings = await db.select().from(crowdfundingSettings).limit(1);
        if (settings.length === 0) {
            // Create default settings if none exist
            const newSettings = await db
                .insert(crowdfundingSettings)
                .values({
                id: uuidv4(),
                createdAt: new Date(),
                updatedAt: new Date(),
            })
                .returning();
            return newSettings[0];
        }
        return settings[0];
    }
    async updateSettings(data) {
        const settings = await this.getSettings();
        await db
            .update(crowdfundingSettings)
            .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
            .where(eq(crowdfundingSettings.id, settings.id));
        return { success: true };
    }
    // ==================== POOLS ====================
    async getAllPools() {
        return await db
            .select()
            .from(crowdfundingPools)
            .orderBy(desc(crowdfundingPools.createdAt));
    }
    async getPool(poolId) {
        const pool = await db
            .select()
            .from(crowdfundingPools)
            .where(eq(crowdfundingPools.id, poolId))
            .limit(1);
        return pool[0] || null;
    }
    async createPool(data) {
        const newPool = await db
            .insert(crowdfundingPools)
            .values(Object.assign(Object.assign({ id: uuidv4() }, data), { createdAt: new Date(), updatedAt: new Date() }))
            .returning();
        return { success: true, pool: newPool[0] };
    }
    async updatePool(poolId, data) {
        const pool = await this.getPool(poolId);
        if (!pool) {
            throw new Error("Pool not found");
        }
        await db
            .update(crowdfundingPools)
            .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
            .where(eq(crowdfundingPools.id, poolId));
        return { success: true };
    }
    async deletePool(poolId) {
        await db.delete(crowdfundingPools).where(eq(crowdfundingPools.id, poolId));
        return { success: true };
    }
    // ==================== INVESTMENTS ====================
    async joinPool(userId, poolId, currency, amount) {
        const pool = await this.getPool(poolId);
        if (!pool) {
            throw new Error("Pool not found");
        }
        if (pool.status !== "PENDING" && pool.status !== "ACTIVE") {
            throw new Error("Pool is not accepting investments");
        }
        if (amount < pool.minInvestmentAmount) {
            throw new Error(`Minimum investment is $${pool.minInvestmentAmount}`);
        }
        // Check user balance
        const userBalance = await balanceService.getUserBalance(userId, currency);
        const amountString = amount.toString();
        if (!userBalance ||
            balanceService.safeAmountToBigInt(userBalance.amount) <
                balanceService.safeAmountToBigInt(amountString)) {
            throw new Error(`Insufficient ${currency} balance`);
        }
        // Get current settings for required referrals
        const settings = await this.getSettings();
        // Decrement user balance
        await balanceService.decrementBalance(userId, currency, amountString);
        // Create investment record
        const newInvestment = await db
            .insert(crowdfundingInvestments)
            .values({
            id: uuidv4(),
            userId,
            poolId,
            currency,
            amount,
            requiredReferrals: settings.requiredReferrals,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        // Update pool participant count and total invested
        await db
            .update(crowdfundingPools)
            .set({
            currentParticipants: sql `${crowdfundingPools.currentParticipants} + 1`,
            totalInvested: sql `${crowdfundingPools.totalInvested} + ${amount}`,
            updatedAt: new Date(),
        })
            .where(eq(crowdfundingPools.id, poolId));
        // Check if pool reached target (auto-activate)
        const updatedPool = await this.getPool(poolId);
        if (updatedPool &&
            updatedPool.currentParticipants >= updatedPool.targetParticipants &&
            updatedPool.status === "PENDING") {
            await this.updatePool(poolId, { status: "ACTIVE" });
        }
        return { success: true, investment: newInvestment[0] };
    }
    async getUserInvestments(userId) {
        return await db
            .select({
            investment: crowdfundingInvestments,
            poolName: crowdfundingPools.name,
            poolStatus: crowdfundingPools.status,
            poolTargetParticipants: crowdfundingPools.targetParticipants,
            poolCurrentParticipants: crowdfundingPools.currentParticipants,
        })
            .from(crowdfundingInvestments)
            .leftJoin(crowdfundingPools, eq(crowdfundingInvestments.poolId, crowdfundingPools.id))
            .where(eq(crowdfundingInvestments.userId, userId))
            .orderBy(desc(crowdfundingInvestments.createdAt));
    }
    async getAllInvestments() {
        return await db
            .select({
            investment: crowdfundingInvestments,
            userName: user.name,
            userEmail: user.email,
            poolName: crowdfundingPools.name,
            poolStatus: crowdfundingPools.status,
        })
            .from(crowdfundingInvestments)
            .leftJoin(user, eq(crowdfundingInvestments.userId, user.id))
            .leftJoin(crowdfundingPools, eq(crowdfundingInvestments.poolId, crowdfundingPools.id))
            .orderBy(desc(crowdfundingInvestments.createdAt));
    }
    async getInvestmentById(investmentId) {
        const investment = await db
            .select()
            .from(crowdfundingInvestments)
            .where(eq(crowdfundingInvestments.id, investmentId))
            .limit(1);
        return investment[0] || null;
    }
    async updateInvestment(investmentId, data) {
        const investment = await this.getInvestmentById(investmentId);
        if (!investment) {
            throw new Error("Investment not found");
        }
        await db
            .update(crowdfundingInvestments)
            .set(Object.assign(Object.assign({}, data), { updatedAt: new Date() }))
            .where(eq(crowdfundingInvestments.id, investmentId));
        return { success: true };
    }
    // ==================== REFERRALS ====================
    async getUserReferrals(userId) {
        return await db
            .select({
            referral: crowdfundingReferrals,
            referreeName: user.name,
            referreeEmail: user.email,
        })
            .from(crowdfundingReferrals)
            .leftJoin(user, eq(crowdfundingReferrals.referreeId, user.id))
            .where(eq(crowdfundingReferrals.referrerId, userId))
            .orderBy(desc(crowdfundingReferrals.createdAt));
    }
    async createCrowdfundingReferral(referrerId, referreeId, investmentId) {
        // Check if referrer has an active investment (must invest before recruiting)
        const referrerInvestments = await this.getUserInvestments(referrerId);
        if (referrerInvestments.length === 0) {
            throw new Error("You must invest in a pool before you can make referrals");
        }
        // Check if referral already exists
        const existingReferral = await db
            .select()
            .from(crowdfundingReferrals)
            .where(and(eq(crowdfundingReferrals.referrerId, referrerId), eq(crowdfundingReferrals.referreeId, referreeId)))
            .limit(1);
        if (existingReferral.length > 0) {
            throw new Error("Referral already exists");
        }
        const newReferral = await db
            .insert(crowdfundingReferrals)
            .values({
            id: uuidv4(),
            referrerId,
            referreeId,
            investmentId,
            createdAt: new Date(),
        })
            .returning();
        return { success: true, referral: newReferral[0] };
    }
    // For signup flow - creates pending referral without requiring referrer to have invested
    async createPendingReferralFromSignup(referrerId, referreeId) {
        // Check if referral already exists
        const existingReferral = await db
            .select()
            .from(crowdfundingReferrals)
            .where(and(eq(crowdfundingReferrals.referrerId, referrerId), eq(crowdfundingReferrals.referreeId, referreeId)))
            .limit(1);
        if (existingReferral.length > 0) {
            // Don't throw error, just return existing referral
            return { success: true, referral: existingReferral[0], existed: true };
        }
        const newReferral = await db
            .insert(crowdfundingReferrals)
            .values({
            id: uuidv4(),
            referrerId,
            referreeId,
            status: "PENDING",
            createdAt: new Date(),
        })
            .returning();
        return { success: true, referral: newReferral[0], existed: false };
    }
    async markReferralComplete(referralId) {
        const referral = await db
            .select()
            .from(crowdfundingReferrals)
            .where(eq(crowdfundingReferrals.id, referralId))
            .limit(1);
        if (referral.length === 0) {
            throw new Error("Referral not found");
        }
        if (referral[0].status === "COMPLETED") {
            throw new Error("Referral already completed");
        }
        // Update referral status
        await db
            .update(crowdfundingReferrals)
            .set({
            status: "COMPLETED",
            completedAt: new Date(),
        })
            .where(eq(crowdfundingReferrals.id, referralId));
        // Increment referrer's completed referrals count on their investments
        const referrerInvestments = await db
            .select()
            .from(crowdfundingInvestments)
            .where(eq(crowdfundingInvestments.userId, referral[0].referrerId));
        for (const investment of referrerInvestments) {
            const newCompletedCount = investment.completedReferrals + 1;
            const isEligible = newCompletedCount >= investment.requiredReferrals;
            await db
                .update(crowdfundingInvestments)
                .set({
                completedReferrals: newCompletedCount,
                isEligibleForAirdrop: isEligible,
                updatedAt: new Date(),
            })
                .where(eq(crowdfundingInvestments.id, investment.id));
        }
        return { success: true };
    }
    // ==================== STATS ====================
    async getSystemStats() {
        var _a, _b, _c, _d;
        const settings = await this.getSettings();
        // Total participants (unique users with investments)
        const participantsResult = await db
            .select({
            count: sql `count(distinct ${crowdfundingInvestments.userId})`,
        })
            .from(crowdfundingInvestments);
        const totalParticipants = ((_a = participantsResult[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        // Total invested amount
        const investedResult = await db
            .select({
            total: sql `coalesce(sum(${crowdfundingInvestments.amount}), 0)`,
        })
            .from(crowdfundingInvestments);
        const totalInvested = ((_b = investedResult[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        // Eligible for airdrop count
        const eligibleResult = await db
            .select({ count: sql `count(*)` })
            .from(crowdfundingInvestments)
            .where(eq(crowdfundingInvestments.isEligibleForAirdrop, true));
        const eligibleForAirdrop = ((_c = eligibleResult[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
        // Active pools count
        const poolsResult = await db
            .select({ count: sql `count(*)` })
            .from(crowdfundingPools)
            .where(eq(crowdfundingPools.status, "ACTIVE"));
        const activePools = ((_d = poolsResult[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
        return {
            totalParticipants,
            targetParticipants: settings.systemTargetParticipants,
            progressPercent: Math.min(100, (totalParticipants / settings.systemTargetParticipants) * 100),
            totalInvested,
            eligibleForAirdrop,
            activePools,
            isAirdropReady: totalParticipants >= settings.systemTargetParticipants,
        };
    }
    // ==================== STAR ACHIEVEMENT & QUALIFYING DEPOSITS ====================
    async getOrCreateUserAchievement(userId) {
        const existing = await db
            .select()
            .from(crowdfundingUserAchievements)
            .where(eq(crowdfundingUserAchievements.userId, userId))
            .limit(1);
        if (existing.length > 0) {
            return existing[0];
        }
        const created = await db
            .insert(crowdfundingUserAchievements)
            .values({
            id: uuidv4(),
            userId,
            totalPoints: 0,
            directParticipants: 0,
            indirectParticipants: 0,
            completedCycles: 0,
            cycleRemainder: 0,
            starsEarned: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        return created[0];
    }
    async issueCertificate(userId, level, title, pointsThreshold) {
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const timeSuffix = Date.now().toString(36).toUpperCase();
        const certCode = `ECO-CERT-L${level}-${randomSuffix}-${timeSuffix}`;
        const newCert = await db
            .insert(crowdfundingCertificates)
            .values({
            id: uuidv4(),
            userId,
            certificateCode: certCode,
            level,
            title,
            pointsThreshold,
            issuedAt: new Date(),
        })
            .returning();
        return newCert[0];
    }
    async processQualifyingDeposit(userId, depositId, depositAmount) {
        try {
            const settings = await this.getSettings();
            const minAmount = settings.qualifyingDepositAmount || 99;
            if (depositAmount < minAmount) {
                return { success: false, reason: "Below qualifying threshold of $" + minAmount };
            }
            // Check if this deposit was already processed in the ledger
            const existingLedger = await db
                .select()
                .from(crowdfundingLedger)
                .where(eq(crowdfundingLedger.depositId, depositId))
                .limit(1);
            if (existingLedger.length > 0) {
                return { success: false, reason: "Deposit already processed in ledger" };
            }
            // Check if this user has ever had any prior qualifying deposit
            const priorUserDeposits = await db
                .select()
                .from(crowdfundingLedger)
                .where(and(eq(crowdfundingLedger.sourceUserId, userId), eq(crowdfundingLedger.eventType, "QUALIFYING_DEPOSIT")))
                .limit(1);
            const isFirstQualifyingDeposit = priorUserDeposits.length === 0;
            // Update global pool (e.g. global-pool-1000)
            if (isFirstQualifyingDeposit) {
                await db
                    .update(crowdfundingPools)
                    .set({
                    currentParticipants: sql `${crowdfundingPools.currentParticipants} + 1`,
                    totalInvested: sql `${crowdfundingPools.totalInvested} + ${depositAmount}`,
                    updatedAt: new Date(),
                })
                    .where(eq(crowdfundingPools.id, "global-pool-1000"));
            }
            // Traverse referral tree up to maxTeamDepth (default 3)
            const maxDepth = settings.maxTeamDepth || 3;
            let currentChildId = userId;
            let depth = 1;
            while (depth <= maxDepth) {
                const referralRecord = await db
                    .select()
                    .from(referrals)
                    .where(eq(referrals.referreeId, currentChildId))
                    .limit(1);
                if (referralRecord.length === 0 || !referralRecord[0].referrerId) {
                    break; // No upline referrer found
                }
                const uplineId = referralRecord[0].referrerId;
                // Prevent self-referral / circular loop
                if (uplineId === userId)
                    break;
                // Check if this upline has already counted this source user
                const alreadyCountedForUpline = await db
                    .select()
                    .from(crowdfundingLedger)
                    .where(and(eq(crowdfundingLedger.userId, uplineId), eq(crowdfundingLedger.sourceUserId, userId), eq(crowdfundingLedger.eventType, "QUALIFYING_DEPOSIT")))
                    .limit(1);
                if (alreadyCountedForUpline.length === 0) {
                    // Record ledger entry
                    await db.insert(crowdfundingLedger).values({
                        id: uuidv4(),
                        userId: uplineId,
                        sourceUserId: userId,
                        tier: depth,
                        eventType: "QUALIFYING_DEPOSIT",
                        pointsDelta: 1,
                        depositId,
                        depositAmount,
                        note: `Tier ${depth} qualifying participant contribution ($${depositAmount})`,
                        createdAt: new Date(),
                    });
                    // Fetch or initialize upline user achievements
                    const achievement = await this.getOrCreateUserAchievement(uplineId);
                    const newTotalPoints = achievement.totalPoints + 1;
                    const directIncrement = depth === 1 ? 1 : 0;
                    const indirectIncrement = depth > 1 ? 1 : 0;
                    const cycleReq = settings.cycleRequirement || 12;
                    const oldCycles = achievement.completedCycles;
                    const newCompletedCycles = Math.floor(newTotalPoints / cycleReq);
                    const newRemainder = newTotalPoints % cycleReq;
                    // Award new stars and cycle records
                    if (newCompletedCycles > oldCycles) {
                        for (let c = oldCycles + 1; c <= newCompletedCycles; c++) {
                            await db.insert(crowdfundingCycleHistory).values({
                                id: uuidv4(),
                                userId: uplineId,
                                cycleNumber: c,
                                starsAwarded: 1,
                                participantsCount: cycleReq,
                                completedAt: new Date(),
                            });
                        }
                    }
                    // Check Milestones
                    let lvl1At = achievement.level1AchievedAt;
                    let lvl2At = achievement.level2AchievedAt;
                    let lvl3At = achievement.level3AchievedAt;
                    if (newTotalPoints >= (settings.level1Points || 10) && !lvl1At) {
                        lvl1At = new Date();
                        await this.issueCertificate(uplineId, 1, "Level 1: Seedling Milestone", settings.level1Points || 10);
                    }
                    if (newTotalPoints >= (settings.level2Points || 100) && !lvl2At) {
                        lvl2At = new Date();
                        await this.issueCertificate(uplineId, 2, "Level 2: Harvest Milestone", settings.level2Points || 100);
                    }
                    if (newTotalPoints >= (settings.level3Points || 1000) && !lvl3At) {
                        lvl3At = new Date();
                        await this.issueCertificate(uplineId, 3, "Level 3: Champion Milestone", settings.level3Points || 1000);
                    }
                    // Update achievements table
                    await db
                        .update(crowdfundingUserAchievements)
                        .set({
                        totalPoints: newTotalPoints,
                        directParticipants: achievement.directParticipants + directIncrement,
                        indirectParticipants: achievement.indirectParticipants + indirectIncrement,
                        completedCycles: newCompletedCycles,
                        cycleRemainder: newRemainder,
                        starsEarned: newCompletedCycles,
                        level1AchievedAt: lvl1At,
                        level2AchievedAt: lvl2At,
                        level3AchievedAt: lvl3At,
                        updatedAt: new Date(),
                    })
                        .where(eq(crowdfundingUserAchievements.id, achievement.id));
                }
                // Ascend to next tier
                currentChildId = uplineId;
                depth++;
            }
            return { success: true };
        }
        catch (error) {
            console.error("Error processing qualifying deposit:", error);
            return { success: false, error };
        }
    }
    async getUserAchievementOverview(userId) {
        const settings = await this.getSettings();
        const achievement = await this.getOrCreateUserAchievement(userId);
        // Global pool stats
        const globalPool = await this.getGlobalPoolSummary();
        // Next star calculation
        const cycleReq = settings.cycleRequirement || 12;
        const remainingToNextStar = cycleReq - achievement.cycleRemainder;
        // Certificates
        const certificates = await db
            .select()
            .from(crowdfundingCertificates)
            .where(eq(crowdfundingCertificates.userId, userId))
            .orderBy(desc(crowdfundingCertificates.issuedAt));
        // Recent cycles
        const recentCycles = await db
            .select()
            .from(crowdfundingCycleHistory)
            .where(eq(crowdfundingCycleHistory.userId, userId))
            .orderBy(desc(crowdfundingCycleHistory.completedAt))
            .limit(10);
        return {
            achievement: Object.assign(Object.assign({}, achievement), { nextStarRequirement: remainingToNextStar, cycleProgressPercent: Math.round((achievement.cycleRemainder / cycleReq) * 100) }),
            settings: {
                qualifyingDepositAmount: settings.qualifyingDepositAmount,
                cycleRequirement: settings.cycleRequirement,
                maxTeamDepth: settings.maxTeamDepth,
                level1Points: settings.level1Points,
                level2Points: settings.level2Points,
                level3Points: settings.level3Points,
                systemTargetParticipants: settings.systemTargetParticipants,
            },
            globalPool,
            certificates,
            recentCycles,
        };
    }
    async getGlobalPoolSummary() {
        var _a, _b;
        const settings = await this.getSettings();
        const pool = await db
            .select()
            .from(crowdfundingPools)
            .where(eq(crowdfundingPools.id, "global-pool-1000"))
            .limit(1);
        const targetParticipants = settings.systemTargetParticipants || 1000;
        const currentParticipants = ((_a = pool[0]) === null || _a === void 0 ? void 0 : _a.currentParticipants) || 0;
        const totalInvested = ((_b = pool[0]) === null || _b === void 0 ? void 0 : _b.totalInvested) || 0;
        const remaining = Math.max(0, targetParticipants - currentParticipants);
        const progressPercent = Math.min(100, Number(((currentParticipants / targetParticipants) * 100).toFixed(1)));
        return {
            id: "global-pool-1000",
            targetParticipants,
            currentParticipants,
            remainingParticipants: remaining,
            progressPercent,
            totalInvested,
        };
    }
    async getUserTeamTree(userId) {
        const settings = await this.getSettings();
        const minAmount = settings.qualifyingDepositAmount || 99;
        // Helper to get qualifying user ids
        const getFundedUserIds = async (userIds) => {
            if (userIds.length === 0)
                return new Set();
            const deposits = await db
                .select({ userId: crowdfundingLedger.sourceUserId })
                .from(crowdfundingLedger)
                .where(and(inArray(crowdfundingLedger.sourceUserId, userIds), eq(crowdfundingLedger.eventType, "QUALIFYING_DEPOSIT")));
            return new Set(deposits.map((d) => d.userId));
        };
        // Tier 1 (Direct referrals)
        const tier1Refs = await db
            .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: user.createdAt,
        })
            .from(referrals)
            .innerJoin(user, eq(referrals.referreeId, user.id))
            .where(eq(referrals.referrerId, userId));
        const tier1Ids = tier1Refs.map((u) => u.id);
        const tier1FundedSet = await getFundedUserIds(tier1Ids);
        const tier1WithStatus = tier1Refs.map((u) => (Object.assign(Object.assign({}, u), { tier: 1, tierLabel: "Direct Referral", isFunded: tier1FundedSet.has(u.id) })));
        // Tier 2 (Referrals of Tier 1)
        let tier2WithStatus = [];
        let tier2Ids = [];
        if (tier1Ids.length > 0) {
            const tier2Refs = await db
                .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                createdAt: user.createdAt,
                referrerId: referrals.referrerId,
            })
                .from(referrals)
                .innerJoin(user, eq(referrals.referreeId, user.id))
                .where(inArray(referrals.referrerId, tier1Ids));
            tier2Ids = tier2Refs.map((u) => u.id);
            const tier2FundedSet = await getFundedUserIds(tier2Ids);
            tier2WithStatus = tier2Refs.map((u) => (Object.assign(Object.assign({}, u), { tier: 2, tierLabel: "Indirect (Tier 2)", isFunded: tier2FundedSet.has(u.id) })));
        }
        // Tier 3 (Referrals of Tier 2)
        let tier3WithStatus = [];
        if (tier2Ids.length > 0) {
            const tier3Refs = await db
                .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                createdAt: user.createdAt,
                referrerId: referrals.referrerId,
            })
                .from(referrals)
                .innerJoin(user, eq(referrals.referreeId, user.id))
                .where(inArray(referrals.referrerId, tier2Ids));
            const tier3Ids = tier3Refs.map((u) => u.id);
            const tier3FundedSet = await getFundedUserIds(tier3Ids);
            tier3WithStatus = tier3Refs.map((u) => (Object.assign(Object.assign({}, u), { tier: 3, tierLabel: "Indirect (Tier 3)", isFunded: tier3FundedSet.has(u.id) })));
        }
        const allMembers = [
            ...tier1WithStatus,
            ...tier2WithStatus,
            ...tier3WithStatus,
        ];
        const totalVerifiedFunded = allMembers.filter((m) => m.isFunded).length;
        return {
            totalMembers: allMembers.length,
            totalVerifiedFunded,
            tier1Count: tier1WithStatus.length,
            tier1Funded: tier1WithStatus.filter((m) => m.isFunded).length,
            tier2Count: tier2WithStatus.length,
            tier2Funded: tier2WithStatus.filter((m) => m.isFunded).length,
            tier3Count: tier3WithStatus.length,
            tier3Funded: tier3WithStatus.filter((m) => m.isFunded).length,
            members: allMembers,
        };
    }
    async getUserCycleHistory(userId) {
        return await db
            .select()
            .from(crowdfundingCycleHistory)
            .where(eq(crowdfundingCycleHistory.userId, userId))
            .orderBy(desc(crowdfundingCycleHistory.completedAt));
    }
    async getUserLedger(userId, limit = 50) {
        return await db
            .select({
            id: crowdfundingLedger.id,
            tier: crowdfundingLedger.tier,
            eventType: crowdfundingLedger.eventType,
            pointsDelta: crowdfundingLedger.pointsDelta,
            depositAmount: crowdfundingLedger.depositAmount,
            note: crowdfundingLedger.note,
            createdAt: crowdfundingLedger.createdAt,
            sourceUserName: user.name,
            sourceUserEmail: user.email,
        })
            .from(crowdfundingLedger)
            .leftJoin(user, eq(crowdfundingLedger.sourceUserId, user.id))
            .where(eq(crowdfundingLedger.userId, userId))
            .orderBy(desc(crowdfundingLedger.createdAt))
            .limit(limit);
    }
    async getUserCertificates(userId) {
        return await db
            .select()
            .from(crowdfundingCertificates)
            .where(eq(crowdfundingCertificates.userId, userId))
            .orderBy(desc(crowdfundingCertificates.issuedAt));
    }
    async getLeaderboard(limit = 10) {
        return await db
            .select({
            userId: crowdfundingUserAchievements.userId,
            name: user.name,
            image: user.image,
            totalPoints: crowdfundingUserAchievements.totalPoints,
            starsEarned: crowdfundingUserAchievements.starsEarned,
            completedCycles: crowdfundingUserAchievements.completedCycles,
        })
            .from(crowdfundingUserAchievements)
            .innerJoin(user, eq(crowdfundingUserAchievements.userId, user.id))
            .orderBy(desc(crowdfundingUserAchievements.totalPoints), desc(crowdfundingUserAchievements.starsEarned))
            .limit(limit);
    }
}
