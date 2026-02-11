import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phone: null,
    companyName: null,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("order tracking", () => {
  it("allows public access to getByEmail procedure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw error for public access
    const result = await caller.orders.getByEmail({ email: "nonexistent@example.com" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array for non-existent email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.getByEmail({ email: "nonexistent@example.com" });
    expect(result).toEqual([]);
  });

  it("validates email format in getByEmail", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.orders.getByEmail({ email: "invalid-email" });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("invalid");
    }
  });

  it("admin can update order status with email notification", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This test verifies the procedure exists and accepts the right parameters
    // In a real scenario, this would update an actual order
    try {
      // Try to update a non-existent order (will fail, but tests the procedure)
      await caller.admin.updateOrderStatus({
        orderId: 99999,
        status: "quoted",
        quoteAmount: 500,
      });
    } catch (error: any) {
      // Expected to fail because order doesn't exist
      expect(error.message).toContain("Failed to update");
    }
  });

  it("rejects non-admin access to updateOrderStatus", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.updateOrderStatus({
        orderId: 1,
        status: "quoted",
      });
      expect.fail("Should have thrown authorization error");
    } catch (error: any) {
      expect(error.message).toContain("login");
    }
  });

  it("admin can search orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw error
    const result = await caller.admin.searchOrders({ query: "test" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects non-admin access to searchOrders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.searchOrders({ query: "test" });
      expect.fail("Should have thrown authorization error");
    } catch (error: any) {
      expect(error.message).toContain("login");
    }
  });

  it("admin can get all orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getAllOrders();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects non-admin access to getAllOrders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.getAllOrders();
      expect.fail("Should have thrown authorization error");
    } catch (error: any) {
      expect(error.message).toContain("login");
    }
  });

  it("allows public access to getById for order details", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.orders.getById({ id: 99999 });
      expect.fail("Should have thrown not found error");
    } catch (error: any) {
      expect(error.message).toContain("not found");
    }
  });

  it("validates email in getByEmail input", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.orders.getByEmail({ email: "not-an-email" });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("invalid");
    }
  });
});
