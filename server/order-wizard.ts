import { getDb } from "./db";
import { 
  orderLineItems, 
  designQuantityTracker, 
  designUploadsByQuantity,
  lineItemDesignVariations,
  designSummaryCache,
  printPlacements,
  printOptions,
  orders
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Create or update a line item with design variation settings
 */
export async function createLineItemWithDesignVariation(
  lineItemId: number,
  designVariationType: "same_across_all" | "different_per_quantity",
  quantity: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Create design variation record
  await db.insert(lineItemDesignVariations).values({
    lineItemId,
    designVariationType,
  });

  // Create quantity trackers for each quantity
  const quantityTrackers: typeof designQuantityTracker.$inferInsert[] = [];
  for (let i = 1; i <= quantity; i++) {
    quantityTrackers.push({
      lineItemId,
      quantityNumber: i,
      hasCustomDesign: false,
    });
  }

  await db.insert(designQuantityTracker).values(quantityTrackers);
}

/**
 * Upload design for a specific placement on a specific quantity
 */
export async function uploadDesignForQuantity(
  designQuantityId: number,
  placementId: number,
  printSizeId: number,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  thumbnailUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Insert design upload
  const result = await db.insert(designUploadsByQuantity).values({
    designQuantityId,
    placementId,
    printSizeId,
    uploadedFilePath: filePath,
    uploadedFileName: fileName,
    fileSize,
    mimeType,
    thumbnailUrl,
  });

  // Mark quantity as having custom design
  await db
    .update(designQuantityTracker)
    .set({ hasCustomDesign: true })
    .where(eq(designQuantityTracker.id, designQuantityId));

  return result;
}

/**
 * Get all designs for a specific line item quantity
 */
export async function getDesignsForQuantity(designQuantityId: number) {
  const db = await getDb();
  if (!db) return [];

  const designs = await db
    .select()
    .from(designUploadsByQuantity)
    .where(eq(designUploadsByQuantity.designQuantityId, designQuantityId));

  return designs;
}

/**
 * Get all quantities for a line item with their design status
 */
export async function getLineItemQuantitiesWithDesigns(lineItemId: number) {
  const db = await getDb();
  if (!db) return [];

  const quantities = await db
    .select()
    .from(designQuantityTracker)
    .where(eq(designQuantityTracker.lineItemId, lineItemId));

  // Fetch designs for each quantity
  const quantitiesWithDesigns = await Promise.all(
    quantities.map(async (qty: typeof designQuantityTracker.$inferSelect) => ({
      ...qty,
      designs: await getDesignsForQuantity(qty.id),
    }))
  );

  return quantitiesWithDesigns;
}

/**
 * Get design variation type for a line item
 */
export async function getLineItemDesignVariation(lineItemId: number) {
  const db = await getDb();
  if (!db) return null;

  const variation = await db
    .select()
    .from(lineItemDesignVariations)
    .where(eq(lineItemDesignVariations.lineItemId, lineItemId))
    .limit(1);

  return variation[0];
}

/**
 * Update design summary cache for an order
 */
export async function updateDesignSummary(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get all line items for the order
  const lineItems = await db
    .select()
    .from(orderLineItems)
    .where(eq(orderLineItems.orderId, orderId));

  let totalDesignCount = 0;
  const placementBreakdown: Record<string, number> = {};
  let hasMultipleDesignVariations = false;

  // Process each line item
  for (const lineItem of lineItems as typeof orderLineItems.$inferSelect[]) {
    const quantities = await getLineItemQuantitiesWithDesigns(lineItem.id);
    const variation = await getLineItemDesignVariation(lineItem.id);

    // Check if there are different design variations
    if (variation?.designVariationType === "different_per_quantity") {
      hasMultipleDesignVariations = true;
    }

    // Count designs and organize by placement
    for (const qty of quantities) {
      for (const design of qty.designs) {
        totalDesignCount++;

        // Get placement name
        const placement = await db
          .select()
          .from(printPlacements)
          .where(eq(printPlacements.id, design.placementId))
          .limit(1);

        if (placement[0]) {
          const placementName = placement[0].placementName;
          placementBreakdown[placementName] =
            (placementBreakdown[placementName] || 0) + 1;
        }
      }
    }
  }

  // Upsert design summary cache
  const existing = await db
    .select()
    .from(designSummaryCache)
    .where(eq(designSummaryCache.orderId, orderId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(designSummaryCache)
      .set({
        totalDesignCount,
        placementBreakdown: placementBreakdown,
        hasMultipleDesignVariations,
      })
      .where(eq(designSummaryCache.orderId, orderId));
  } else {
    await db.insert(designSummaryCache).values({
      orderId,
      totalDesignCount,
      placementBreakdown: placementBreakdown,
      hasMultipleDesignVariations,
    });
  }
}

/**
 * Get complete order design summary
 */
export async function getOrderDesignSummary(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const summary = await db
    .select()
    .from(designSummaryCache)
    .where(eq(designSummaryCache.orderId, orderId))
    .limit(1);

  if (!summary[0]) {
    await updateDesignSummary(orderId);
    return getOrderDesignSummary(orderId);
  }

  return summary[0];
}

/**
 * Get complete order with all line items and designs
 */
export async function getOrderWithAllDesigns(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order[0]) return null;

  const lineItems = await db
    .select()
    .from(orderLineItems)
    .where(eq(orderLineItems.orderId, orderId));

  // Get all line items with their quantities and designs
  const lineItemsWithDesigns = await Promise.all(
    lineItems.map(async (lineItem) => ({
      ...lineItem,
      designVariation: await getLineItemDesignVariation(lineItem.id),
      quantities: await getLineItemQuantitiesWithDesigns(lineItem.id),
    }))
  );

  const designSummary = await getOrderDesignSummary(orderId);

  return {
    ...order[0],
    lineItems: lineItemsWithDesigns,
    designSummary,
  };
}
