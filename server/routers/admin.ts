import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, orderPrints, printOptions, printPlacements, products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendStatusUpdateEmail } from "../email";

export const adminRouter = router({
  // Get all orders with related data for admin dashboard
  getAllOrders: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const allOrders = await db.select().from(orders);
      return allOrders.map((order) => ({
        ...order,
        totalPriceEstimate: parseFloat(order.totalPriceEstimate as any),
      }));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      throw new Error("Failed to fetch orders");
    }
  }),

  // Get detailed order with all prints and related data
  getOrderDetail: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

        if (order.length === 0) {
          throw new Error("Order not found");
        }

        const prints = await db.select().from(orderPrints).where(eq(orderPrints.orderId, input.orderId));

        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, order[0].productId))
          .limit(1);

        return {
          ...order[0],
          totalPriceEstimate: parseFloat(order[0].totalPriceEstimate as any),
          prints: prints.map((p) => ({
            ...p,
            fileSize: p.fileSize ? Number(p.fileSize) : null,
          })),
          product: product[0] || null,
        };
      } catch (error) {
        console.error("Failed to fetch order detail:", error);
        throw new Error("Failed to fetch order detail");
      }
    }),

  // Bulk update order status
  bulkUpdateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderIds: z.array(z.number()),
        status: z.enum(["pending", "quoted", "approved", "in-production", "completed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        for (const orderId of input.orderIds) {
          await db.update(orders).set({ status: input.status }).where(eq(orders.id, orderId));
        }

        return { success: true, updatedCount: input.orderIds.length, newStatus: input.status };
      } catch (error) {
        console.error("Failed to bulk update order status:", error);
        throw new Error("Failed to bulk update order status");
      }
    }),

  // Update order status
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "quoted", "approved", "in-production", "completed"]),
        quoteAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // Fetch order details to get customer info
        const orderData = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        if (orderData.length === 0) {
          throw new Error("Order not found");
        }
        const order = orderData[0];

        // Update order status
        await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.orderId));

        // Send status update email to customer
        try {
          await sendStatusUpdateEmail(
            input.orderId,
            order.customerEmail,
            `${order.customerFirstName} ${order.customerLastName}`,
            input.status,
            input.quoteAmount
          );
        } catch (emailError) {
          console.warn("Failed to send status update email, but order status was updated:", emailError);
          // Don't fail the status update if email fails
        }

        return { success: true, orderId: input.orderId, newStatus: input.status };
      } catch (error) {
        console.error("Failed to update order status:", error);
        throw new Error("Failed to update order status");
      }
    }),

  // Update order pricing
  updateOrderPricing: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        totalPriceEstimate: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db
          .update(orders)
          .set({
            totalPriceEstimate: input.totalPriceEstimate.toString(),
          })
          .where(eq(orders.id, input.orderId));

        // Note: pricing notes could be stored in additionalNotes if needed
        // For now, we only update the price estimate

        return { success: true, orderId: input.orderId, newPrice: input.totalPriceEstimate };
      } catch (error) {
        console.error("Failed to update order pricing:", error);
        throw new Error("Failed to update order pricing");
      }
    }),

  // Search orders by customer name or email
  searchOrders: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const allOrders = await db.select().from(orders);

        const filtered = allOrders.filter((order) => {
          const fullName = `${order.customerFirstName} ${order.customerLastName}`.toLowerCase();
          const email = order.customerEmail?.toLowerCase() || "";
          const company = order.customerCompany?.toLowerCase() || "";
          const query = input.query.toLowerCase();

          return fullName.includes(query) || email.includes(query) || company.includes(query);
        });

        return filtered.map((order) => ({
          ...order,
          totalPriceEstimate: parseFloat(order.totalPriceEstimate as any),
        }));
      } catch (error) {
        console.error("Failed to search orders:", error);
        throw new Error("Failed to search orders");
      }
    }),

  // Get orders by status
  getOrdersByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["pending", "quoted", "approved"]) }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const filtered = await db.select().from(orders).where(eq(orders.status, input.status));

        return filtered.map((order) => ({
          ...order,
          totalPriceEstimate: parseFloat(order.totalPriceEstimate as any),
        }));
      } catch (error) {
        console.error("Failed to fetch orders by status:", error);
        throw new Error("Failed to fetch orders by status");
      }
    }),

  // Get order statistics
  getOrderStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const allOrders = await db.select().from(orders);

      const stats = {
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((o) => o.status === "pending").length,
        quotedOrders: allOrders.filter((o) => o.status === "quoted").length,
        approvedOrders: allOrders.filter((o) => o.status === "approved").length,
        totalRevenue: allOrders.reduce((sum, o) => sum + parseFloat(o.totalPriceEstimate as any), 0),
      };

      return stats;
    } catch (error) {
      console.error("Failed to get order stats:", error);
      throw new Error("Failed to get order stats");
    }
  }),
});
