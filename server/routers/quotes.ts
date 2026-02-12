import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quotes, orders, Quote, InsertQuote } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const CreateQuoteInput = z.object({
  orderId: z.number(),
  adjustedPrice: z.number().positive(),
  priceAdjustmentReason: z.string().optional(),
  adminNotes: z.string().optional(),
  expiresInDays: z.number().default(7),
});

const UpdateQuoteInput = z.object({
  quoteId: z.number(),
  adjustedPrice: z.number().positive().optional(),
  priceAdjustmentReason: z.string().optional(),
  adminNotes: z.string().optional(),
  expiresInDays: z.number().optional(),
});

const SendQuoteInput = z.object({
  quoteId: z.number(),
});

const RespondToQuoteInput = z.object({
  quoteId: z.number(),
  accepted: z.boolean(),
});

export const quotesRouter = router({
  // Admin: Create a new quote for an order
  create: adminProcedure.input(CreateQuoteInput).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify order exists
    const orderResult = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
    const order = orderResult[0];

    if (!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Order not found",
      });
    }

    // Create quote
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

    const basePrice = parseFloat(order.totalPriceEstimate.toString());
    const result = await db.insert(quotes).values({
      orderId: input.orderId,
      adminId: ctx.user.id,
      basePrice: basePrice.toString(),
      adjustedPrice: input.adjustedPrice.toString(),
      priceAdjustmentReason: input.priceAdjustmentReason || null,
      adminNotes: input.adminNotes || null,
      status: "draft",
      expiresAt,
    } as any);

    const quoteId = result[0].insertId;

    // Update order status to "quoted"
    await db.update(orders).set({ status: "quoted" }).where(eq(orders.id, input.orderId));

    return {
      success: true,
      quoteId,
      message: "Quote created successfully",
    };
  }),

  // Admin: Update an existing quote
  update: adminProcedure.input(UpdateQuoteInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify quote exists
    const quoteResult = await db.select().from(quotes).where(eq(quotes.id, input.quoteId)).limit(1);
    const quote = quoteResult[0];

    if (!quote) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quote not found",
      });
    }

    if (quote.status !== "draft") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Can only edit draft quotes",
      });
    }

    const updateData: any = {};
    if (input.adjustedPrice !== undefined) updateData.adjustedPrice = input.adjustedPrice;
    if (input.priceAdjustmentReason !== undefined) updateData.priceAdjustmentReason = input.priceAdjustmentReason;
    if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;

    if (input.expiresInDays !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      updateData.expiresAt = expiresAt;
    }

    await db.update(quotes).set(updateData).where(eq(quotes.id, input.quoteId));

    return {
      success: true,
      message: "Quote updated successfully",
    };
  }),

  // Admin: Send quote to customer
  send: adminProcedure.input(SendQuoteInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify quote exists
    const quoteResult = await db.select().from(quotes).where(eq(quotes.id, input.quoteId)).limit(1);
    const quote = quoteResult[0];

    if (!quote) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quote not found",
      });
    }

    if (quote.status !== "draft") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only draft quotes can be sent",
      });
    }

    // Get order details
    const orderResult = await db.select().from(orders).where(eq(orders.id, quote.orderId)).limit(1);
    const order = orderResult[0];

    if (!order) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Order not found",
      });
    }

    // Update quote status to "sent"
    const sentAt = new Date();
    await db.update(quotes).set({ status: "sent", sentAt }).where(eq(quotes.id, input.quoteId));

    return {
      success: true,
      message: "Quote sent to customer",
      quoteId: input.quoteId,
      customerEmail: order.customerEmail,
    };
  }),

  // Admin: Get all quotes for an order
  getByOrderId: adminProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(quotes).where(eq(quotes.orderId, input.orderId));
  }),

  // Admin: Get quote details
  getById: adminProcedure.input(z.object({ quoteId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const quoteResult = await db.select().from(quotes).where(eq(quotes.id, input.quoteId)).limit(1);
    const quote = quoteResult[0];

    if (!quote) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quote not found",
      });
    }

    // Get order details
    const orderResult = await db.select().from(orders).where(eq(orders.id, quote.orderId)).limit(1);
    const order = orderResult[0];

    return {
      ...quote,
      order,
    };
  }),

  // Customer: Get quote by ID (public access)
  getCustomerQuote: publicProcedure.input(z.object({ quoteId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const quoteResult = await db.select().from(quotes).where(eq(quotes.id, input.quoteId)).limit(1);
    const quote = quoteResult[0];

    if (!quote) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quote not found",
      });
    }

    // Check if quote has expired
    if (quote.expiresAt && new Date() > quote.expiresAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This quote has expired",
      });
    }

    // Get order details
    const orderResult = await db.select().from(orders).where(eq(orders.id, quote.orderId)).limit(1);
    const order = orderResult[0];

    return {
      ...quote,
      order,
    };
  }),

  // Customer: Accept or reject quote
  respond: publicProcedure.input(RespondToQuoteInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const quoteResult = await db.select().from(quotes).where(eq(quotes.id, input.quoteId)).limit(1);
    const quote = quoteResult[0];

    if (!quote) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quote not found",
      });
    }

    if (quote.status !== "sent") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Quote is not available for response",
      });
    }

    const newStatus = input.accepted ? "accepted" : "rejected";
    const respondedAt = new Date();

    await db.update(quotes).set({ status: newStatus, respondedAt }).where(eq(quotes.id, input.quoteId));

    // If accepted, update order status to "approved"
    if (input.accepted) {
      await db.update(orders).set({ status: "approved" }).where(eq(orders.id, quote.orderId));
    }

    return {
      success: true,
      message: `Quote ${newStatus} successfully`,
    };
  }),
});
