import { relations } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, boolean, pgEnum, integer, doublePrecision, } from "drizzle-orm/pg-core";
export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);
export const documentTypeEnum = pgEnum("document_type", [
    "ID_CARD",
    "DRIVERS_LICENSE",
    "PASSPORT",
    "OTHER",
]);
export const statusEnum = pgEnum("status", [
    "PENDING",
    "PROCESSING",
    "APPROVED",
    "REJECTED",
    "FAILED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
]);
export const currencyEnum = pgEnum("currency", [
    "BTC",
    "ETH",
    "USDT",
    "SOL",
    "BNB",
    "LTC",
]);
export const transferTypeEnum = pgEnum("transfer_type", [
    "INTERNAL",
    "INTER_USER",
]);
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    role: text("role"),
    kyc_verified: boolean("kyc_verified"),
    is_npo: boolean("is_npo"),
    phone: text("phone"),
    country: text("country"),
    address: text("address"),
    postalCode: text("postal_code"),
    dateOfBirth: timestamp("date_of_birth"),
});
export const referrals = pgTable("referrals", {
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
export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
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
export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});
export const kyc = pgTable("kyc", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    documentType: documentTypeEnum("document_type").notNull(),
    frontImage: text("front_image").notNull(),
    backImage: text("back_image").notNull(),
    selfieImage: text("selfie_image").notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const wallet = pgTable("wallet", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
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
export const systemWallet = pgTable("system_wallet", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    currency: currencyEnum("currency").notNull(),
    address: text("address").notNull(),
    qrCode: text("qr_code").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const userWallet = pgTable("user_wallet", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    address: text("address").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const plans = pgTable("plans", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    type: varchar("type", { length: 255 }).notNull(),
    price: integer("price").notNull(),
    minRoiAmount: doublePrecision("min_roi_amount").notNull(),
    maxRoiAmount: doublePrecision("max_roi_amount").notNull(),
    commission: doublePrecision("commission").notNull(),
    percentage: doublePrecision("percentage").notNull(),
    duration: integer("duration").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});
export const investments = pgTable("investments", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 36 })
        .notNull()
        .references(() => plans.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    txn: varchar("txn", { length: 255 }).notNull(),
    amount: doublePrecision("amount").notNull(),
    targetProfit: doublePrecision("target_profit").notNull(),
    currentProfit: doublePrecision("current_profit").notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    noOfROI: integer("no_of_roi").notNull(),
    profitPercent: doublePrecision("profit_percent").notNull(),
    nextProfit: doublePrecision("next_profit").notNull(),
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
export const balance = pgTable("balance", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull().default("0"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const deposit = pgTable("deposit", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    systemWalletId: varchar("system_wallet_id", { length: 36 })
        .notNull()
        .references(() => systemWallet.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const cashapp = pgTable("cashapp", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    amount: varchar("amount", { length: 255 }).notNull(),
    cashtag: text("cashtag").notNull(),
    cashappName: text("cashapp_name").notNull(),
    adminCashtag: text("admin_cashtag"),
    adminCashappName: text("admin_cashapp_name"),
    instructionsSent: boolean("instructions_sent").notNull().default(false),
    paymentProof: text("payment_proof"),
    status: statusEnum("status").notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const paypal = pgTable("paypal", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    amount: varchar("amount", { length: 255 }).notNull(),
    paypalEmail: text("paypal_email").notNull(),
    paypalName: text("paypal_name").notNull(),
    adminPaypalEmail: text("admin_paypal_email"),
    adminPaypalName: text("admin_paypal_name"),
    instructionsSent: boolean("instructions_sent").notNull().default(false),
    paymentProof: text("payment_proof"),
    status: statusEnum("status").notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const bank = pgTable("bank", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    amount: varchar("amount", { length: 255 }).notNull(),
    bankName: text("bank_name").notNull(),
    bankAccountNumber: text("bank_account_number").notNull(),
    bankAccountName: text("bank_account_name").notNull(),
    adminBankName: text("admin_bank_name"),
    adminBankAccountNumber: text("admin_bank_account_number"),
    adminBankAccountName: text("admin_bank_account_name"),
    instructionsSent: boolean("instructions_sent").notNull().default(false),
    paymentProof: text("payment_proof"),
    status: statusEnum("status").notNull().default("PENDING"),
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
export const withdrawal = pgTable("withdrawal", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    destinationAddress: text("destination_address").notNull(),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const cashappWithdrawal = pgTable("cashapp_withdrawal", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    cashtag: text("cashtag").notNull(),
    cashappName: text("cashapp_name").notNull(),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const paypalWithdrawal = pgTable("paypal_withdrawal", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    paypalEmail: text("paypal_email").notNull(),
    paypalName: text("paypal_name").notNull(),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const bankWithdrawal = pgTable("bank_withdrawal", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
    bankName: text("bank_name").notNull(),
    bankAccountNumber: text("bank_account_number").notNull(),
    bankAccountName: text("bank_account_name").notNull(),
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
export const transfer = pgTable("transfer", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    senderId: varchar("sender_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    recipientId: varchar("recipient_id", { length: 36 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    fromCurrency: currencyEnum("from_currency").notNull(),
    toCurrency: currencyEnum("to_currency").notNull(),
    amount: varchar("amount", { length: 255 }).notNull(),
    type: transferTypeEnum("type").notNull(),
    status: statusEnum("status").notNull().default("PENDING"),
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
export const productCategory = pgTable("product_category", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});
export const product = pgTable("product", {
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
