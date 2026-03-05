import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { products, productColors, productSizes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Products Router - Colors and Sizes", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should have product colors in database", async () => {
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const colors = await db.select().from(productColors).limit(10);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors[0]).toHaveProperty("id");
    expect(colors[0]).toHaveProperty("productId");
    expect(colors[0]).toHaveProperty("colorName");
    expect(colors[0]).toHaveProperty("colorHex");
  });

  it("should have product sizes in database", async () => {
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const sizes = await db.select().from(productSizes).limit(10);
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes[0]).toHaveProperty("id");
    expect(sizes[0]).toHaveProperty("productId");
    expect(sizes[0]).toHaveProperty("sizeName");
  });

  it("should return colors for a specific product", async () => {
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Get a product first
    const allProducts = await db.select().from(products).limit(1);
    if (allProducts.length === 0) {
      console.warn("No products in database");
      return;
    }

    const productId = allProducts[0].id;
    const colors = await db
      .select()
      .from(productColors)
      .where(eq(productColors.productId, productId));

    // Should have colors for this product
    expect(colors.length).toBeGreaterThan(0);
    colors.forEach((color: any) => {
      expect(color.productId).toBe(productId);
    });
  });

  it("should return sizes for a specific product", async () => {
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Get a product first
    const allProducts = await db.select().from(products).limit(1);
    if (allProducts.length === 0) {
      console.warn("No products in database");
      return;
    }

    const productId = allProducts[0].id;
    const sizes = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, productId));

    // Should have sizes for this product
    expect(sizes.length).toBeGreaterThan(0);
    sizes.forEach((size: any) => {
      expect(size.productId).toBe(productId);
    });
  });
});
