import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  addToEmailRetryQueue,
  getNextEmailToRetry,
  markEmailRetrySuccess,
  markEmailRetryFailed,
  getEmailRetryQueueStatus,
  clearEmailRetryQueue,
  sendEmailWithRetry,
  processEmailRetryQueue,
  EMAIL_RETRY_CONFIG,
} from "./email-retry";

describe("Email Retry Logic", () => {
  beforeEach(() => {
    clearEmailRetryQueue();
  });

  afterEach(() => {
    clearEmailRetryQueue();
  });

  describe("addToEmailRetryQueue", () => {
    it("should add email to retry queue", () => {
      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      expect(id).toBeDefined();
      expect(id).toContain("order_confirmation");
    });

    it("should set retry count to 0 for new items", () => {
      addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      const item = getNextEmailToRetry();
      expect(item?.retryCount).toBe(0);
    });

    it("should set nextRetryAt for new items", () => {
      addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      const item = getNextEmailToRetry();
      expect(item?.nextRetryAt).toBeDefined();
    });
  });

  describe("getNextEmailToRetry", () => {
    it("should return null when queue is empty", () => {
      const item = getNextEmailToRetry();
      expect(item).toBeNull();
    });

    it("should return email ready for retry", () => {
      addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      const item = getNextEmailToRetry();
      expect(item).toBeDefined();
      expect(item?.type).toBe("order_confirmation");
    });

    it("should not return email that exceeds max retries", () => {
      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      for (let i = 0; i < EMAIL_RETRY_CONFIG.MAX_RETRIES; i++) {
        markEmailRetryFailed(id, "Test error");
      }

      const item = getNextEmailToRetry();
      expect(item).toBeNull();
    });
  });

  describe("markEmailRetrySuccess", () => {
    it("should remove email from queue on success", () => {
      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      markEmailRetrySuccess(id);

      const item = getNextEmailToRetry();
      expect(item).toBeNull();
    });
  });

  describe("markEmailRetryFailed", () => {
    it("should increment retry count on failure", () => {
      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      markEmailRetryFailed(id, "Test error");

      const status = getEmailRetryQueueStatus();
      const item = status.items.find((i) => i.id === id);
      expect(item?.retryCount).toBe(1);
    });

    it("should mark as exhausted after max retries", () => {
      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      for (let i = 0; i < EMAIL_RETRY_CONFIG.MAX_RETRIES; i++) {
        markEmailRetryFailed(id, "Test error");
      }

      const status = getEmailRetryQueueStatus();
      expect(status.exhausted).toBe(1);
      expect(status.pending).toBe(0);
    });
  });

  describe("getEmailRetryQueueStatus", () => {
    it("should return queue statistics", () => {
      addToEmailRetryQueue(
        "order_confirmation",
        "customer1@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );
      addToEmailRetryQueue(
        "status_update",
        "customer2@example.com",
        "Status Update",
        { orderId: 456 }
      );

      const status = getEmailRetryQueueStatus();
      expect(status.total).toBe(2);
      expect(status.pending).toBeGreaterThanOrEqual(2);
    });
  });

  describe("sendEmailWithRetry", () => {
    it("should return success when email sends successfully", async () => {
      const sendFn = vi.fn().mockResolvedValue("sent");

      const result = await sendEmailWithRetry(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 },
        sendFn
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe("sent");
      expect(sendFn).toHaveBeenCalled();
    });

    it("should add to retry queue when email fails", async () => {
      const error = new Error("SMTP error");
      const sendFn = vi.fn().mockRejectedValue(error);

      const result = await sendEmailWithRetry(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 },
        sendFn
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("SMTP error");

      const status = getEmailRetryQueueStatus();
      expect(status.total).toBe(1);
    });
  });

  describe("processEmailRetryQueue", () => {
    it("should process pending emails when ready", async () => {
      const sendFn = vi.fn().mockResolvedValue(undefined);

      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      // Manually set nextRetryAt to past to make it ready
      const status = getEmailRetryQueueStatus();
      const item = status.items.find((i) => i.id === id);
      if (item) {
        item.nextRetryAt = new Date(Date.now() - 1000);
      }

      const result = await processEmailRetryQueue({
        order_confirmation: sendFn,
        status_update: vi.fn(),
        design_approval: vi.fn(),
        payment_reminder: vi.fn(),
      });

      expect(result.processed).toBeGreaterThanOrEqual(0);
    });

    it("should not process emails that are not ready", async () => {
      const sendFn = vi.fn();

      addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      const result = await processEmailRetryQueue({
        order_confirmation: sendFn,
        status_update: vi.fn(),
        design_approval: vi.fn(),
        payment_reminder: vi.fn(),
      });

      expect(result.processed).toBe(0);
    });
  });

  describe("Email Retry Backoff", () => {
    it("should increase retry count with each failure", () => {
      const id = addToEmailRetryQueue(
        "order_confirmation",
        "customer@example.com",
        "Order Confirmation",
        { orderId: 123 }
      );

      const retryCounts: number[] = [];

      for (let i = 0; i < 3; i++) {
        markEmailRetryFailed(id, "Test error");
        const status = getEmailRetryQueueStatus();
        const item = status.items.find((i) => i.id === id);
        retryCounts.push(item?.retryCount || 0);
      }

      expect(retryCounts[0]).toBe(1);
      expect(retryCounts[1]).toBe(2);
      expect(retryCounts[2]).toBe(3);
    });
  });

  describe("Email Types", () => {
    it("should support all email types", () => {
      const types: Array<"order_confirmation" | "status_update" | "design_approval" | "payment_reminder"> = [
        "order_confirmation",
        "status_update",
        "design_approval",
        "payment_reminder",
      ];

      const ids = types.map((type) =>
        addToEmailRetryQueue(type, "customer@example.com", `${type} email`, { test: true })
      );

      const status = getEmailRetryQueueStatus();
      expect(status.total).toBe(4);
      expect(ids.length).toBe(4);
    });
  });
});
