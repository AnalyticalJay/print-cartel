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
    expect(pricing.bulkDiscountPercentage).toBe(0); // No bulk discount for 2 units
    expect(pricing.totalPrice).toBe(pricing.productSubtotal);
  });

  it("does not include placement costs in total price", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 1,
      printPlacements: [
        { printSizeId: 1 },
        { printSizeId: 2 },
      ],
    });

    expect(pricing.placementCost).toBe(0); // Placement costs no longer charged
    expect(pricing.totalPrice).toBeGreaterThanOrEqual(pricing.productSubtotal);
  });

  it("includes print size costs in total price", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 1,
      printPlacements: [{ printSizeId: 1 }],
    });

    expect(pricing.printSizeCosts).toBeGreaterThanOrEqual(0);
    expect(pricing.totalPrice).toBeGreaterThanOrEqual(pricing.productSubtotal);
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

  it("applies bulk discount for 10+ units", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 10,
      printPlacements: [],
    });

    expect(pricing.bulkDiscountPercentage).toBe(10);
    expect(pricing.bulkDiscount).toBeGreaterThan(0);
    expect(pricing.totalPrice).toBeLessThan(pricing.productSubtotal);
  });

  it("applies bulk discount for 50+ units", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 50,
      printPlacements: [],
    });

    expect(pricing.bulkDiscountPercentage).toBe(20);
    expect(pricing.bulkDiscount).toBeGreaterThan(0);
    expect(pricing.totalPrice).toBeLessThan(pricing.productSubtotal);
  });

  it("applies bulk discount for 100+ units", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 100,
      printPlacements: [],
    });

    expect(pricing.bulkDiscountPercentage).toBe(30);
    expect(pricing.bulkDiscount).toBeGreaterThan(0);
    expect(pricing.totalPrice).toBeLessThan(pricing.productSubtotal);
  });

  it("throws error for invalid product", async () => {
    try {
      await calculateOrderPrice({
        productId: 99999,
        quantity: 1,
        printPlacements: [],
      });
      expect.fail("Should have thrown error");
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
    expect(pricing.placementCost).toBe(0); // Placement costs no longer charged
    expect(pricing.details.printSizeDetails.length).toBe(3);
  });

  it("applies bulk discount for large quantities", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 100,
      printPlacements: [{ printSizeId: 1 }],
    });

    expect(pricing.bulkDiscountPercentage).toBe(30);
    expect(pricing.bulkDiscount).toBeGreaterThan(0);
    // Total price should be less than subtotal + placement + print size costs due to discount
    const subtotalBeforeDiscount = pricing.productSubtotal + pricing.placementCost + pricing.printSizeCosts;
    expect(pricing.totalPrice).toBeLessThan(subtotalBeforeDiscount);
  });

  it("pricing breakdown includes all components", async () => {
    const pricing = await calculateOrderPrice({
      productId: 1,
      quantity: 5,
      printPlacements: [{ printSizeId: 1 }],
    });

    expect(pricing.basePrice).toBeGreaterThan(0);
    expect(pricing.productSubtotal).toBeGreaterThan(0);
    expect(pricing.placementCost).toBe(0); // Placement costs no longer charged
    expect(pricing.totalPrice).toBeGreaterThan(0);
  });

  it("calculates placement price correctly", async () => {
    const price = await calculatePlacementPrice(1);
    expect(price).toBeGreaterThanOrEqual(0);
  });

  it("retrieves print options", async () => {
    const options = await getPrintOptions();
    expect(Array.isArray(options)).toBe(true);
  });

  it("gets product price", async () => {
    const price = await getProductPrice(1);
    expect(price).toBeGreaterThan(0);
  });
});
