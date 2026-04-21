import { describe, it, expect } from "vitest";
import {
  generatePayFastSignature,
  buildPayFastPaymentUrl,
  verifyPayFastSignature,
  extractOrderIdFromPayment,
  isPaymentSuccessful,
} from "./payfast-service";

describe("PayFast Service", () => {
  const testPassphrase = "-,Redemption_2026";
  const testMerchantId = "19428362";
  const testMerchantKey = "x9mjrsxlwirog";

  describe("generatePayFastSignature", () => {
    it("should generate consistent MD5 signatures", () => {
      const data = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
      };

      const sig1 = generatePayFastSignature(data, testPassphrase);
      const sig2 = generatePayFastSignature(data, testPassphrase);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{32}$/); // Valid MD5 hash
    });

    it("should handle special characters in passphrase correctly", () => {
      const data = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "500.00",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      expect(signature).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should generate different signatures for different data", () => {
      const data1 = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
      };

      const data2 = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "200.00",
      };

      const sig1 = generatePayFastSignature(data1, testPassphrase);
      const sig2 = generatePayFastSignature(data2, testPassphrase);

      expect(sig1).not.toBe(sig2);
    });

    it("should sort keys alphabetically before generating signature", () => {
      const data1 = {
        z_field: "value",
        a_field: "value",
        m_field: "value",
      };

      const data2 = {
        a_field: "value",
        m_field: "value",
        z_field: "value",
      };

      const sig1 = generatePayFastSignature(data1, testPassphrase);
      const sig2 = generatePayFastSignature(data2, testPassphrase);

      expect(sig1).toBe(sig2);
    });

    it("should skip empty, null, and undefined values", () => {
      const dataWithEmpty = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
        empty_field: "",
        null_field: null as any,
        undefined_field: undefined as any,
      };

      const dataWithoutEmpty = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
      };

      const sig1 = generatePayFastSignature(dataWithEmpty, testPassphrase);
      const sig2 = generatePayFastSignature(dataWithoutEmpty, testPassphrase);

      expect(sig1).toBe(sig2);
    });
  });

  describe("buildPayFastPaymentUrl", () => {
    it("should build valid payment URL for production", () => {
      const config = {
        merchantId: testMerchantId,
        merchantKey: testMerchantKey,
        passphrase: testPassphrase,
        sandbox: false,
      };

      const paymentData = {
        orderId: 12345,
        amount: 100.0,
        customerEmail: "test@example.com",
        customerName: "John Doe",
        description: "Test Order",
        returnUrl: "https://example.com/return",
        cancelUrl: "https://example.com/cancel",
        notifyUrl: "https://example.com/notify",
      };

      const url = buildPayFastPaymentUrl(config, paymentData);

      expect(url).toContain("https://www.payfast.co.za/eng/process?");
      expect(url).toContain(`merchant_id=${testMerchantId}`);
      expect(url).toContain(`merchant_key=${testMerchantKey}`);
      expect(url).toContain("signature=");
      expect(url).toContain("order_12345");
    });

    it("should build valid payment URL for sandbox", () => {
      const config = {
        merchantId: testMerchantId,
        merchantKey: testMerchantKey,
        passphrase: testPassphrase,
        sandbox: true,
      };

      const paymentData = {
        orderId: 12345,
        amount: 100.0,
        customerEmail: "test@example.com",
        customerName: "John Doe",
        description: "Test Order",
        returnUrl: "https://example.com/return",
        cancelUrl: "https://example.com/cancel",
        notifyUrl: "https://example.com/notify",
      };

      const url = buildPayFastPaymentUrl(config, paymentData);

      expect(url).toContain("https://sandbox.payfast.co.za/eng/process?");
    });

    it("should handle customer names with multiple parts", () => {
      const config = {
        merchantId: testMerchantId,
        merchantKey: testMerchantKey,
        passphrase: testPassphrase,
        sandbox: true,
      };

      const paymentData = {
        orderId: 12345,
        amount: 100.0,
        customerEmail: "test@example.com",
        customerName: "John Michael Doe",
        description: "Test Order",
        returnUrl: "https://example.com/return",
        cancelUrl: "https://example.com/cancel",
        notifyUrl: "https://example.com/notify",
      };

      const url = buildPayFastPaymentUrl(config, paymentData);

      expect(url).toContain("name_first=John");
      expect(url).toContain("name_last=Michael%20Doe");
    });

    it("should format amount with 2 decimal places", () => {
      const config = {
        merchantId: testMerchantId,
        merchantKey: testMerchantKey,
        passphrase: testPassphrase,
        sandbox: true,
      };

      const paymentData = {
        orderId: 12345,
        amount: 100,
        customerEmail: "test@example.com",
        customerName: "John Doe",
        description: "Test Order",
        returnUrl: "https://example.com/return",
        cancelUrl: "https://example.com/cancel",
        notifyUrl: "https://example.com/notify",
      };

      const url = buildPayFastPaymentUrl(config, paymentData);

      expect(url).toContain("amount=100.00");
    });
  });

  describe("verifyPayFastSignature", () => {
    it("should verify valid signatures", () => {
      const data = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, testPassphrase);

      expect(isValid).toBe(true);
    });

    it("should reject invalid signatures", () => {
      const data = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
      };

      const invalidSignature = "0000000000000000000000000000000";
      const isValid = verifyPayFastSignature(data, invalidSignature, testPassphrase);

      expect(isValid).toBe(false);
    });

    it("should reject signatures with wrong passphrase", () => {
      const data = {
        merchant_id: testMerchantId,
        merchant_key: testMerchantKey,
        amount: "100.00",
      };

      const signature = generatePayFastSignature(data, testPassphrase);
      const isValid = verifyPayFastSignature(data, signature, "wrong-passphrase");

      expect(isValid).toBe(false);
    });
  });

  describe("extractOrderIdFromPayment", () => {
    it("should extract order ID from valid payment ID", () => {
      const paymentId = "order_12345";
      const orderId = extractOrderIdFromPayment(paymentId);

      expect(orderId).toBe(12345);
    });

    it("should return null for invalid payment ID format", () => {
      const paymentId = "invalid_format";
      const orderId = extractOrderIdFromPayment(paymentId);

      expect(orderId).toBeNull();
    });

    it("should handle large order IDs", () => {
      const paymentId = "order_999999999";
      const orderId = extractOrderIdFromPayment(paymentId);

      expect(orderId).toBe(999999999);
    });
  });

  describe("isPaymentSuccessful", () => {
    it("should return true for COMPLETE status", () => {
      const result = isPaymentSuccessful("COMPLETE");
      expect(result).toBe(true);
    });

    it("should return false for other statuses", () => {
      expect(isPaymentSuccessful("PENDING")).toBe(false);
      expect(isPaymentSuccessful("FAILED")).toBe(false);
      expect(isPaymentSuccessful("CANCELLED")).toBe(false);
      expect(isPaymentSuccessful("")).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    it("should generate and verify signature in complete flow", () => {
      const config = {
        merchantId: testMerchantId,
        merchantKey: testMerchantKey,
        passphrase: testPassphrase,
        sandbox: true,
      };

      const paymentData = {
        orderId: 12345,
        amount: 100.0,
        customerEmail: "test@example.com",
        customerName: "John Doe",
        description: "Test Order",
        returnUrl: "https://example.com/return",
        cancelUrl: "https://example.com/cancel",
        notifyUrl: "https://example.com/notify",
      };

      // Build payment URL
      const url = buildPayFastPaymentUrl(config, paymentData);

      // Extract signature from URL
      const signatureMatch = url.match(/signature=([a-f0-9]{32})/);
      expect(signatureMatch).toBeTruthy();

      if (signatureMatch) {
        const signature = signatureMatch[1];

        // Verify signature with all fields used in generation
        const signatureData = {
          merchant_id: config.merchantId,
          merchant_key: config.merchantKey,
          return_url: paymentData.returnUrl,
          cancel_url: paymentData.cancelUrl,
          notify_url: paymentData.notifyUrl,
          name_first: "John",
          name_last: "Doe",
          email_address: paymentData.customerEmail,
          m_payment_id: `order_${paymentData.orderId}`,
          amount: paymentData.amount.toFixed(2),
          item_name: paymentData.description,
          item_description: `Order #${paymentData.orderId}`,
        };

        const isValid = verifyPayFastSignature(signatureData, signature, config.passphrase);
        expect(isValid).toBe(true);
      }
    });
  });
});
