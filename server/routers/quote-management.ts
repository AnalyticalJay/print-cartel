import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quotes, quoteTemplates, quoteReminders, orders, users } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

/**
 * Quote Management Router
 * Handles quote templates, creation, status updates, and reminders
 */
export const quoteManagementRouter = router({
  /**
   * Get all quote templates (admin only)
   */
  getTemplates: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db
      .select()
      .from(quoteTemplates)
      .where(eq(quoteTemplates.isActive, true))
      .orderBy(desc(quoteTemplates.createdAt));

    return templates;
  }),

  /**
   * Create a new quote template (admin only)
   */
  createTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        templateType: z.enum(["standard", "bulk", "reseller", "custom"]),
        headerText: z.string().optional(),
        footerText: z.string().optional(),
        includeTermsAndConditions: z.boolean().default(true),
        termsAndConditions: z.string().optional(),
        paymentTerms: z.string().optional(),
        deliveryTerms: z.string().optional(),
        validityDays: z.number().int().min(1).default(7),
        discountPercentage: z.number().optional(),
        discountReason: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .insert(quoteTemplates)
        .values({
          ...input,
          discountPercentage: input.discountPercentage ? String(input.discountPercentage) : undefined,
          createdBy: ctx.user.id,
        } as any);
      
      const template = (result as any).insertId || result;

      return template;
    }),

  /**
   * Update quote template (admin only)
   */
  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        templateType: z.enum(["standard", "bulk", "reseller", "custom"]).optional(),
        headerText: z.string().optional(),
        footerText: z.string().optional(),
        includeTermsAndConditions: z.boolean().optional(),
        termsAndConditions: z.string().optional(),
        paymentTerms: z.string().optional(),
        deliveryTerms: z.string().optional(),
        validityDays: z.number().int().min(1).optional(),
        discountPercentage: z.number().optional(),
        discountReason: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(quoteTemplates)
        .set({
          ...updateData,
          discountPercentage: updateData.discountPercentage ? String(updateData.discountPercentage) : undefined,
        } as any)
        .where(eq(quoteTemplates.id, id));

      return { success: true };
    }),

  /**
   * Create quote with template (admin only)
   */
  createQuoteWithTemplate: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        templateId: z.number(),
        basePrice: z.string(),
        adjustedPrice: z.string(),
        priceAdjustmentReason: z.string().optional(),
        adminNotes: z.string().optional(),
        expiresInDays: z.number().int().min(1).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get template to calculate expiration date
      const template = await db
        .select()
        .from(quoteTemplates)
        .where(eq(quoteTemplates.id, input.templateId))
        .limit(1);

      if (!template || template.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quote template not found",
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || template[0]?.validityDays || 7));

      const result = await db
        .insert(quotes)
        .values({
          orderId: input.orderId,
          adminId: ctx.user.id,
          templateId: input.templateId || undefined,
          basePrice: input.basePrice as any,
          adjustedPrice: input.adjustedPrice as any,
          priceAdjustmentReason: input.priceAdjustmentReason,
          adminNotes: input.adminNotes,
          status: "sent",
          expiresAt,
          sentAt: new Date(),
        });
      
      const quote = (result as any).insertId || result;

      return quote;
    }),

  /**
   * Get pending quotes (admin only)
   */
  getPendingQuotes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();

    const pendingQuotes = await db
      .select({
        id: quotes.id,
        orderId: quotes.orderId,
        basePrice: quotes.basePrice,
        adjustedPrice: quotes.adjustedPrice,
        status: quotes.status,
        expiresAt: quotes.expiresAt,
        sentAt: quotes.sentAt,
        respondedAt: quotes.respondedAt,
        createdAt: quotes.createdAt,
        customerName: users.firstName,
        customerEmail: users.email,
        orderNumber: orders.id,
      })
      .from(quotes)
      .leftJoin(orders, eq(quotes.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(
        and(
          eq(quotes.status, "sent"),
          gte(quotes.expiresAt, now) // Not yet expired
        )
      )
      .orderBy(asc(quotes.expiresAt));

    return pendingQuotes;
  }),

  /**
   * Get expired quotes (admin only)
   */
  getExpiredQuotes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();

    const expiredQuotes = await db
      .select({
        id: quotes.id,
        orderId: quotes.orderId,
        basePrice: quotes.basePrice,
        adjustedPrice: quotes.adjustedPrice,
        status: quotes.status,
        expiresAt: quotes.expiresAt,
        sentAt: quotes.sentAt,
        respondedAt: quotes.respondedAt,
        createdAt: quotes.createdAt,
        customerName: users.firstName,
        customerEmail: users.email,
        orderNumber: orders.id,
      })
      .from(quotes)
      .leftJoin(orders, eq(quotes.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(
        and(
          eq(quotes.status, "sent"),
          lte(quotes.expiresAt, now) // Expired
        )
      )
      .orderBy(desc(quotes.expiresAt));

    return expiredQuotes;
  }),

  /**
   * Update quote status (admin only)
   */
  updateQuoteStatus: adminProcedure
    .input(
      z.object({
        quoteId: z.number(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(quotes)
        .set({
          status: input.status,
          respondedAt: input.status !== "sent" ? new Date() : undefined,
        })
        .where(eq(quotes.id, input.quoteId));

      return { success: true };
    }),

  /**
   * Resend quote email (admin only)
   */
  resendQuote: adminProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(quotes)
        .set({
          sentAt: new Date(),
          status: "sent",
        })
        .where(eq(quotes.id, input.quoteId));

      return { success: true };
    }),

  /**
   * Create quote reminder (admin only)
   */
  createReminder: adminProcedure
    .input(
      z.object({
        quoteId: z.number(),
        reminderType: z.enum(["expiring_soon", "expired", "follow_up"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [reminder] = await db
        .insert(quoteReminders)
        .values({
          quoteId: input.quoteId,
          reminderType: input.reminderType,
          status: "pending",
        })
        .$returningId();

      return reminder;
    }),

  /**
   * Get quote reminders (admin only)
   */
  getReminders: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "sent", "failed"]).optional(),
        reminderType: z.enum(["expiring_soon", "expired", "follow_up"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(quoteReminders);

      const conditions = [];
      if (input.status) {
        conditions.push(eq(quoteReminders.status, input.status));
      }
      if (input.reminderType) {
        conditions.push(eq(quoteReminders.reminderType, input.reminderType));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const reminders = await (query as any).orderBy(desc(quoteReminders.createdAt));
      return reminders;
    }),

  /**
   * Accept quote (customer)
   */
  acceptQuote: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify quote belongs to user's order
      const quote = await db
        .select()
        .from(quotes)
        .leftJoin(orders, eq(quotes.orderId, orders.id))
        .where(eq(quotes.id, input.quoteId))
        .limit(1);

      if (!quote || quote.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quote not found",
        });
      }

      if (quote[0].orders?.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to accept this quote",
        });
      }

      // Update quote status
      await db
        .update(quotes)
        .set({
          status: "accepted",
          respondedAt: new Date(),
        })
        .where(eq(quotes.id, input.quoteId));

      // Update order status to approved and set total price from quote
      await db
        .update(orders)
        .set({
          status: "approved",
          totalPriceEstimate: quote[0].quotes?.adjustedPrice,
        })
        .where(eq(orders.id, quote[0].quotes?.orderId));

      return { success: true, orderId: quote[0].quotes?.orderId };
    }),

  /**
   * Reject quote (customer)
   */
  rejectQuote: protectedProcedure
    .input(
      z.object({
        quoteId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify quote belongs to user's order
      const quote = await db
        .select()
        .from(quotes)
        .leftJoin(orders, eq(quotes.orderId, orders.id))
        .where(eq(quotes.id, input.quoteId))
        .limit(1);

      if (!quote || quote.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quote not found",
        });
      }

      if (quote[0].orders?.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to reject this quote",
        });
      }

      await db
        .update(quotes)
        .set({
          status: "rejected",
          respondedAt: new Date(),
          adminNotes: input.reason ? `Customer reason: ${input.reason}` : undefined,
        })
        .where(eq(quotes.id, input.quoteId));

      return { success: true };
    }),

  /**
   * Get customer quotes (customer)
   */
  getCustomerQuotes: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all quotes for orders belonging to this user
      const customerQuotes = await db
        .select()
        .from(quotes)
        .leftJoin(orders, eq(quotes.orderId, orders.id))
        .where(eq(orders.userId, input.userId))
        .orderBy(desc(quotes.sentAt));

      return customerQuotes.map((q: any) => ({
        id: q.quotes?.id,
        orderId: q.quotes?.orderId,
        basePrice: q.quotes?.basePrice,
        adjustedPrice: q.quotes?.adjustedPrice,
        status: q.quotes?.status,
        sentAt: q.quotes?.sentAt,
        respondedAt: q.quotes?.respondedAt,
        expiresAt: q.quotes?.expiresAt,
        rejectionReason: q.quotes?.rejectionReason,
        priceAdjustmentReason: q.quotes?.priceAdjustmentReason,
        adminNotes: q.quotes?.adminNotes,
      }));
    }),

  /**
   * Get quote analytics (admin only)
   */
  getQuoteAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allQuotes = await db.select().from(quotes);

    const total = allQuotes.length;
    const accepted = allQuotes.filter((q: any) => q.status === "accepted").length;
    const rejected = allQuotes.filter((q: any) => q.status === "rejected").length;
    const pending = allQuotes.filter((q: any) => q.status === "sent").length;
    const expired = allQuotes.filter((q: any) => q.status === "expired").length;

    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(2) : "0";

    return {
      total,
      accepted,
      rejected,
      pending,
      expired,
      acceptanceRate: `${acceptanceRate}%`,
    };
  }),
});
