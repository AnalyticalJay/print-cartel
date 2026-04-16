import { describe, it, expect, beforeEach, vi } from "vitest";
import { generatePayFastSignature, verifyPayFastSignature, extractOrderIdFromPayment, isPaymentSuccessful } from "./payfast-service";

describe("PayFast Callback Tests", () => {
  const testPassphrase = "test_passphrase";
  const testMerchantId = "10000100";

  describe("Signature Generation and Verification", () => {
    it("should generate consistent signatures", () => {
      const data = {
        m_payment_id: "order_123",
        pf_payment_id: "1234567890",
        payment_status: "COMPLETE",
        amount_gross: "99.99",
      };

      const sig1 = generatePayFastSignature(data, testPassphrase);
      const sig2 = generatePayFastSignature(data, testPassphrase);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{32}$/); // MD5 hash format
    });

    it("should verify valid signatures", () => {
      const data = {
        m_payment_id: "order_456",
        pf_payment_id: "9876543210",
        payment_status: "COMPLETE",
        amount_gross: "150.00",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, testPassphrase);

      expect(isValid).toBe(true);
    });

    it("should reject invalid signatures", () => {
      const data = {
        m_payment_id: "order_789",
        pf_payment_id: "1111111111",
        payment_status: "COMPLETE",
        amount_gross: "200.00",
      };

      const invalidSignature = "invalid_signature_hash";
      const isValid = verifyPayFastSignature(data, invalidSignature, testPassphrase);

      expect(isValid).toBe(false);
    });

    it("should reject signatures with wrong passphrase", () => {
      const data = {
        m_payment_id: "order_999",
        pf_payment_id: "5555555555",
        payment_status: "COMPLETE",
        amount_gross: "75.50",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, "wrong_passphrase");

      expect(isValid).toBe(false);
    });

    it("should reject signatures with modified data", () => {
      const data = {
        m_payment_id: "order_111",
        pf_payment_id: "2222222222",
        payment_status: "COMPLETE",
        amount_gross: "99.99",
      };

      const signature = generatePayFastSignature(data, testPassphrase);

      // Modify the data
      const modifiedData = {
        ...data,
        amount_gross: "199.99", // Changed amount
      };

      const isValid = verifyPayFastSignature(modifiedData, signature, testPassphrase);
      expect(isValid).toBe(false);
    });
  });

  describe("Order ID Extraction", () => {
    it("should extract order ID from valid payment ID", () => {
      const paymentId = "order_12345";
      const orderId = extractOrderIdFromPayment(paymentId);

      expect(orderId).toBe(12345);
    });

    it("should extract large order IDs", () => {
      const paymentId = "order_999999999";
      const orderId = extractOrderIdFromPayment(paymentId);

      expect(orderId).toBe(999999999);
    });

    it("should return null for invalid payment ID format", () => {
      const invalidIds = [
        "invalid_format",
        "order_abc",
        "12345",
        "order_",
        "",
      ];

      invalidIds.forEach((id) => {
        const orderId = extractOrderIdFromPayment(id);
        expect(orderId).toBeNull();
      });
    });
  });

  describe("Payment Status Checks", () => {
    it("should identify successful payments", () => {
      expect(isPaymentSuccessful("COMPLETE")).toBe(true);
    });

    it("should reject incomplete payments", () => {
      const incompleteStatuses = [
        "PENDING",
        "FAILED",
        "CANCELLED",
        "EXPIRED",
        "UNKNOWN",
        "",
      ];

      incompleteStatuses.forEach((status) => {
        expect(isPaymentSuccessful(status)).toBe(false);
      });
    });

    it("should be case-sensitive for status", () => {
      expect(isPaymentSuccessful("complete")).toBe(false);
      expect(isPaymentSuccessful("Complete")).toBe(false);
    });
  });

  describe("Signature Edge Cases", () => {
    it("should handle empty values in signature", () => {
      const data = {
        m_payment_id: "order_123",
        pf_payment_id: "",
        payment_status: "COMPLETE",
        amount_gross: "99.99",
        custom_str1: "",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, testPassphrase);

      expect(isValid).toBe(true);
    });

    it("should handle special characters in data", () => {
      const data = {
        m_payment_id: "order_123",
        pf_payment_id: "123-456-789",
        payment_status: "COMPLETE",
        amount_gross: "99.99",
        item_name: "Test Item & More",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, testPassphrase);

      expect(isValid).toBe(true);
    });

    it("should handle numeric values correctly", () => {
      const data = {
        m_payment_id: "order_123",
        pf_payment_id: "1234567890",
        payment_status: "COMPLETE",
        amount_gross: "0.01", // Minimum amount
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, testPassphrase);

      expect(isValid).toBe(true);
    });

    it("should handle large amounts", () => {
      const data = {
        m_payment_id: "order_999",
        pf_payment_id: "9999999999",
        payment_status: "COMPLETE",
        amount_gross: "999999.99", // Large amount
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, testPassphrase);

      expect(isValid).toBe(true);
    });
  });

  describe("Multiple Payment Processing", () => {
    it("should handle multiple different payments", () => {
      const payments = [
        { orderId: 1, amount: "50.00" },
        { orderId: 2, amount: "100.00" },
        { orderId: 3, amount: "75.50" },
      ];

      payments.forEach((payment) => {
        const data = {
          m_payment_id: `order_${payment.orderId}`,
          pf_payment_id: `${payment.orderId}${payment.orderId}${payment.orderId}`,
          payment_status: "COMPLETE",
          amount_gross: payment.amount,
        };

        const signature = generatePayFastSignature(data, testPassphrase);
        const isValid = verifyPayFastSignature(data, signature, testPassphrase);

        expect(isValid).toBe(true);
        expect(extractOrderIdFromPayment(data.m_payment_id)).toBe(payment.orderId);
      });
    });
  });
});
