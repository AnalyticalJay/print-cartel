import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    phone: "555-0000",
    companyName: undefined,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const regularUser: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    firstName: "Regular",
    lastName: "User",
    phone: "555-0001",
    companyName: undefined,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("admin router - access control", () => {
  it("allows admin to get all orders", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    // Should not throw
    const result = await caller.admin.getAllOrders();
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user from getting all orders", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    await expect(caller.admin.getAllOrders()).rejects.toThrow("Unauthorized");
  });

  it("allows admin to get order stats", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.getOrderStats();
    expect(result).toHaveProperty("totalOrders");
    expect(result).toHaveProperty("pendingOrders");
    expect(result).toHaveProperty("quotedOrders");
    expect(result).toHaveProperty("approvedOrders");
    expect(result).toHaveProperty("totalRevenue");
  });

  it("denies regular user from getting order stats", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    await expect(caller.admin.getOrderStats()).rejects.toThrow("Unauthorized");
  });

  it("allows admin to search orders", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.searchOrders({ query: "test" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user from searching orders", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    await expect(caller.admin.searchOrders({ query: "test" })).rejects.toThrow("Unauthorized");
  });

  it("allows admin to get orders by status", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.getOrdersByStatus({ status: "pending" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("denies regular user from getting orders by status", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    await expect(caller.admin.getOrdersByStatus({ status: "pending" })).rejects.toThrow("Unauthorized");
  });

  it("allows admin to update order status", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    // This will fail if order doesn't exist, but we're testing authorization
    try {
      await caller.admin.updateOrderStatus({ orderId: 999, status: "quoted" });
    } catch (error: any) {
      // Should not be an authorization error
      expect(error.message).not.toContain("Unauthorized");
    }
  });

  it("denies regular user from updating order status", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    await expect(caller.admin.updateOrderStatus({ orderId: 1, status: "quoted" })).rejects.toThrow("Unauthorized");
  });

  it("allows admin to update order pricing", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    // This will fail if order doesn't exist, but we're testing authorization
    try {
      await caller.admin.updateOrderPricing({ orderId: 999, totalPriceEstimate: 150 });
    } catch (error: any) {
      // Should not be an authorization error
      expect(error.message).not.toContain("Unauthorized");
    }
  });

  it("denies regular user from updating order pricing", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    await expect(caller.admin.updateOrderPricing({ orderId: 1, totalPriceEstimate: 150 })).rejects.toThrow("Unauthorized");
  });
});

describe("admin router - order statistics", () => {
  it("returns valid statistics structure", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const stats = await caller.admin.getOrderStats();

    expect(stats.totalOrders).toBeGreaterThanOrEqual(0);
    expect(stats.pendingOrders).toBeGreaterThanOrEqual(0);
    expect(stats.quotedOrders).toBeGreaterThanOrEqual(0);
    expect(stats.approvedOrders).toBeGreaterThanOrEqual(0);
    expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);

    // Ensure pending + quoted + approved <= total
    const categorized = stats.pendingOrders + stats.quotedOrders + stats.approvedOrders;
    expect(categorized).toBeLessThanOrEqual(stats.totalOrders);
  });
});

describe("admin router - search and filter", () => {
  it("accepts valid search queries", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.searchOrders({ query: "john" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters orders by pending status", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.getOrdersByStatus({ status: "pending" });
    expect(Array.isArray(result)).toBe(true);

    // All results should have pending status
    result.forEach((order) => {
      expect(order.status).toBe("pending");
    });
  });

  it("filters orders by quoted status", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.getOrdersByStatus({ status: "quoted" });
    expect(Array.isArray(result)).toBe(true);

    // All results should have quoted status
    result.forEach((order) => {
      expect(order.status).toBe("quoted");
    });
  });

  it("filters orders by approved status", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.getOrdersByStatus({ status: "approved" });
    expect(Array.isArray(result)).toBe(true);

    // All results should have approved status
    result.forEach((order) => {
      expect(order.status).toBe("approved");
    });
  });
});
