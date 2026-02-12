import { getDb } from "./db";
import { products, printOptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Pricing structure:
 * - Base price per product (from products table)
 * - Quantity multiplier (1x for any quantity)
 * - Print placement cost: R50 per placement
 * - Print size additional cost (from printOptions table)
 * - Bulk discount: 10% for 10+, 20% for 50+, 30% for 100+
 *
 * Formula: ((basePrice * quantity) + (numPlacements * 50) + (sum of print size costs)) - bulk discount
 */

export interface PricingInput {
  productId: number;
  quantity: number;
  printPlacements: Array<{
    printSizeId: number;
  }>;
}

export interface PricingBreakdown {
  basePrice: number;
  productSubtotal: number;
  placementCost: number;
  printSizeCosts: number;
  bulkDiscount: number;
  bulkDiscountPercentage: number;
  totalPrice: number;
  details: {
    productName: string;
    quantity: number;
    numPlacements: number;
    printSizeDetails: Array<{
      printSize: string;
      additionalPrice: number;
    }>;
  };
}

const PLACEMENT_COST_PER_UNIT = 50; // R50 per placement

// Bulk discount tiers
function getBulkDiscountPercentage(quantity: number): number {
  if (quantity >= 100) return 30;
  if (quantity >= 50) return 20;
  if (quantity >= 10) return 10;
  return 0;
}

export async function calculateOrderPrice(input: PricingInput): Promise<PricingBreakdown> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch product information
  const productData = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);

  if (productData.length === 0) {
    throw new Error(`Product with ID ${input.productId} not found`);
  }

  const product = productData[0];
  const basePrice = parseFloat(product.basePrice as any);

  // Calculate product subtotal
  const productSubtotal = basePrice * input.quantity;

  // Calculate placement cost
  const numPlacements = input.printPlacements.length;
  const placementCost = numPlacements * PLACEMENT_COST_PER_UNIT;

  // Fetch print size costs
  let printSizeCosts = 0;
  const printSizeDetails: Array<{ printSize: string; additionalPrice: number }> = [];

  for (const placement of input.printPlacements) {
    const printOptionData = await db
      .select()
      .from(printOptions)
      .where(eq(printOptions.id, placement.printSizeId))
      .limit(1);

    if (printOptionData.length > 0) {
      const printOption = printOptionData[0];
      const additionalPrice = parseFloat(printOption.additionalPrice as any);
      printSizeCosts += additionalPrice;

      printSizeDetails.push({
        printSize: printOption.printSize,
        additionalPrice,
      });
    }
  }

  // Calculate bulk discount
  const bulkDiscountPercentage = getBulkDiscountPercentage(input.quantity);
  const subtotalBeforeDiscount = productSubtotal + placementCost + printSizeCosts;
  const bulkDiscount = (subtotalBeforeDiscount * bulkDiscountPercentage) / 100;
  const totalPrice = subtotalBeforeDiscount - bulkDiscount;

  return {
    basePrice,
    productSubtotal,
    placementCost,
    printSizeCosts,
    bulkDiscount,
    bulkDiscountPercentage,
    totalPrice,
    details: {
      productName: product.name,
      quantity: input.quantity,
      numPlacements,
      printSizeDetails,
    },
  };
}

/**
 * Calculate price for a single placement (used for real-time updates)
 */
export async function calculatePlacementPrice(printSizeId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const printOptionData = await db
    .select()
    .from(printOptions)
    .where(eq(printOptions.id, printSizeId))
    .limit(1);

  if (printOptionData.length === 0) {
    throw new Error(`Print option with ID ${printSizeId} not found`);
  }

  return parseFloat(printOptionData[0].additionalPrice as any);
}

/**
 * Get all available print options with their prices
 */
export async function getPrintOptions() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const options = await db.select().from(printOptions);

  return options.map((opt) => ({
    id: opt.id,
    printSize: opt.printSize,
    additionalPrice: parseFloat(opt.additionalPrice as any),
  }));
}

/**
 * Get product base price
 */
export async function getProductPrice(productId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const productData = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (productData.length === 0) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  return parseFloat(productData[0].basePrice as any);
}
