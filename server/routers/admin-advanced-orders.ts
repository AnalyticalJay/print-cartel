import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders, designQuantityTracker, designUploadsByQuantity, lineItemDesignVariations, printPlacements } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const adminAdvancedOrdersRouter = router({
  /**
   * Get advanced order details with all designs organized by placement and quantity
   */
  getAdvancedOrderDetails: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Get order
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult[0]) {
          throw new Error("Order not found");
        }

        const order = orderResult[0];

        // Get design variation info
        const variationResult = await db
          .select()
          .from(lineItemDesignVariations)
          .where(eq(lineItemDesignVariations.lineItemId, input.orderId))
          .limit(1);

        const variation = variationResult[0];

        // Get quantity tracker
        const quantityResult = await db
          .select()
          .from(designQuantityTracker)
          .where(eq(designQuantityTracker.lineItemId, input.orderId));

        // Get all designs for this order
        const designsResult = await db
          .select()
          .from(designUploadsByQuantity)
          .where(
            eq(designUploadsByQuantity.designQuantityId, quantityResult[0]?.id || 0)
          );

        // Get all placements for reference
        const placementsResult = await db.select().from(printPlacements);

        // Organize designs by placement and quantity
        const designsByPlacement = new Map<number, Map<number, typeof designsResult>>();

        for (const design of designsResult) {
          if (!designsByPlacement.has(design.placementId)) {
            designsByPlacement.set(design.placementId, new Map());
          }

          const placementMap = designsByPlacement.get(design.placementId)!;
          const quantityNumber = quantityResult.find(
            (q) => q.id === design.designQuantityId
          )?.quantityNumber || 1;

          if (!placementMap.has(quantityNumber)) {
            placementMap.set(quantityNumber, []);
          }

          placementMap.get(quantityNumber)!.push(design);
        }

        return {
          order,
          variation,
          quantities: quantityResult,
          designsByPlacement: Array.from(designsByPlacement.entries()).map(([placementId, quantityMap]) => ({
            placementId,
            placementName: placementsResult.find((p) => p.id === placementId)?.placementName || `Placement ${placementId}`,
            designsByQuantity: Array.from(quantityMap.entries()).map(([quantityNumber, designs]) => ({
              quantityNumber,
              designs,
            })),
          })),
          placements: placementsResult,
        };
      } catch (error) {
        console.error("Error fetching advanced order details:", error);
        throw error;
      }
    }),

  /**
   * Get all advanced orders (orders with design variations)
   */
  listAdvancedOrders: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Get orders that have design variations
        const baseQuery = db
          .select()
          .from(orders)
          .innerJoin(
            lineItemDesignVariations,
            eq(orders.id, lineItemDesignVariations.lineItemId)
          );

        const finalQuery = input.status
          ? baseQuery.where(eq(orders.status, input.status))
          : baseQuery;

        const results = await finalQuery.limit(input.limit).offset(input.offset);

        return results.map((row) => ({
          order: row.orders,
          variation: row.lineItemDesignVariations,
        }));
      } catch (error) {
        console.error("Error listing advanced orders:", error);
        throw error;
      }
    }),

  /**
   * Get design file URL for download
   */
  getDesignDownloadUrl: adminProcedure
    .input(z.object({ designUploadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        const designResult = await db
          .select()
          .from(designUploadsByQuantity)
          .where(eq(designUploadsByQuantity.id, input.designUploadId))
          .limit(1);

        if (!designResult[0]) {
          throw new Error("Design not found");
        }

        const design = designResult[0];

        return {
          fileName: design.uploadedFileName,
          fileSize: design.fileSize,
          mimeType: design.mimeType,
          downloadUrl: design.thumbnailUrl, // S3 URL can be used for download
          uploadedAt: new Date(design.id), // Approximate timestamp
        };
      } catch (error) {
        console.error("Error getting design download URL:", error);
        throw error;
      }
    }),
});
