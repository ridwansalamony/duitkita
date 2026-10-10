// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  decimal,
  boolean,
  date,
  jsonb,
  index,
  pgEnum,
  uniqueIndex,
  unique,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["owner", "member"]);
export const walletTypeEnum = pgEnum("wallet_type", ["shared", "personal"]);
export const txTypeEnum = pgEnum("tx_type", ["income", "expense", "transfer"]);
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "achieved",
  "archived",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
]);

// === FAMILIES (workspace) ===
export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  inviteCode: varchar("invite_code", { length: 12 }).notNull().unique(),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === USERS (profile, 1-1 dengan auth.users) ===
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // reference auth.users.id Supabase
    familyId: uuid("family_id").references(() => families.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("user_family_idx").on(t.familyId),
    check(
      "profile_payload_size",
      sql`length(${t.name}) between 1 and 120 and (${t.avatarUrl} is null or length(${t.avatarUrl})<=400000)`,
    ),
  ],
);

// === WALLETS (semua dompet milik keluarga) ===
export const wallets = pgTable(
  "wallets",
  {
    isPrimary: boolean("is_primary").default(false).notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "cascade",
    }), // null = shared
    name: varchar("name", { length: 120 }).notNull(),
    type: walletTypeEnum("type").notNull().default("shared"),
    currency: varchar("currency", { length: 3 }).default("IDR").notNull(),
    icon: varchar("icon", { length: 50 }).default("wallet"),
    color: varchar("color", { length: 20 }).default("#7c3aed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("wallet_primary_family_idx")
      .on(t.familyId)
      .where(sql`${t.isPrimary}`),
    unique("wallet_id_family_unique").on(t.id, t.familyId),
    check(
      "shared_wallet_only",
      sql`${t.type}='shared' and ${t.ownerUserId} is null`,
    ),
  ],
);

// === CATEGORIES ===
export const categories = pgTable(
  "categories",
  {
    monthlyBudget: decimal("monthly_budget", { precision: 15, scale: 2 }),
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    type: txTypeEnum("type").notNull(),
    icon: varchar("icon", { length: 50 }).default("tag"),
    color: varchar("color", { length: 20 }).default("#7c3aed"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      "category_monthly_budget_valid",
      sql`${t.monthlyBudget} is null or (${t.type}='expense' and ${t.monthlyBudget}>0)`,
    ),
  ],
);

// === TRANSACTIONS ===
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    toWalletId: uuid("to_wallet_id").references(() => wallets.id), // untuk transfer
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    type: txTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    description: text("description"),
    transactionDate: date("transaction_date").notNull(),
    receiptUrl: text("receipt_url"),
    receiptOcrData: jsonb("receipt_ocr_data"), // { merchant, total, date, raw }
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    familyDateIdx: index("tx_family_date_idx").on(
      t.familyId,
      t.transactionDate,
    ),
    walletIdx: index("tx_wallet_idx").on(t.walletId),
    familyOrderIdx: index("tx_family_order_idx").on(
      t.familyId,
      t.transactionDate.desc(),
      t.createdAt.desc(),
      t.id.desc(),
    ),
    familyDestinationIdx: index("tx_family_destination_idx")
      .on(t.familyId, t.toWalletId)
      .where(sql`${t.toWalletId} is not null`),
    categoryIdx: index("tx_category_idx")
      .on(t.categoryId)
      .where(sql`${t.categoryId} is not null`),
    userIdx: index("tx_user_idx").on(t.userId),
    receiptIdx: index("tx_receipt_idx")
      .on(t.familyId, t.receiptUrl)
      .where(sql`${t.receiptUrl} is not null`),
    payloadSize: check(
      "transaction_payload_size",
      sql`(${t.description} is null or length(${t.description})<=2000) and (${t.receiptUrl} is null or length(${t.receiptUrl})<=300) and (${t.receiptOcrData} is null or octet_length(${t.receiptOcrData}::text)<=4096)`,
    ),
  }),
);

// === SAVING GOALS ===
export const savingGoals = pgTable(
  "saving_goals",
  {
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "restrict" }),
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 150 }).notNull(),
    targetAmount: decimal("target_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    currentAmount: decimal("current_amount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    deadline: date("deadline"),
    icon: varchar("icon", { length: 50 }).default("target"),
    color: varchar("color", { length: 20 }).default("#f59e0b"),
    status: goalStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("goals_wallet_idx").on(t.walletId),
    index("goals_creator_idx").on(t.createdByUserId),
    uniqueIndex("goal_wallet_open_idx")
      .on(t.familyId, t.walletId)
      .where(sql`${t.status}<>'archived'`),
    foreignKey({
      name: "goal_wallet_family_fk",
      columns: [t.walletId, t.familyId],
      foreignColumns: [wallets.id, wallets.familyId],
    }).onDelete("restrict"),
  ],
);

// === SAVING CONTRIBUTIONS (arsip sebelum migrasi dompet; hanya baca) ===
export const savingContributions = pgTable("saving_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => savingGoals.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  walletId: uuid("wallet_id").references(() => wallets.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  contributedAt: timestamp("contributed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === AUDIT LOGS ===
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // transactions, wallets, goals...
    entityId: uuid("entity_id"),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    familyIdx: index("audit_family_idx").on(t.familyId, t.createdAt),
    userIdx: index("audit_user_idx")
      .on(t.userId)
      .where(sql`${t.userId} is not null`),
  }),
);

// === RELATIONS ===
export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  goals: many(savingGoals),
  logs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
  transactions: many(transactions),
  contributions: many(savingContributions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  family: one(families, {
    fields: [transactions.familyId],
    references: [families.id],
  }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const savingGoalsRelations = relations(savingGoals, ({ one, many }) => ({
  family: one(families, {
    fields: [savingGoals.familyId],
    references: [families.id],
  }),
  contributions: many(savingContributions),
}));
