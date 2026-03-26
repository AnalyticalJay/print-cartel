import { describe, it, expect, beforeAll } from "vitest";
import { PayFastIntegration, PaymentData } from "./payfast-integration";

describe("PayFast Credentials Validation", () => {
  let merchantId: string;
  let merchantKey: string;
  let passphrase: string;
  let payfast: PayFastIntegration;

  beforeAll(() => {
    merchantId = process.env.PAYFAST_MERCHANT_ID || "";
    merchantKey = process.env.PAYFAST_MERCHANT_KEY || "";
    passphrase = process.env.PAYFAST_PASSPHRASE || "";

    payfast = new PayFastIntegration({
      merchantId,
      merchantKey,
      passphrase,
      isSandbox: false, // Use live credentials
    });
  });

  it("should have PayFast credentials configured", () => {
    expect(merchantId).toBeTruthy();
    expect(merchantKey).toBeTruthy();
    expect(passphrase).toBeTruthy();
  });

  it("should generate valid payment URL with credentials", () => {
    const testPayment: PaymentData = {
      orderId: 12345,
      amount: 100.0,
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      itemName: "Test Item",
      itemDescription: "Test Description",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(testPayment);

    // Payment URL should contain PayFast domain and merchant ID
    expect(paymentUrl).toContain("payfast.co.za");
    expect(paymentUrl).toContain(merchantId);
    expect(paymentUrl).toContain("signature=");
    expect(paymentUrl).toContain("order-12345");
  });

  it("should generate consistent payment URLs for same data", () => {
    const testPayment: PaymentData = {
      orderId: 12345,
      amount: 100.0,
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      itemName: "Test Item",
      itemDescription: "Test Description",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const url1 = payfast.getPaymentUrl(testPayment);
    const url2 = payfast.getPaymentUrl(testPayment);

    expect(url1).toBe(url2);
  });

  it("should generate different payment URLs for different amounts", () => {
    const testPayment1: PaymentData = {
      orderId: 12345,
      amount: 100.0,
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      itemName: "Test Item",
      itemDescription: "Test Description",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const testPayment2: PaymentData = {
      ...testPayment1,
      amount: 200.0,
    };

    const url1 = payfast.getPaymentUrl(testPayment1);
    const url2 = payfast.getPaymentUrl(testPayment2);

    expect(url1).not.toBe(url2);
  });
});
