import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders, designQuantityTracker, designUploadsByQuantity, lineItemDesignVariations } from "../../drizzle/schema";
import { createLineItemWithDesignVariation, getOrderWithAllDesigns } from "../order-wizard";
import { storagePut } from "../storage";
import { eq } from "drizzle-orm";

export const advancedOrdersRouter = router({
  /**
   * Create an advanced order with multiple line items and design variations
   * This creates multiple order records (one per line item) that are linked via metadata
   */
  createAdvancedOrder: protectedProcedure
    .input(
      z.object({
        lineItems: z.array(
          z.object({
            productId: z.number(),
            colorId: z.number(),
            sizeId: z.number(),
            quantity: z.number().min(1).max(100),
            designVariation: z.enum(["same_across_all", "different_per_quantity"]),
            selectedPlacements: z.array(z.number()),
          })
        ),
        customerFirstName: z.string().min(1),
        customerLastName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string(),
        customerCompany: z.string().optional(),
        additionalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const createdOrders = [];
        const masterOrderId = `master-${Date.now()}`;

        // Create one order per line item
        for (let i = 0; i < input.lineItems.length; i++) {
          const lineItem = input.lineItems[i];

          const orderResult = await db.insert(orders).values({
            userId: ctx.user.id,
            productId: lineItem.productId,
            colorId: lineItem.colorId,
            sizeId: lineItem.sizeId,
            quantity: lineItem.quantity,
            totalPriceEstimate: "0",
            status: "pending",
            customerFirstName: input.customerFirstName,
            customerLastName: input.customerLastName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            customerCompany: input.customerCompany || undefined,
            deliveryMethod: "delivery",
            additionalNotes: `${input.additionalNotes || ""} [Advanced Order - Item ${i + 1} of ${input.lineItems.length}] [Master ID: ${masterOrderId}]`,
            paymentStatus: "unpaid",
          });

          const orderId = (orderResult as any)[0]?.id;
          if (!orderId) throw new Error("Failed to create order");

          // Create design variation tracking for this order
          try {
            const lineItemId = orderId; // Use order ID as line item ID for simplicity
            await createLineItemWithDesignVariation(
              lineItemId,
              lineItem.designVariation,
              lineItem.quantity
            );
          } catch (designError) {
            console.error("Error creating design variation:", designError);
            // Continue even if design variation creation fails
          }

          createdOrders.push({
            orderId,
            ...lineItem,
          });
        }

        return {
          masterOrderId,
          createdOrders,
          status: "success",
          message: "Orders created successfully. Please upload your designs for each item.",
        };
      } catch (error) {
        console.error("Error creating advanced order:", error);
        throw error;
      }
    }),

  /**
   * Upload design file for a specific quantity and placement
   */
  uploadDesignFile: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        quantityNumber: z.number().min(1),
        placementId: z.number(),
        printSizeId: z.number(),
        file: z.instanceof(File),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Get design quantity tracker
        const designQtyResult = await db
          .select()
          .from(designQuantityTracker)
          .where(eq(designQuantityTracker.lineItemId, input.orderId))
          .limit(1);

        if (!designQtyResult[0]) {
          throw new Error("Design quantity tracker not found");
        }

        const designQuantityId = designQtyResult[0].id;

        // Upload file to S3
        const buffer = await input.file.arrayBuffer();
        const fileKey = `orders/${input.orderId}/designs/${input.quantityNumber}-${input.placementId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const { url } = await storagePut(fileKey, Buffer.from(buffer), input.file.type);

        // Store design upload record
        const uploadResult = await db.insert(designUploadsByQuantity).values({
          designQuantityId,
          placementId: input.placementId,
          printSizeId: input.printSizeId,
          uploadedFilePath: fileKey,
          uploadedFileName: input.file.name,
          fileSize: input.file.size,
          mimeType: input.file.type,
          thumbnailUrl: url,
        });

        return {
          success: true,
          uploadId: (uploadResult as any)[0]?.id,
          fileUrl: url,
          message: "Design uploaded successfully",
        };
      } catch (error) {
        console.error("Error uploading design file:", error);
        throw error;
      }
    }),

  /**
   * Get order with all designs organized by placement and quantity
   */
  getOrderDesigns: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return null;

        // Get order
        const orderResult = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

        if (!orderResult[0]) {
          throw new Error("Order not found");
        }

        // Verify user owns this order
        if (orderResult[0].userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Get design variation
        const variationResult = await db
          .select()
          .from(lineItemDesignVariations)
          .where(eq(lineItemDesignVariations.lineItemId, input.orderId))
          .limit(1);

        // Get quantities with designs
        const quantitiesResult = await db
          .select()
          .from(designQuantityTracker)
          .where(eq(designQuantityTracker.lineItemId, input.orderId));

        // Get all uploads for this order
        const uploadsResult = await db
          .select()
          .from(designUploadsByQuantity)
          .where(eq(designUploadsByQuantity.designQuantityId, quantitiesResult[0]?.id || 0));

        return {
          order: orderResult[0],
          designVariation: variationResult[0],
          quantities: quantitiesResult,
          uploads: uploadsResult,
        };
      } catch (error) {
        console.error("Error fetching order designs:", error);
        throw error;
      }
    }),

  /**
   * Submit order for processing (all designs uploaded)
   */
  submitAdvancedOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Verify order exists and user owns it
        const orderResult = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

        if (!orderResult[0]) {
          throw new Error("Order not found");
        }

        if (orderResult[0].userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Update order status to "approved"
        await db.update(orders).set({ status: "approved" }).where(eq(orders.id, input.orderId));

        return {
          success: true,
          message: "Order submitted successfully. Proceeding to payment.",
        };
      } catch (error) {
        console.error("Error submitting order:", error);
        throw error;
      }
    }),
});
