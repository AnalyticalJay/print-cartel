import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getOrderStatusHistory, logOrderStatusChange } from "../db";
import { orders, orderPrints, printOptions, printPlacements, products, productColors, productSizes, paymentProofs, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendStatusUpdateEmail } from "../email";
import { createInvoice } from "../invoice";
import { sendQuoteEmail, sendFinalInvoiceEmail } from "../payment-emails";
import { sendPaymentConfirmationEmail } from "../payment-confirmation-email";
import { sendPaymentProofTemplateEmail } from "../payment-proof-email";
import { getInvoices, getInvoiceStats } from "../db";

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

        // Get previous status for history logging
        const previousStatus = order.status;
        
        // Update order status
        await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.orderId));
        
        // Log status change to history
        try {
          await logOrderStatusChange(
            input.orderId,
            previousStatus,
            input.status,
            ctx.user?.id,
            undefined // No admin notes for now
          );
        } catch (historyError) {
          console.warn("Failed to log status change to history:", historyError);
          // Don't fail the status update if history logging fails
        }

        // Send appropriate email based on status change
        try {
          if (input.status === "quoted" && input.quoteAmount) {
            // Send quote email when status changes to quoted
            const depositAmount = input.quoteAmount * 0.5;
            const deliveryCharge = parseFloat(order.deliveryCharge || "0");
            await sendQuoteEmail(
              order.customerEmail,
              `${order.customerFirstName} ${order.customerLastName}`,
              input.orderId,
              `INV-${input.orderId}-${Date.now()}`,
              input.quoteAmount,
              depositAmount,
              deliveryCharge,
              `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://printcartel.co.za'}/payment/${input.orderId}`
            );
          } else if (input.status === "approved") {
            // Send final invoice email when status changes to approved
            const totalAmount = parseFloat(order.totalPriceEstimate || "0");
            const depositAmount = totalAmount * 0.5;
            await sendFinalInvoiceEmail(
              order.customerEmail,
              `${order.customerFirstName} ${order.customerLastName}`,
              input.orderId,
              `INV-${input.orderId}-${Date.now()}`,
              totalAmount,
              depositAmount,
              totalAmount - depositAmount,
              `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://printcartel.co.za'}/payment/${input.orderId}`
            );
            
            // Send payment proof template email to guide customer on documentation
            try {
              await sendPaymentProofTemplateEmail({
                customerEmail: order.customerEmail,
                customerName: `${order.customerFirstName} ${order.customerLastName}`,
                orderId: input.orderId,
                orderAmount: totalAmount,
                paymentMethods: ["eft", "creditcard"],
                templateDownloadUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://printcartel.co.za'}/account?tab=orders&order=${input.orderId}`,
              });
            } catch (templateEmailError) {
              console.warn("Failed to send payment proof template email:", templateEmailError);
              // Don't fail the order approval if template email fails
            }
          } else {
            // Send general status update email for other status changes
            await sendStatusUpdateEmail(
              input.orderId,
              order.customerEmail,
              `${order.customerFirstName} ${order.customerLastName}`,
              input.status,
              input.quoteAmount
            );
          }
        } catch (emailError) {
          console.warn("Failed to send email, but order status was updated:", emailError);
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

  // Get all invoices
  getInvoices: protectedProcedure
    .input(z.object({ search: z.string().optional(), filter: z.enum(["pending", "accepted", "declined"]).optional() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        let query = db.select().from(orders);
        const allInvoices = await query;
        
        // Filter by search
        let filtered = allInvoices.filter(o => o.invoiceUrl);
        if (input.search) {
          filtered = filtered.filter(o => 
            o.customerFirstName?.toLowerCase().includes(input.search!.toLowerCase()) ||
            o.customerLastName?.toLowerCase().includes(input.search!.toLowerCase()) ||
            o.customerEmail?.toLowerCase().includes(input.search!.toLowerCase())
          );
        }

        // Filter by status
        if (input.filter === "pending") {
          filtered = filtered.filter(i => !i.invoiceAcceptedAt && !i.invoiceDeclinedAt);
        } else if (input.filter === "accepted") {
          filtered = filtered.filter(i => i.invoiceAcceptedAt && !i.invoiceDeclinedAt);
        } else if (input.filter === "declined") {
          filtered = filtered.filter(i => i.invoiceDeclinedAt);
        }

        return filtered.sort((a, b) => new Date(b.invoiceDate || 0).getTime() - new Date(a.invoiceDate || 0).getTime());
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
        throw error;
      }
    }),

  // Get invoice statistics
  getInvoiceStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const invoices = await db.select().from(orders);
        const withInvoices = invoices.filter(i => i.invoiceUrl);

        return {
          total: withInvoices.length,
          pending: withInvoices.filter(i => !i.invoiceAcceptedAt && !i.invoiceDeclinedAt).length,
          accepted: withInvoices.filter(i => i.invoiceAcceptedAt && !i.invoiceDeclinedAt).length,
          declined: withInvoices.filter(i => i.invoiceDeclinedAt).length,
          paid: withInvoices.filter(i => i.paymentStatus === 'paid' || i.paymentStatus === 'deposit_paid').length,
        };
      } catch (error) {
        console.error("Failed to fetch invoice stats:", error);
        throw error;
      }
    }),

  getPendingPaymentProofs: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      filter: z.enum(["pending", "verified", "rejected"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const allOrders = await db.select().from(orders);
        
        let filtered = allOrders.filter(o => o.paymentProofUrl);
        
        if (input.filter) {
          filtered = filtered.filter(o => o.paymentVerificationStatus === input.filter);
        }
        
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          filtered = filtered.filter(o => 
            o.customerFirstName.toLowerCase().includes(searchLower) ||
            o.customerLastName.toLowerCase().includes(searchLower) ||
            o.customerEmail.toLowerCase().includes(searchLower)
          );
        }
        
        return filtered.sort((a, b) => {
          const aTime = a.paymentProofUploadedAt?.getTime() || 0;
          const bTime = b.paymentProofUploadedAt?.getTime() || 0;
          return bTime - aTime;
        }).slice(0, 100);
      } catch (error) {
        console.error("Failed to get pending payment proofs:", error);
        throw error;
      }
    }),

  // Verify payment proof (legacy - for direct order verification)
  verifyPaymentProofLegacy: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const orderResult = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        if (!orderResult.length) throw new Error("Order not found");
        const order = orderResult[0];

        await db.update(orders).set({
          paymentVerificationStatus: "verified",
          paymentVerifiedAt: new Date(),
          paymentVerificationNotes: input.notes || null,
          paymentStatus: "paid",
        }).where(eq(orders.id, input.orderId));

        try {
          await sendPaymentConfirmationEmail(
            order.customerEmail,
            `${order.customerFirstName} ${order.customerLastName}`,
            input.orderId,
            `INV-${input.orderId}`,
            parseFloat(order.amountPaid || "0"),
            parseFloat(order.totalPriceEstimate),
            Math.max(0, parseFloat(order.totalPriceEstimate) - parseFloat(order.amountPaid || "0")),
            new Date().toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
          console.log(`✓ Payment confirmation email sent to ${order.customerEmail}`);
        } catch (emailError) {
          console.error(`Failed to send payment confirmation email for order ${input.orderId}:`, emailError);
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to verify payment proof:", error);
        throw error;
      }
    }),

  rejectPaymentProofLegacy: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(orders).set({
          paymentVerificationStatus: "rejected",
          paymentVerificationNotes: input.reason,
        }).where(eq(orders.id, input.orderId));

        return { success: true };
      } catch (error) {
        console.error("Failed to reject payment proof:", error);
        throw error;
      }
    }),

  // Create and send manual invoice to customer
  createManualInvoice: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        customMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get order details
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const orderData = orderResult[0];

        // Generate invoice PDF
        const { generateInvoicePDF } = await import("../invoice-service");
        const invoiceBuffer = await generateInvoicePDF(orderData.id);

        // Upload invoice to S3
        const { storagePut } = await import("../storage");
        const { url } = await storagePut(
          `invoices/${orderData.id}-manual-${Date.now()}.pdf`,
          invoiceBuffer,
          "application/pdf"
        );

        // Send email to customer
        const { sendInvoiceEmail } = await import("../invoice-email");
        await sendInvoiceEmail({
          customerEmail: orderData.customerEmail,
          customerName: `${orderData.customerFirstName} ${orderData.customerLastName}`,
          orderId: orderData.id,
          invoicePdfUrl: url,
          totalPrice: parseFloat(orderData.totalPriceEstimate as any),
          depositAmount: parseFloat(orderData.depositAmount as any) || 0,
        });

        console.log(`✓ Manual invoice created and sent for order ${input.orderId}`);
        return { success: true, invoiceUrl: url };
      } catch (error) {
        console.error("Failed to create manual invoice:", error);
        throw error;
      }
    }),
  // Resend invoice email to customer
  resendInvoice: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get order with invoice
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const orderData = orderResult[0];

        if (!orderData.invoiceUrl) {
          throw new Error("No invoice found for this order");
        }

        // Send invoice email
        const { sendInvoiceEmail } = await import("../invoice-email");
        await sendInvoiceEmail({
          customerEmail: orderData.customerEmail,
          customerName: `${orderData.customerFirstName} ${orderData.customerLastName}`,
          orderId: orderData.id,
          invoicePdfUrl: orderData.invoiceUrl,
          totalPrice: parseFloat(orderData.totalPriceEstimate as any),
          depositAmount: parseFloat(orderData.depositAmount as any) || 0,
          paymentMethod: orderData.paymentMethod || "full_payment",
        });

        // Update order timestamp to track resend
        await db
          .update(orders)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        console.log(`✓ Invoice resent for order ${input.orderId}`);
        return { success: true, message: "Invoice resent successfully" };
      } catch (error) {
        console.error("Failed to resend invoice:", error);
        throw error;
      }
    }),

  // Get payment proofs for verification (new - for manual payment tracking)
  getPaymentProofs: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "verified", "rejected"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let proofs;
        
        if (input.status) {
          proofs = await db.select().from(paymentProofs).where(eq(paymentProofs.status, input.status));
        } else {
          proofs = await db.select().from(paymentProofs);
        }

        // Fetch related order and user data
        const proofsWithDetails = await Promise.all(
          proofs.map(async (proof) => {
            const order = await db
              .select()
              .from(orders)
              .where(eq(orders.id, proof.orderId))
              .limit(1);

            const user = await db
              .select()
              .from(users)
              .where(eq(users.id, proof.userId))
              .limit(1);

            return {
              ...proof,
              order: order[0] || null,
              user: user[0] || null,
            };
          })
        );

        return proofsWithDetails;
      } catch (error) {
        console.error("Failed to fetch payment proofs:", error);
        throw error;
      }
    }),

  // Verify payment proof
  verifyPaymentProof: protectedProcedure
    .input(z.object({
      paymentProofId: z.number(),
      action: z.enum(["approve", "reject"]),
      verifiedAmount: z.number().optional(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get payment proof
        const proofResult = await db
          .select()
          .from(paymentProofs)
          .where(eq(paymentProofs.id, input.paymentProofId))
          .limit(1);

        if (!proofResult.length) {
          throw new Error("Payment proof not found");
        }

        const proof = proofResult[0];

        // Get order details
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, proof.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const order = orderResult[0];

        // Update payment proof status
        const newStatus = input.action === "approve" ? "verified" : "rejected";
        await db
          .update(paymentProofs)
          .set({
            status: newStatus,
            verifiedAt: new Date(),
            verifiedBy: ctx.user.id,
            adminNotes: input.adminNotes || null,
            updatedAt: new Date(),
          })
          .where(eq(paymentProofs.id, input.paymentProofId));

        // If approved, update order payment status
        if (input.action === "approve") {
          const amountPaid = input.verifiedAmount || parseFloat(order.totalPriceEstimate as any);
          const totalPrice = parseFloat(order.totalPriceEstimate as any);
          const paymentStatus = amountPaid >= totalPrice ? "paid" : "deposit_paid";

          await db
            .update(orders)
            .set({
              paymentStatus,
              amountPaid: amountPaid.toString(),
              paymentVerifiedAt: new Date(),
              paymentVerificationNotes: input.adminNotes || null,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, proof.orderId));
        }

        // Send notification email to customer
        try {
          if (input.action === "approve") {
            await sendPaymentConfirmationEmail(
              order.customerEmail,
              `${order.customerFirstName} ${order.customerLastName}`,
              order.id,
              `INV-${order.id}`,
              input.verifiedAmount || parseFloat(order.totalPriceEstimate as any),
              parseFloat(order.totalPriceEstimate as any),
              0,
              new Date().toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
            console.log(`✓ Payment confirmation email sent to ${order.customerEmail}`);
          }
        } catch (emailError) {
          console.error(`Failed to send payment confirmation email for order ${order.id}:`, emailError);
        }

        return { success: true, message: `Payment ${input.action === "approve" ? "approved" : "rejected"} successfully` };
      } catch (error) {
        console.error("Failed to verify payment proof:", error);
        throw error;
      }
    }),
});
