import db from "../db/index.js";
import { airdropTasks, airdropUserProfile, userAirdropCompletions, } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
export class AirdropService {
    static getInstance() {
        if (!AirdropService.instance) {
            AirdropService.instance = new AirdropService();
        }
        return AirdropService.instance;
    }
    // Get or initialize user profile
    async getOrCreateProfile(userId) {
        const existing = await db
            .select()
            .from(airdropUserProfile)
            .where(eq(airdropUserProfile.userId, userId))
            .limit(1);
        if (existing.length > 0) {
            return existing[0];
        }
        const [created] = await db
            .insert(airdropUserProfile)
            .values({
            id: crypto.randomUUID(),
            userId,
            testTokenBalance: 0,
            currentStreak: 0,
        })
            .returning();
        return created;
    }
    // List all tasks with user completion status
    async getTasks(userId) {
        const tasks = await db
            .select()
            .from(airdropTasks)
            .where(eq(airdropTasks.isActive, true))
            .orderBy(airdropTasks.sortOrder);
        if (!userId) {
            return tasks.map((t) => (Object.assign(Object.assign({}, t), { isCompleted: false })));
        }
        const completions = await db
            .select()
            .from(userAirdropCompletions)
            .where(eq(userAirdropCompletions.userId, userId));
        const completedMap = new Map(completions.map((c) => [c.taskId, c]));
        return tasks.map((t) => {
            var _a;
            const completion = completedMap.get(t.id);
            return Object.assign(Object.assign({}, t), { isCompleted: !!completion, completedAt: (_a = completion === null || completion === void 0 ? void 0 : completion.completedAt) !== null && _a !== void 0 ? _a : null });
        });
    }
    // Complete a task and award test tokens
    async completeTask(userId, taskId, metadata) {
        const [task] = await db
            .select()
            .from(airdropTasks)
            .where(and(eq(airdropTasks.id, taskId), eq(airdropTasks.isActive, true)))
            .limit(1);
        if (!task) {
            throw new Error("Task not found or is inactive");
        }
        if (task.taskType === "ONCE") {
            const existing = await db
                .select()
                .from(userAirdropCompletions)
                .where(and(eq(userAirdropCompletions.userId, userId), eq(userAirdropCompletions.taskId, taskId)))
                .limit(1);
            if (existing.length > 0) {
                throw new Error("Task has already been completed");
            }
        }
        let formattedMetadata = (metadata === null || metadata === void 0 ? void 0 : metadata.trim()) || null;
        // Strict validation for Social Tasks (Option B: Handle submission + Uniqueness check)
        if (task.category === "SOCIAL") {
            if (!formattedMetadata) {
                throw new Error("Please enter your social username / handle (e.g. @your_username) to verify this task.");
            }
            const cleanHandle = formattedMetadata.replace(/^@+/, "").trim().toLowerCase();
            if (!cleanHandle || cleanHandle.length < 3 || cleanHandle.length > 32 || !/^[a-zA-Z0-9_]+$/.test(cleanHandle)) {
                throw new Error("Invalid handle format. Please enter a valid username (e.g. @cryptoking, 3-32 alphanumeric characters).");
            }
            // Check if another account has already claimed this task with the exact same handle
            const duplicate = await db
                .select()
                .from(userAirdropCompletions)
                .where(and(eq(userAirdropCompletions.taskId, taskId), sql `LOWER(${userAirdropCompletions.metadata}) = ${"@" + cleanHandle}`))
                .limit(1);
            if (duplicate.length > 0 && duplicate[0].userId !== userId) {
                throw new Error(`The handle @${cleanHandle} has already been claimed by another account. Each social handle can only be used once.`);
            }
            formattedMetadata = "@" + cleanHandle;
        }
        // Record completion
        await db.insert(userAirdropCompletions).values({
            id: crypto.randomUUID(),
            userId,
            taskId,
            status: "COMPLETED",
            rewardPaid: task.reward,
            metadata: formattedMetadata,
        });
        // Ensure profile exists and increment balance
        const profile = await this.getOrCreateProfile(userId);
        const newBalance = profile.testTokenBalance + task.reward;
        await db
            .update(airdropUserProfile)
            .set({
            testTokenBalance: newBalance,
            updatedAt: new Date(),
        })
            .where(eq(airdropUserProfile.userId, userId));
        return {
            success: true,
            reward: task.reward,
            newBalance,
        };
    }
    // Daily checkin faucet
    async dailyCheckin(userId) {
        const profile = await this.getOrCreateProfile(userId);
        const now = new Date();
        if (profile.lastCheckinAt) {
            const lastCheckin = new Date(profile.lastCheckinAt);
            const diffHours = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
            if (diffHours < 20) {
                throw new Error("Already checked in today. Please return tomorrow!");
            }
            // Check if streak broke (> 48 hours)
            let newStreak = diffHours <= 48 ? profile.currentStreak + 1 : 1;
            const baseReward = 50;
            const streakBonus = Math.min(newStreak * 10, 100); // up to +100 bonus
            const totalReward = baseReward + streakBonus;
            const newBalance = profile.testTokenBalance + totalReward;
            await db
                .update(airdropUserProfile)
                .set({
                testTokenBalance: newBalance,
                currentStreak: newStreak,
                lastCheckinAt: now,
                updatedAt: now,
            })
                .where(eq(airdropUserProfile.userId, userId));
            return {
                success: true,
                reward: totalReward,
                newBalance,
                currentStreak: newStreak,
            };
        }
        else {
            // First checkin
            const totalReward = 50;
            const newBalance = profile.testTokenBalance + totalReward;
            await db
                .update(airdropUserProfile)
                .set({
                testTokenBalance: newBalance,
                currentStreak: 1,
                lastCheckinAt: now,
                updatedAt: now,
            })
                .where(eq(airdropUserProfile.userId, userId));
            return {
                success: true,
                reward: totalReward,
                newBalance,
                currentStreak: 1,
            };
        }
    }
    // Save XRPL wallet address
    async saveWallet(userId, walletAddress, destinationTag) {
        // Basic XRPL address validation (starts with 'r' and 25-35 alphanumeric chars)
        const cleaned = walletAddress.trim();
        if (!cleaned.startsWith("r") || cleaned.length < 25 || cleaned.length > 35) {
            throw new Error("Invalid XRPL wallet address. Must start with 'r' (e.g. rKzv9m...)");
        }
        const profile = await this.getOrCreateProfile(userId);
        await db
            .update(airdropUserProfile)
            .set({
            xrplWalletAddress: cleaned,
            xrplDestinationTag: (destinationTag === null || destinationTag === void 0 ? void 0 : destinationTag.trim()) || null,
            updatedAt: new Date(),
        })
            .where(eq(airdropUserProfile.userId, userId));
        // Auto-complete wallet binding task if not yet completed
        try {
            await this.completeTask(userId, "task-wallet-connect", `Wallet: ${cleaned}`);
        }
        catch (_a) {
            // already completed
        }
        return {
            success: true,
            walletAddress: cleaned,
            destinationTag: destinationTag || null,
        };
    }
    // Global stats & leaderboard
    async getStats(userId) {
        // Total pool size
        const TOTAL_AIRDROP_POOL = 15000000; // 15,000,000 ECO
        // Sum all earned test tokens
        const [sumResult] = await db
            .select({
            totalEarned: sql `COALESCE(SUM(${airdropUserProfile.testTokenBalance}), 0)`,
            totalParticipants: sql `COUNT(*)`,
        })
            .from(airdropUserProfile);
        const totalCommunityTokens = Number((sumResult === null || sumResult === void 0 ? void 0 : sumResult.totalEarned) || 0);
        const totalParticipants = Number((sumResult === null || sumResult === void 0 ? void 0 : sumResult.totalParticipants) || 0);
        let userStats = null;
        if (userId) {
            const profile = await this.getOrCreateProfile(userId);
            const userSharePercent = totalCommunityTokens > 0
                ? ((profile.testTokenBalance / totalCommunityTokens) * 100).toFixed(4)
                : "0.0000";
            const estimatedRealTokens = totalCommunityTokens > 0
                ? Math.floor((profile.testTokenBalance / totalCommunityTokens) * TOTAL_AIRDROP_POOL)
                : 0;
            userStats = {
                testTokenBalance: profile.testTokenBalance,
                xrplWalletAddress: profile.xrplWalletAddress,
                xrplDestinationTag: profile.xrplDestinationTag,
                currentStreak: profile.currentStreak,
                lastCheckinAt: profile.lastCheckinAt,
                userSharePercent,
                estimatedRealTokens,
            };
        }
        // Top 10 leaderboard
        const leaderboard = await db
            .select({
            userId: airdropUserProfile.userId,
            balance: airdropUserProfile.testTokenBalance,
            streak: airdropUserProfile.currentStreak,
            wallet: airdropUserProfile.xrplWalletAddress,
        })
            .from(airdropUserProfile)
            .orderBy(desc(airdropUserProfile.testTokenBalance))
            .limit(10);
        return {
            totalAirdropPool: TOTAL_AIRDROP_POOL,
            totalCommunityTokens,
            totalParticipants,
            user: userStats,
            leaderboard: leaderboard.map((l, index) => ({
                rank: index + 1,
                userId: l.userId,
                balance: l.balance,
                testTokenBalance: l.balance,
                streak: l.streak,
                walletAddress: l.wallet || null,
                walletPreview: l.wallet
                    ? `${l.wallet.slice(0, 6)}...${l.wallet.slice(-4)}`
                    : `Earner #${l.userId.slice(0, 6)}`,
            })),
        };
    }
}
