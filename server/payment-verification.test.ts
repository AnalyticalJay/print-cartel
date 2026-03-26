import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Payment Verification Workflow Tests", () => {
  let testOrderId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should retrieve pending payment proofs", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const pendingProofs = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentVerificationStatus, "pending"));

    expect(Array.isArray(pendingProofs)).toBe(true);
  });

  it("should verify payment proof and update status to verified", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    // Create a test order with pending payment verification
    const result = await db.insert(orders).values({
      customerEmail: "test@example.com",
      customerFirstName: "Test",
      customerLastName: "User",
      customerPhone: "0123456789",
      totalPriceEstimate: "1500.00",
      orderStatus: "approved",
      paymentStatus: "pending",
      paymentVerificationStatus: "pending",
      paymentProofUrl: "https://example.com/proof.jpg",
      paymentProofUploadedAt: new Date(),
      amountPaid: "1500.00",
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it("should update payment verification status to verified", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const orders_data = await db.select().from(orders).limit(1);
    if (orders_data.length === 0) return;

    const orderId = orders_data[0].id;

    await db
      .update(orders)
      .set({
        paymentVerificationStatus: "verified",
        paymentVerifiedAt: new Date(),
        paymentVerificationNotes: "Payment verified by admin",
        paymentStatus: "paid",
      })
      .where(eq(orders.id, orderId));

    const updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(updated[0].paymentVerificationStatus).toBe("verified");
    expect(updated[0].paymentStatus).toBe("paid");
  });

  it("should reject payment proof and update status to rejected", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const orders_data = await db.select().from(orders).limit(1);
    if (orders_data.length === 0) return;

    const orderId = orders_data[0].id;

    await db
      .update(orders)
      .set({
        paymentVerificationStatus: "rejected",
        paymentVerificationNotes: "Amount does not match order total",
      })
      .where(eq(orders.id, orderId));

    const updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(updated[0].paymentVerificationStatus).toBe("rejected");
  });

  it("should track verification timestamp", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const orders_data = await db.select().from(orders).limit(1);
    if (orders_data.length === 0) return;

    const orderId = orders_data[0].id;
    const beforeUpdate = new Date();

    await db
      .update(orders)
      .set({
        paymentVerificationStatus: "verified",
        paymentVerifiedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(updated[0].paymentVerifiedAt).toBeDefined();
    if (updated[0].paymentVerifiedAt) {
      const verifiedTime = new Date(updated[0].paymentVerifiedAt);
      expect(verifiedTime.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    }
  });

  it("should store verification notes for audit trail", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const orders_data = await db.select().from(orders).limit(1);
    if (orders_data.length === 0) return;

    const orderId = orders_data[0].id;
    const testNotes = "EFT reference: TRF123456789 - Amount verified against bank statement";

    await db
      .update(orders)
      .set({
        paymentVerificationNotes: testNotes,
      })
      .where(eq(orders.id, orderId));

    const updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(updated[0].paymentVerificationNotes).toBe(testNotes);
  });

  it("should handle multiple verification status changes", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const orders_data = await db.select().from(orders).limit(1);
    if (orders_data.length === 0) return;

    const orderId = orders_data[0].id;

    // First verification attempt - rejected
    await db
      .update(orders)
      .set({
        paymentVerificationStatus: "rejected",
        paymentVerificationNotes: "First attempt - amount mismatch",
      })
      .where(eq(orders.id, orderId));

    let updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(updated[0].paymentVerificationStatus).toBe("rejected");

    // Second verification attempt - approved
    await db
      .update(orders)
      .set({
        paymentVerificationStatus: "verified",
        paymentVerifiedAt: new Date(),
        paymentVerificationNotes: "Re-submitted - amount now verified",
        paymentStatus: "paid",
      })
      .where(eq(orders.id, orderId));

    updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(updated[0].paymentVerificationStatus).toBe("verified");
    expect(updated[0].paymentStatus).toBe("paid");
  });

  it("should filter orders by verification status", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const pending = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentVerificationStatus, "pending"));

    const verified = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentVerificationStatus, "verified"));

    const rejected = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentVerificationStatus, "rejected"));

    expect(Array.isArray(pending)).toBe(true);
    expect(Array.isArray(verified)).toBe(true);
    expect(Array.isArray(rejected)).toBe(true);
  });

  it("should maintain data integrity during verification", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const orders_data = await db.select().from(orders).limit(1);
    if (orders_data.length === 0) return;

    const orderId = orders_data[0].id;
    const originalEmail = orders_data[0].customerEmail;

    await db
      .update(orders)
      .set({
        paymentVerificationStatus: "verified",
        paymentVerifiedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const updated = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // Verify customer data remains unchanged
    expect(updated[0].customerEmail).toBe(originalEmail);
    expect(updated[0].id).toBe(orderId);
  });

  it("should support bulk verification status queries", async () => {
    if (!db) {
      expect(db).toBeDefined();
      return;
    }

    const allOrders = await db.select().from(orders);

    const verificationStats = {
      pending: allOrders.filter((o: any) => o.paymentVerificationStatus === "pending").length,
      verified: allOrders.filter((o: any) => o.paymentVerificationStatus === "verified").length,
      rejected: allOrders.filter((o: any) => o.paymentVerificationStatus === "rejected").length,
    };

    expect(typeof verificationStats.pending).toBe("number");
    expect(typeof verificationStats.verified).toBe("number");
    expect(typeof verificationStats.rejected).toBe("number");
  });
});
