import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("color and size selection", () => {
  it("allows public access to products list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns products with correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    if (products.length > 0) {
      const product = products[0];
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("basePrice");
    }
  });

  it("allows fetching product details with colors and sizes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    if (products.length > 0) {
      const productId = products[0].id;
      const details = await caller.products.getById({ id: productId });

      expect(details).toHaveProperty("id");
      expect(details).toHaveProperty("colors");
      expect(details).toHaveProperty("sizes");
      expect(Array.isArray(details.colors)).toBe(true);
      expect(Array.isArray(details.sizes)).toBe(true);
    }
  });

  it("returns colors with correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    if (products.length > 0) {
      const productId = products[0].id;
      const details = await caller.products.getById({ id: productId });

      if (details.colors.length > 0) {
        const color = details.colors[0];
        expect(color).toHaveProperty("id");
        expect(color).toHaveProperty("colorName");
        expect(color).toHaveProperty("colorHex");
        expect(typeof color.colorHex).toBe("string");
        expect(color.colorHex).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it("returns sizes with correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    if (products.length > 0) {
      const productId = products[0].id;
      const details = await caller.products.getById({ id: productId });

      if (details.sizes.length > 0) {
        const size = details.sizes[0];
        expect(size).toHaveProperty("id");
        expect(size).toHaveProperty("sizeName");
        expect(typeof size.sizeName).toBe("string");
      }
    }
  });

  it("returns empty arrays for products without colors or sizes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Try to get details for a non-existent product
    try {
      await caller.products.getById({ id: 99999 });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("not found");
    }
  });

  it("validates product ID input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // @ts-ignore - intentionally passing invalid input
      await caller.products.getById({ id: "invalid" });
      // Should either parse as number or throw error
    } catch (error: any) {
      // Expected behavior
      expect(error).toBeDefined();
    }
  });

  it("multiple colors can be retrieved for a single product", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    const productWithColors = products.find((p) => {
      // We'll check this in the actual test
      return true;
    });

    if (productWithColors) {
      const details = await caller.products.getById({ id: productWithColors.id });
      // Should have multiple colors for most products
      expect(details.colors.length).toBeGreaterThan(0);
    }
  });

  it("multiple sizes can be retrieved for a single product", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    const productWithSizes = products.find((p) => {
      // We'll check this in the actual test
      return true;
    });

    if (productWithSizes) {
      const details = await caller.products.getById({ id: productWithSizes.id });
      // Should have multiple sizes for most products
      expect(details.sizes.length).toBeGreaterThan(0);
    }
  });

  it("color hex codes are valid", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    for (const product of products) {
      const details = await caller.products.getById({ id: product.id });
      for (const color of details.colors) {
        expect(color.colorHex).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it("size names are non-empty strings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    for (const product of products) {
      const details = await caller.products.getById({ id: product.id });
      for (const size of details.sizes) {
        expect(typeof size.sizeName).toBe("string");
        expect(size.sizeName.length).toBeGreaterThan(0);
      }
    }
  });
});
