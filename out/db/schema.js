import { relations } from "drizzle-orm";
import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int, double, } from "drizzle-orm/mysql-core";
export const user = mysqlTable("user", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    normalizedEmail: varchar("normalized_email", { length: 255 }).unique(),
    role: mysqlEnum("role", ["ADMIN", "USER"]).notNull().default("USER"),
    phone: text("phone"),
    country: text("country"),
    address: text("address"),
    postalCode: text("postal_code"),
    dateOfBirth: timestamp("date_of_birth"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    kycVerified: boolean("kyc_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const referrals = mysqlTable("referrals", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    referrerId: varchar("referrer_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    referreeId: varchar("referree_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
});
export const session = mysqlTable("session", {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});
export const account = mysqlTable("account", {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const verification = mysqlTable("verification", {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});
export const twoFactor = mysqlTable("two_factor", {
    id: varchar("id", { length: 36 }).primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});
export const kyc = mysqlTable("kyc", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    documentType: mysqlEnum("document_type", [
        "ID_CARD",
        "DRIVERS_LICENSE",
        "PASSPORT",
        "OTHER",
    ]).notNull(),
    frontImage: text("front_image").notNull(),
    backImage: text("back_image").notNull(),
    selfieImage: text("selfie_image").notNull(),
    status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"])
        .notNull()
        .default("PENDING"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const wallet = mysqlTable("wallet", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    address: text("address").notNull(),
    qrCode: text("qr_code").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const walletRelations = relations(wallet, ({ one }) => ({
    user: one(user, {
        fields: [wallet.userId],
        references: [user.id],
    }),
}));
export const kycRelations = relations(kyc, ({ one }) => ({
    user: one(user, {
        fields: [kyc.userId],
        references: [user.id],
    }),
}));
export const systemWallet = mysqlTable("system_wallet", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    address: text("address").notNull(),
    qrCode: text("qr_code").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const userWallet = mysqlTable("user_wallet", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    address: text("address").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const plans = mysqlTable("plans", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    type: varchar("type", { length: 255 }).notNull(),
    price: int("price").notNull(),
    minRoiAmount: double("min_roi_amount").notNull(),
    maxRoiAmount: double("max_roi_amount").notNull(),
    commission: double("commission").notNull(),
    percentage: double("percentage").notNull(),
    duration: int("duration").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});
export const investments = mysqlTable("investments", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 36 })
        .notNull()
        .references(() => plans.id, { onDelete: "cascade" }),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    txn: varchar("txn", { length: 255 }).notNull(),
    amount: double("amount").notNull(),
    targetProfit: double("target_profit").notNull(),
    currentProfit: double("current_profit").notNull(),
    status: mysqlEnum("status", ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"])
        .notNull()
        .default("PENDING"),
    noOfROI: int("no_of_roi").notNull(),
    profitPercent: double("profit_percent").notNull(),
    nextProfit: double("next_profit").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const investmentsRelations = relations(investments, ({ one }) => ({
    user: one(user, {
        fields: [investments.userId],
        references: [user.id],
    }),
    plan: one(plans, {
        fields: [investments.planId],
        references: [plans.id],
    }),
}));
export const plansRelations = relations(plans, ({ many }) => ({
    investments: many(investments),
}));
export const systemWalletRelations = relations(systemWallet, ({ one }) => ({
    user: one(user, {
        fields: [systemWallet.id],
        references: [user.id],
    }),
}));
export const userWalletRelations = relations(userWallet, ({ one }) => ({
    user: one(user, {
        fields: [userWallet.userId],
        references: [user.id],
    }),
}));
export const balance = mysqlTable("balance", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    amount: varchar("amount", { length: 255 }).notNull().default("0"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const deposit = mysqlTable("deposit", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    systemWalletId: varchar("system_wallet_id", { length: 36 })
        .notNull()
        .references(() => systemWallet.id, { onDelete: "cascade" }),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED", "FAILED"])
        .notNull()
        .default("PENDING"),
    // transactionHash: text("transaction_hash").notNull(),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const balanceRelations = relations(balance, ({ one }) => ({
    user: one(user, {
        fields: [balance.userId],
        references: [user.id],
    }),
}));
export const depositRelations = relations(deposit, ({ one }) => ({
    user: one(user, {
        fields: [deposit.userId],
        references: [user.id],
    }),
    systemWallet: one(systemWallet, {
        fields: [deposit.systemWalletId],
        references: [systemWallet.id],
    }),
}));
export const withdrawal = mysqlTable("withdrawal", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: mysqlEnum("currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"])
        .notNull()
        .default("PENDING"),
    destinationAddress: text("destination_address").notNull(),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const withdrawalRelations = relations(withdrawal, ({ one }) => ({
    user: one(user, {
        fields: [withdrawal.userId],
        references: [user.id],
    }),
}));
export const transfer = mysqlTable("transfer", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    senderId: varchar("sender_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    recipientId: varchar("recipient_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    fromCurrency: mysqlEnum("from_currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    toCurrency: mysqlEnum("to_currency", [
        "BTC",
        "ETH",
        "USDT",
        "SOL",
        "BNB",
        "LTC",
    ]).notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["INTERNAL", "INTER_USER"]).notNull(),
    status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"])
        .notNull()
        .default("PENDING"),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const transferRelations = relations(transfer, ({ one }) => ({
    sender: one(user, {
        fields: [transfer.senderId],
        references: [user.id],
        relationName: "sender",
    }),
    recipient: one(user, {
        fields: [transfer.recipientId],
        references: [user.id],
        relationName: "recipient",
    }),
}));
export const userRelations = relations(user, ({ one, many }) => ({
    kyc: one(kyc, {
        fields: [user.id],
        references: [kyc.userId],
    }),
    userWallets: many(userWallet),
    balances: many(balance),
    deposits: many(deposit),
    withdrawals: many(withdrawal),
    referrals: many(referrals),
    investments: many(investments),
}));
export const productCategory = mysqlTable("product_category", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const product = mysqlTable("product", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    img: text("img").notNull(),
    price: varchar("price", { length: 255 }).notNull(),
    description: text("description").notNull(),
    categoryId: varchar("category_id", { length: 36 })
        .notNull()
        .references(() => productCategory.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const productCategoryRelations = relations(productCategory, ({ many }) => ({
    products: many(product),
}));
export const productRelations = relations(product, ({ one }) => ({
    category: one(productCategory, {
        fields: [product.categoryId],
        references: [productCategory.id],
    }),
}));
