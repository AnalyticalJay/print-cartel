import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getOrderStatusHistory } from "../db";
import { orders, orderPrints, printOptions, printPlacements, products, productColors, productSizes } from "../../drizzle/schema";
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

        // Fetch product details
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, order[0].productId))
          .limit(1);

        // Fetch color details
        const color = await db
          .select()
          .from(productColors)
          .where(eq(productColors.id, order[0].colorId))
          .limit(1);

        // Fetch size details
        const size = await db
          .select()
          .from(productSizes)
          .where(eq(productSizes.id, order[0].sizeId))
          .limit(1);

        // Fetch all prints with placement and print size details
        const prints = await db.select().from(orderPrints).where(eq(orderPrints.orderId, input.orderId));

        // Fetch placement and print size details for each print
        const printsWithDetails = await Promise.all(
          prints.map(async (print) => {
            const placement = await db
              .select()
              .from(printPlacements)
              .where(eq(printPlacements.id, print.placementId))
              .limit(1);

            const printSize = await db
              .select()
              .from(printOptions)
              .where(eq(printOptions.id, print.printSizeId))
              .limit(1);

            return {
              ...print,
              fileSize: print.fileSize ? Number(print.fileSize) : null,
              placement: placement[0] || null,
              printSize: printSize[0] || null,
            };
          })
        );

        return {
          ...order[0],
          totalPriceEstimate: parseFloat(order[0].totalPriceEstimate as any),
          product: product[0] || null,
          color: color[0] || null,
          size: size[0] || null,
          prints: printsWithDetails,
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
        status: z.enum(["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]),
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
        status: z.enum(["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]),
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

  // ===== INVENTORY MANAGEMENT =====

  // Get all products
  getAllProducts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const allProducts = await db.select().from(products);
      return allProducts.map((p) => ({
        ...p,
        basePrice: parseFloat(p.basePrice as any),
      }));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      throw new Error("Failed to fetch products");
    }
  }),

  // Create new product
  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        basePrice: z.number().positive(),
        productType: z.string().optional(),
        fabricType: z.string().optional(),
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
        const result = await db.insert(products).values({
          name: input.name,
          description: input.description || "",
          basePrice: input.basePrice.toString(),
          productType: input.productType || "General",
          fabricType: input.fabricType || "",
        });

        return { success: true, message: "Product created successfully" };
      } catch (error) {
        console.error("Failed to create product:", error);
        throw new Error("Failed to create product");
      }
    }),

  // Update product
  updateProduct: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        basePrice: z.number().positive().optional(),
        productType: z.string().optional(),
        fabricType: z.string().optional(),
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
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.basePrice) updateData.basePrice = input.basePrice.toString();
        if (input.productType) updateData.productType = input.productType;
        if (input.fabricType) updateData.fabricType = input.fabricType;

        await db.update(products).set(updateData).where(eq(products.id, input.id));

        return { success: true, message: "Product updated successfully" };
      } catch (error) {
        console.error("Failed to update product:", error);
        throw new Error("Failed to update product");
      }
    }),

  // Delete product
  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db.delete(products).where(eq(products.id, input.id));

        return { success: true, message: "Product deleted successfully" };
      } catch (error) {
        console.error("Failed to delete product:", error);
        throw new Error("Failed to delete product");
      }
    }),

  // Get all print options (colors and sizes)
  getAllPrintOptions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const allOptions = await db.select().from(printOptions);
      return allOptions;
    } catch (error) {
      console.error("Failed to fetch print options:", error);
      throw new Error("Failed to fetch print options");
    }
  }),

  // Create print option (size)
  createPrintOption: protectedProcedure
    .input(
      z.object({
        printSize: z.string().min(1),
        additionalPrice: z.number(),
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
        await db.insert(printOptions).values({
          printSize: input.printSize,
          additionalPrice: input.additionalPrice.toString(),
        });

        return { success: true, message: "Print option created successfully" };
      } catch (error) {
        console.error("Failed to create print option:", error);
        throw new Error("Failed to create print option");
      }
    }),

  // Update print option
  updatePrintOption: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        printSize: z.string().min(1).optional(),
        additionalPrice: z.number().optional(),
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
        const updateData: any = {};
        if (input.printSize) updateData.printSize = input.printSize;
        if (input.additionalPrice !== undefined) updateData.additionalPrice = input.additionalPrice.toString();

        await db.update(printOptions).set(updateData).where(eq(printOptions.id, input.id));

        return { success: true, message: "Print option updated successfully" };
      } catch (error) {
        console.error("Failed to update print option:", error);
        throw new Error("Failed to update print option");
      }
    }),

  // Delete print option
  deletePrintOption: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db.delete(printOptions).where(eq(printOptions.id, input.id));

        return { success: true, message: "Print option deleted successfully" };
      } catch (error) {
        console.error("Failed to delete print option:", error);
        throw new Error("Failed to delete print option");
      }
    }),

  // Get all print placements
  getAllPrintPlacements: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const allPlacements = await db.select().from(printPlacements);
      return allPlacements;
    } catch (error) {
      console.error("Failed to fetch print placements:", error);
      throw new Error("Failed to fetch print placements");
    }
  }),

  // Create print placement
  createPrintPlacement: protectedProcedure
    .input(
      z.object({
        placementName: z.string().min(1),
        positionCoordinates: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
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
        await db.insert(printPlacements).values({
          placementName: input.placementName,
          positionCoordinates: input.positionCoordinates || null,
        });

        return { success: true, message: "Print placement created successfully" };
      } catch (error) {
        console.error("Failed to create print placement:", error);
        throw new Error("Failed to create print placement");
      }
    }),

  // Update print placement
  updatePrintPlacement: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        placementName: z.string().min(1).optional(),
        positionCoordinates: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
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
        const updateData: any = {};
        if (input.placementName) updateData.placementName = input.placementName;
        if (input.positionCoordinates !== undefined) updateData.positionCoordinates = input.positionCoordinates;

        await db.update(printPlacements).set(updateData).where(eq(printPlacements.id, input.id));

        return { success: true, message: "Print placement updated successfully" };
      } catch (error) {
        console.error("Failed to update print placement:", error);
        throw new Error("Failed to update print placement");
      }
    }),

  // Delete print placement
  deletePrintPlacement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        await db.delete(printPlacements).where(eq(printPlacements.id, input.id));

        return { success: true, message: "Print placement deleted successfully" };
      } catch (error) {
        console.error("Failed to delete print placement:", error);
        throw new Error("Failed to delete print placement");
      }
    }),

  // Get order status history timeline
  getOrderStatusHistory: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const history = await getOrderStatusHistory(input.orderId);
        return history;
      } catch (error) {
        console.error("Failed to fetch order status history:", error);
        throw new Error("Failed to fetch order status history");
      }
    }),
});
