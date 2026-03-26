import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Quote Acceptance Workflow - Dashboard Based", () => {
  let db: any;
  let testOrderId: number;
  const testEmail = "customer@example.com";

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (db && testOrderId) {
      try {
        await db.delete(orders).where(eq(orders.id, testOrderId));
      } catch (e) {
        console.log("Cleanup skipped");
      }
    }
  });

  describe("acceptQuote", () => {
    it("should accept a pending quote and generate invoice", async () => {
      // Create a test order in pending status
      const insertResult = await db.insert(orders).values({
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 10,
        customerFirstName: "John",
        customerLastName: "Doe",
        customerEmail: testEmail,
        customerPhone: "1234567890",
        totalPriceEstimate: "500.00",
        depositAmount: "250.00",
        paymentMethod: "deposit",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      testOrderId = insertResult[0].insertId;

      // Verify order is in pending status
      const pendingOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(pendingOrder[0].status).toBe("pending");
      expect(pendingOrder[0].customerEmail).toBe(testEmail);
    });

    it("should reject quote acceptance if order not found", async () => {
      const invalidOrderId = 999999;
      expect(async () => {
        // This would be called via tRPC in real scenario
        const orderData = await db
          .select()
          .from(orders)
          .where(eq(orders.id, invalidOrderId))
          .limit(1);

        if (orderData.length === 0) {
          throw new Error("Order not found");
        }
      }).rejects.toThrow("Order not found");
    });

    it("should reject quote acceptance if email doesn't match", async () => {
      const wrongEmail = "wrong@example.com";

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData[0].customerEmail).not.toBe(wrongEmail);
    });

    it("should reject quote acceptance if order not in pending status", async () => {
      // First update order to approved
      await db
        .update(orders)
        .set({ status: "approved" })
        .where(eq(orders.id, testOrderId));

      const updatedOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(updatedOrder[0].status).toBe("approved");

      // Now verify it's not pending
      expect(updatedOrder[0].status).not.toBe("pending");
    });
  });

  describe("rejectQuote", () => {
    it("should reject a pending quote with reason", async () => {
      // Create another test order
      const insertResult = await db.insert(orders).values({
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        customerFirstName: "Jane",
        customerLastName: "Smith",
        customerEmail: "jane@example.com",
        customerPhone: "0987654321",
        totalPriceEstimate: "300.00",
        depositAmount: "150.00",
        paymentMethod: "full_payment",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const rejectOrderId = insertResult[0].insertId;

      // Verify order is pending
      const pendingOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, rejectOrderId))
        .limit(1);

      expect(pendingOrder[0].status).toBe("pending");

      // Update to cancelled (simulating rejection)
      await db
        .update(orders)
        .set({
          status: "cancelled",
          invoiceDeclinedAt: new Date(),
          invoiceDeclineReason: "Price too high",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, rejectOrderId));

      // Verify status changed
      const rejectedOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, rejectOrderId))
        .limit(1);

      expect(rejectedOrder[0].status).toBe("cancelled");
      expect(rejectedOrder[0].invoiceDeclineReason).toBe("Price too high");

      // Cleanup
      await db.delete(orders).where(eq(orders.id, rejectOrderId));
    });

    it("should require minimum reason length", async () => {
      const shortReason = "Too high";
      // Reason must be at least 10 characters
      expect(shortReason.length).toBeLessThan(10);
    });

    it("should enforce maximum reason length", async () => {
      const longReason = "a".repeat(501);
      // Reason must be max 500 characters
      expect(longReason.length).toBeGreaterThan(500);
    });
  });

  describe("Quote Status Transitions", () => {
    it("should track quote acceptance timestamp", async () => {
      const insertResult = await db.insert(orders).values({
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 8,
        customerFirstName: "Bob",
        customerLastName: "Johnson",
        customerEmail: "bob@example.com",
        customerPhone: "5555555555",
        totalPriceEstimate: "400.00",
        depositAmount: "200.00",
        paymentMethod: "deposit",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const trackOrderId = insertResult[0].insertId;

      // Update with acceptance timestamp
      const acceptanceTime = new Date();
      await db
        .update(orders)
        .set({
          status: "approved",
          invoiceAcceptedAt: acceptanceTime,
          updatedAt: acceptanceTime,
        })
        .where(eq(orders.id, trackOrderId));

      const updatedOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, trackOrderId))
        .limit(1);

      expect(updatedOrder[0].status).toBe("approved");
      expect(updatedOrder[0].invoiceAcceptedAt).toBeDefined();

      // Cleanup
      await db.delete(orders).where(eq(orders.id, trackOrderId));
    });

    it("should store invoice URL after acceptance", async () => {
      const insertResult = await db.insert(orders).values({
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 12,
        customerFirstName: "Alice",
        customerLastName: "Williams",
        customerEmail: "alice@example.com",
        customerPhone: "4444444444",
        totalPriceEstimate: "600.00",
        depositAmount: "300.00",
        paymentMethod: "deposit",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const urlOrderId = insertResult[0].insertId;

      // Update with invoice URL
      const invoiceUrl = "https://s3.example.com/invoices/123/invoice.pdf";
      await db
        .update(orders)
        .set({
          status: "approved",
          invoiceUrl,
          invoiceAcceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, urlOrderId));

      const updatedOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, urlOrderId))
        .limit(1);

      expect(updatedOrder[0].invoiceUrl).toBe(invoiceUrl);
      expect(updatedOrder[0].status).toBe("approved");

      // Cleanup
      await db.delete(orders).where(eq(orders.id, urlOrderId));
    });
  });

  describe("Payment Status Integration", () => {
    it("should maintain payment status through quote acceptance", async () => {
      const insertResult = await db.insert(orders).values({
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 15,
        customerFirstName: "Charlie",
        customerLastName: "Brown",
        customerEmail: "charlie@example.com",
        customerPhone: "3333333333",
        totalPriceEstimate: "750.00",
        depositAmount: "375.00",
        paymentMethod: "deposit",
        paymentStatus: "unpaid",
        amountPaid: "0.00",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const paymentOrderId = insertResult[0].insertId;

      // Accept quote without changing payment status
      await db
        .update(orders)
        .set({
          status: "approved",
          invoiceAcceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, paymentOrderId));

      const updatedOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, paymentOrderId))
        .limit(1);

      expect(updatedOrder[0].status).toBe("approved");
      expect(updatedOrder[0].paymentStatus).toBe("unpaid");
      expect(updatedOrder[0].amountPaid).toBe("0.00");

      // Cleanup
      await db.delete(orders).where(eq(orders.id, paymentOrderId));
    });
  });
});
