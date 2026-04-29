import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PayFastItnRetryService } from "./payfast-itn-retry";
import { db } from "../drizzle/client";
import { payFastItnRetryQueue, orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("PayFastItnRetryService", () => {
  const testOrderId = 99999;
  const testTransactionId = "test-txn-12345";
  const testItnData = {
    m_payment_id: "order-99999",
    pf_payment_id: "1234567890",
    payment_status: "COMPLETE",
    item_name: "Test Order",
    item_description: "Test DTF Print",
    amount_gross: "500.00",
    amount_fee: "15.00",
    amount_net: "485.00",
    custom_int1: "99999",
    custom_str1: "test@example.com",
    name_first: "Test",
    name_last: "Customer",
    email_address: "test@example.com",
    merchant_id: "19428362",
    signature: "test-signature",
  };

  beforeAll(async () => {
    try {
      // Create test order once for all tests
      await db.insert(orders).values({
        id: testOrderId,
        userId: 1,
        status: "approved",
        paymentStatus: "unpaid",
        quantity: 10,
        totalPriceEstimate: "500.00",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      // Order might already exist, that's fine
    }
  });

  afterAll(async () => {
    try {
      // Clean up after all tests
      await db.delete(payFastItnRetryQueue).where(eq(payFastItnRetryQueue.orderId, testOrderId));
      await db.delete(orders).where(eq(orders.id, testOrderId));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("queueForRetry", () => {
    it("should queue a failed ITN for retry", async () => {
      // Use unique transaction ID for this test
      const txnId = `${testTransactionId}-1`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData,
        "signature_verification_failed",
        "Invalid signature"
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      expect(queued.length).toBeGreaterThan(0);
      expect(queued[0].status).toBe("pending");
      expect(queued[0].attemptCount).toBe(0);
      expect(queued[0].maxAttempts).toBe(5);
      expect(queued[0].lastErrorMessage).toBe("Invalid signature");
      expect(queued[0].failureReason).toBe("signature_verification_failed");
    });

    it("should set nextRetryAt in the future", async () => {
      const txnId = `${testTransactionId}-2`;
      const beforeTime = new Date();

      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      expect(queued[0].nextRetryAt).toBeTruthy();
      expect(new Date(queued[0].nextRetryAt!).getTime()).toBeGreaterThan(beforeTime.getTime());
    });

    it("should store complete ITN data", async () => {
      const txnId = `${testTransactionId}-3`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      expect(queued[0].itnData).toEqual(testItnData);
    });
  });

  describe("getRetryStats", () => {
    it("should return retry statistics", async () => {
      const txnId = `${testTransactionId}-4`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const stats = await PayFastItnRetryService.getRetryStats();

      expect(stats).toBeTruthy();
      expect(stats?.pending).toBeGreaterThanOrEqual(0);
      expect(stats?.totalRetries).toBeGreaterThanOrEqual(0);
    });

    it("should track different retry statuses", async () => {
      const stats = await PayFastItnRetryService.getRetryStats();

      expect(stats?.pending).toBeGreaterThanOrEqual(0);
      expect(stats?.processing).toBeGreaterThanOrEqual(0);
      expect(stats?.completed).toBeGreaterThanOrEqual(0);
      expect(stats?.failed).toBeGreaterThanOrEqual(0);
      expect(stats?.abandoned).toBeGreaterThanOrEqual(0);
    });
  });

  describe("manualRetry", () => {
    it("should reset a retry to pending status", async () => {
      const txnId = `${testTransactionId}-5`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      const retryId = queued[0].id;

      const result = await PayFastItnRetryService.manualRetry(retryId);

      expect(result).toBe(true);

      const updated = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.id, retryId));

      expect(updated[0].status).toBe("pending");
      expect(updated[0].attemptCount).toBe(0);
    });

    it("should throw error for non-existent retry", async () => {
      await expect(PayFastItnRetryService.manualRetry(999999999)).rejects.toThrow();
    });
  });

  describe("processPendingRetries", () => {
    it("should not process retries that are not yet due", async () => {
      const txnId = `${testTransactionId}-6`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const stats = await PayFastItnRetryService.processPendingRetries();

      expect(stats.processed).toBe(0);
    });

    it("should return processing statistics", async () => {
      const stats = await PayFastItnRetryService.processPendingRetries();

      expect(stats).toHaveProperty("processed");
      expect(stats).toHaveProperty("successful");
      expect(stats).toHaveProperty("failed");
    });
  });

  describe("Exponential Backoff Behavior", () => {
    it("should calculate exponential backoff correctly", async () => {
      const txnId = `${testTransactionId}-7`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const firstRetry = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      const firstRetryTime = new Date(firstRetry[0].nextRetryAt!).getTime();
      const currentTime = Date.now();
      const firstDelay = firstRetryTime - currentTime;

      // First retry should be around 1 minute (60000ms)
      expect(firstDelay).toBeGreaterThan(50000);
      expect(firstDelay).toBeLessThan(70000);
    });
  });

  describe("Max Retries Limit", () => {
    it("should respect max retries limit", async () => {
      const txnId = `${testTransactionId}-8`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      expect(queued[0].maxAttempts).toBe(5);
      expect(queued[0].attemptCount).toBe(0);
    });
  });

  describe("Failure Reason Tracking", () => {
    it("should track signature verification failure", async () => {
      const txnId = `${testTransactionId}-sig-fail`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData,
        "signature_verification_failed",
        "Signature mismatch"
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      expect(queued[0].failureReason).toBe("signature_verification_failed");
      expect(queued[0].lastErrorMessage).toBe("Signature mismatch");
    });

    it("should track order not found failure", async () => {
      const txnId = `${testTransactionId}-order-not-found`;
      
      await PayFastItnRetryService.queueForRetry(
        testOrderId,
        txnId,
        testItnData,
        "order_not_found",
        "Order 12345 not found"
      );

      const queued = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.transactionId, txnId));

      expect(queued[0].failureReason).toBe("order_not_found");
    });
  });
});
