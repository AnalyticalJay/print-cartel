import { describe, it, expect, beforeAll } from "vitest";
import { calculateOrderPrice, calculatePlacementPrice, getPrintOptions, getProductPrice } from "./pricing";
import { getDb } from "./db";

describe("pricing service", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("calculates order price with product and quantity", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 2,
      printPlacements: [],
    });

    expect(pricing).toBeDefined();
    expect(pricing.basePrice).toBeGreaterThan(0);
    expect(pricing.productSubtotal).toBe(pricing.basePrice * 2);
    expect(pricing.placementCost).toBe(0);
    expect(pricing.printSizeCosts).toBe(0);
    expect(pricing.totalPrice).toBe(pricing.productSubtotal);
  });

  it("includes placement costs in total price", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 1,
      printPlacements: [
        { printSizeId: 1 },
        { printSizeId: 2 },
      ],
    });

    expect(pricing.placementCost).toBe(100); // 2 placements × R50
    expect(pricing.totalPrice).toBeGreaterThan(pricing.productSubtotal);
  });

  it("includes print size costs in total price", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 1,
      printPlacements: [{ printSizeId: 1 }],
    });

    expect(pricing.printSizeCosts).toBeGreaterThanOrEqual(0);
    expect(pricing.totalPrice).toBeGreaterThanOrEqual(pricing.productSubtotal + pricing.placementCost);
  });

  it("calculates correct total with all components", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 3,
      printPlacements: [
        { printSizeId: 1 },
        { printSizeId: 2 },
      ],
    });

    const expected = pricing.productSubtotal + pricing.placementCost + pricing.printSizeCosts;
    expect(pricing.totalPrice).toBe(expected);
  });

  it("returns detailed breakdown information", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 2,
      printPlacements: [{ printSizeId: 1 }],
    });

    expect(pricing.details).toBeDefined();
    expect(pricing.details.productName).toBeTruthy();
    expect(pricing.details.quantity).toBe(2);
    expect(pricing.details.numPlacements).toBe(1);
    expect(pricing.details.printSizeDetails).toBeInstanceOf(Array);
  });

  it("calculates placement price correctly", async () => {
    const placementPrice = await calculatePlacementPrice(1);
    expect(placementPrice).toBeGreaterThanOrEqual(0);
  });

  it("retrieves all print options with prices", async () => {
    const options = await getPrintOptions();
    expect(options).toBeInstanceOf(Array);
    expect(options.length).toBeGreaterThan(0);

    options.forEach((opt) => {
      expect(opt.id).toBeDefined();
      expect(opt.printSize).toBeTruthy();
      expect(opt.additionalPrice).toBeGreaterThanOrEqual(0);
    });
  });

  it("retrieves product base price", async () => {
    const price = await getProductPrice(1);
    expect(price).toBeGreaterThan(0);
  });

  it("throws error for invalid product", async () => {
    try {
      await calculateOrderPrice({
        productId: 99999,
        quantity: 1,
        printPlacements: [],
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("not found");
    }
  });

  it("handles multiple placements with different sizes", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 1,
      printPlacements: [
        { printSizeId: 1 },
        { printSizeId: 2 },
        { printSizeId: 3 },
      ],
    });

    expect(pricing.details.numPlacements).toBe(3);
    expect(pricing.placementCost).toBe(150); // 3 × R50
    expect(pricing.details.printSizeDetails.length).toBe(3);
  });

  it("calculates price correctly for large quantities", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 100,
      printPlacements: [{ printSizeId: 1 }],
    });

    expect(pricing.productSubtotal).toBe(pricing.basePrice * 100);
    expect(pricing.totalPrice).toBeGreaterThan(pricing.productSubtotal);
  });

  it("pricing breakdown includes all components", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 2,
      printPlacements: [
        { printSizeId: 1 },
        { printSizeId: 2 },
      ],
    });

    expect(pricing.basePrice).toBeGreaterThan(0);
    expect(pricing.productSubtotal).toBeGreaterThan(0);
    expect(pricing.placementCost).toBeGreaterThan(0);
    expect(pricing.totalPrice).toBeGreaterThan(0);
  });
});
