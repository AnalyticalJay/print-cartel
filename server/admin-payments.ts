import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { orders, paymentRecords } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Get all payment records with order details for admin payments dashboard
 */
export const getPaymentRecords = protectedProcedure
  .input(
    z.object({
      status: z.enum(["all", "pending", "completed", "failed", "refunded"]).optional(),
      paymentType: z.enum(["all", "deposit", "final_payment"]).optional(),
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
    })
  )
  .query(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all payment records with order details
      const allRecords = await db
        .select({
          paymentId: paymentRecords.id,
          orderId: paymentRecords.orderId,
          customerFirstName: orders.customerFirstName,
          customerLastName: orders.customerLastName,
          customerEmail: orders.customerEmail,
          amount: paymentRecords.amount,
          paymentMethod: paymentRecords.paymentMethod,
          paymentStatus: paymentRecords.paymentStatus,
          paymentType: paymentRecords.paymentType,
          transactionId: paymentRecords.transactionId,
          orderStatus: orders.status,
          totalPrice: orders.totalPriceEstimate,
          paymentVerificationStatus: orders.paymentVerificationStatus,
          createdAt: paymentRecords.createdAt,
          updatedAt: paymentRecords.updatedAt,
        })
        .from(paymentRecords)
        .innerJoin(orders, eq(paymentRecords.orderId, orders.id))
        .orderBy(desc(paymentRecords.createdAt));

      // Filter records in memory
      let filtered = allRecords;

      if (input.status && input.status !== "all") {
        filtered = filtered.filter((r) => r.paymentStatus === input.status);
      }

      if (input.paymentType && input.paymentType !== "all") {
        filtered = filtered.filter((r) => r.paymentType === input.paymentType);
      }

      // Apply pagination
      const paginated = filtered.slice(input.offset, input.offset + input.limit);

      // Parse decimal values
      return paginated.map((record) => ({
        ...record,
        amount: parseFloat(record.amount as any),
        totalPrice: parseFloat(record.totalPrice as any),
      }));
    } catch (error) {
      console.error("Failed to fetch payment records:", error);
      throw error;
    }
  });

/**
 * Get payment statistics for admin dashboard
 */
export const getPaymentStats = protectedProcedure.query(async ({ ctx }) => {
  if (ctx.user?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all payment records
    const allRecords = await db.select().from(paymentRecords);

    // Calculate statistics
    const stats = {
      totalPayments: allRecords.length,
      completedPayments: allRecords.filter((r) => r.paymentStatus === "completed").length,
      pendingPayments: allRecords.filter((r) => r.paymentStatus === "pending").length,
      failedPayments: allRecords.filter((r) => r.paymentStatus === "failed").length,
      refundedPayments: allRecords.filter((r) => r.paymentStatus === "refunded").length,
      totalAmount: allRecords.reduce(
        (sum, r) => sum + parseFloat(r.amount as any),
        0
      ),
      completedAmount: allRecords
        .filter((r) => r.paymentStatus === "completed")
        .reduce((sum, r) => sum + parseFloat(r.amount as any), 0),
      pendingAmount: allRecords
        .filter((r) => r.paymentStatus === "pending")
        .reduce((sum, r) => sum + parseFloat(r.amount as any), 0),
    };

    return stats;
  } catch (error) {
    console.error("Failed to fetch payment statistics:", error);
    throw error;
  }
});

/**
 * Get payment records by order ID
 */
export const getPaymentsByOrderId = protectedProcedure
  .input(z.object({ orderId: z.number() }))
  .query(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const records = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.orderId, input.orderId))
        .orderBy(desc(paymentRecords.createdAt));

      return records.map((record) => ({
        ...record,
        amount: parseFloat(record.amount as any),
      }));
    } catch (error) {
      console.error("Failed to fetch payment records for order:", error);
      throw error;
    }
  });
