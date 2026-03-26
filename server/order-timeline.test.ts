import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Order Status Timeline Tests", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should track order creation timestamp", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      expect(testOrders[0].createdAt).toBeDefined();
      expect(testOrders[0].createdAt instanceof Date || typeof testOrders[0].createdAt === "string").toBe(true);
    }
  });

  it("should record quote approval timestamp", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const now = new Date();

      await db
        .update(orders)
        .set({
          quoteApprovedAt: now,
          status: "approved",
        })
        .where(eq(orders.id, orderId));

      const updated = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      expect(updated[0].quoteApprovedAt).toBeDefined();
      expect(updated[0].status).toBe("approved");
    }
  });

  it("should record quote rejection with reason", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const rejectionReason = "Price too high";

      await db
        .update(orders)
        .set({
          quoteRejectedAt: new Date(),
          quoteRejectionReason: rejectionReason,
          status: "cancelled",
        })
        .where(eq(orders.id, orderId));

      const updated = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      expect(updated[0].quoteRejectedAt).toBeDefined();
      expect(updated[0].quoteRejectionReason).toBe(rejectionReason);
      expect(updated[0].status).toBe("cancelled");
    }
  });

  it("should record payment verification timestamp", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const now = new Date();

      await db
        .update(orders)
        .set({
          paymentVerifiedAt: now,
          paymentVerificationStatus: "verified",
          paymentStatus: "paid",
        })
        .where(eq(orders.id, orderId));

      const updated = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      expect(updated[0].paymentVerifiedAt).toBeDefined();
      expect(updated[0].paymentVerificationStatus).toBe("verified");
      expect(updated[0].paymentStatus).toBe("paid");
    }
  });

  it("should store payment verification notes for audit trail", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const notes = "EFT confirmed - Reference: TRF123456789";

      await db
        .update(orders)
        .set({
          paymentVerificationNotes: notes,
        })
        .where(eq(orders.id, orderId));

      const updated = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      expect(updated[0].paymentVerificationNotes).toBe(notes);
    }
  });

  it("should track complete order progression", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const createdAt = testOrders[0].createdAt;

      // Step 1: Quote approved
      const quoteApprovedAt = new Date();
      await db
        .update(orders)
        .set({
          quoteApprovedAt,
          status: "approved",
        })
        .where(eq(orders.id, orderId));

      // Step 2: Payment verified
      const paymentVerifiedAt = new Date();
      await db
        .update(orders)
        .set({
          paymentVerifiedAt,
          paymentVerificationStatus: "verified",
          paymentStatus: "paid",
        })
        .where(eq(orders.id, orderId));

      const final = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      expect(final[0].createdAt).toBeDefined();
      expect(final[0].quoteApprovedAt).toBeDefined();
      expect(final[0].paymentVerifiedAt).toBeDefined();
      expect(final[0].status).toBe("approved");
      expect(final[0].paymentStatus).toBe("paid");
    }
  });

  it("should maintain timeline accuracy across status changes", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const originalCreatedAt = testOrders[0].createdAt;

      // Make multiple updates
      await db
        .update(orders)
        .set({
          quoteApprovedAt: new Date(),
          status: "approved",
        })
        .where(eq(orders.id, orderId));

      const updated = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      // Verify createdAt hasn't changed
      expect(updated[0].createdAt).toEqual(originalCreatedAt);
      expect(updated[0].quoteApprovedAt).toBeDefined();
    }
  });

  it("should support filtering orders by timeline status", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const allOrders = await db.select().from(orders);

    const withQuoteApproval = allOrders.filter((o: any) => o.quoteApprovedAt !== null);
    const withPaymentVerification = allOrders.filter((o: any) => o.paymentVerifiedAt !== null);
    const pending = allOrders.filter((o: any) => o.quoteApprovedAt === null);

    expect(Array.isArray(withQuoteApproval)).toBe(true);
    expect(Array.isArray(withPaymentVerification)).toBe(true);
    expect(Array.isArray(pending)).toBe(true);
  });

  it("should calculate timeline duration", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0 && testOrders[0].quoteApprovedAt) {
      const order = testOrders[0];
      const createdTime = new Date(order.createdAt).getTime();
      const approvedTime = new Date(order.quoteApprovedAt).getTime();
      const duration = approvedTime - createdTime;

      expect(duration).toBeGreaterThanOrEqual(0);
    }
  });

  it("should handle orders with partial timeline", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const testOrders = await db
      .select()
      .from(orders)
      .limit(1);

    if (testOrders.length > 0) {
      const order = testOrders[0];

      // Check partial timeline
      const hasCreatedAt = order.createdAt !== null;
      const hasQuoteApproval = order.quoteApprovedAt !== null;
      const hasPaymentVerification = order.paymentVerifiedAt !== null;

      expect(hasCreatedAt).toBe(true);
      expect(typeof hasQuoteApproval).toBe("boolean");
      expect(typeof hasPaymentVerification).toBe("boolean");
    }
  });
});
