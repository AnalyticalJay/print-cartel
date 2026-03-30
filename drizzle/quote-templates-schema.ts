import { mysqlTable, int, varchar, text, timestamp, boolean, decimal, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Quote Templates Table
 * Stores pre-built quote templates for different scenarios
 */
export const quoteTemplates = mysqlTable(
  "quoteTemplates",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    templateType: mysqlEnum("templateType", ["standard", "bulk", "reseller", "custom"])
      .default("standard")
      .notNull(),
    headerText: text("headerText"),
    footerText: text("footerText"),
    includeTermsAndConditions: boolean("includeTermsAndConditions").default(true),
    termsAndConditions: text("termsAndConditions"),
    paymentTerms: varchar("paymentTerms", { length: 255 }),
    deliveryTerms: varchar("deliveryTerms", { length: 255 }),
    validityDays: int("validityDays").default(7),
    discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }),
    discountReason: varchar("discountReason", { length: 255 }),
    notes: text("notes"),
    isActive: boolean("isActive").default(true),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    createdByIdx: index("idx_quote_templates_createdBy").on(table.createdBy),
    typeIdx: index("idx_quote_templates_type").on(table.templateType),
    activeIdx: index("idx_quote_templates_active").on(table.isActive),
  })
);

export type QuoteTemplate = typeof quoteTemplates.$inferSelect;
export type InsertQuoteTemplate = typeof quoteTemplates.$inferInsert;

/**
 * Quote Reminders Table
 * Tracks reminder emails sent for pending quotes
 */
export const quoteReminders = mysqlTable(
  "quoteReminders",
  {
    id: int("id").autoincrement().primaryKey(),
    quoteId: int("quoteId").notNull(),
    reminderType: mysqlEnum("reminderType", ["expiring_soon", "expired", "follow_up"]).notNull(),
    sentAt: timestamp("sentAt"),
    status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
    attemptCount: int("attemptCount").default(0),
    lastAttemptAt: timestamp("lastAttemptAt"),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_quote_reminders_status").on(table.status, table.reminderType),
    createdAtIdx: index("idx_quote_reminders_createdAt").on(table.createdAt),
  })
);

export type QuoteReminder = typeof quoteReminders.$inferSelect;
export type InsertQuoteReminder = typeof quoteReminders.$inferInsert;
