import { describe, it, expect, beforeAll, vi } from "vitest";
import { PayFastIntegration, PaymentData } from "./payfast-integration";

describe("PayFast Integration Tests", () => {
  let payfast: PayFastIntegration;
  const merchantId = process.env.PAYFAST_MERCHANT_ID || "19428362";
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY || "x9mjrsxlwirog";
  const passphrase = process.env.PAYFAST_PASSPHRASE || "-.Redemption_2026";

  beforeAll(() => {
    payfast = new PayFastIntegration({
      merchantId,
      merchantKey,
      passphrase,
      isSandbox: false, // Use live mode
    });
  });

  it("should generate valid payment URL with all required parameters", () => {
    const payment: PaymentData = {
      orderId: 12345,
      amount: 500.0,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing for t-shirts",
      returnUrl: "https://example.com/payment/return",
      cancelUrl: "https://example.com/payment/cancel",
      notifyUrl: "https://example.com/payment/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(payment);

    expect(paymentUrl).toBeTruthy();
    expect(paymentUrl).toContain("payfast.co.za");
    expect(paymentUrl).toContain("merchant_id=" + merchantId);
    expect(paymentUrl).toContain("merchant_key=" + merchantKey);
    expect(paymentUrl).toContain("amount=500.00");
    expect(paymentUrl).toContain("item_name=DTF+Printing+Order");
    expect(paymentUrl).toContain("signature=");
  });

  it("should handle decimal amounts correctly", () => {
    const payment: PaymentData = {
      orderId: 12345,
      amount: 1234.56,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(payment);

    expect(paymentUrl).toContain("amount=1234.56");
  });

  it("should generate unique signatures for different payment amounts", () => {
    const basePayment: PaymentData = {
      orderId: 12345,
      amount: 100.0,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const url1 = payfast.getPaymentUrl(basePayment);
    const url2 = payfast.getPaymentUrl({
      ...basePayment,
      amount: 200.0,
    });

    expect(url1).not.toBe(url2);
    expect(url1).toContain("amount=100.00");
    expect(url2).toContain("amount=200.00");
  });

  it("should generate consistent signatures for identical payment data", () => {
    const payment: PaymentData = {
      orderId: 12345,
      amount: 500.0,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const url1 = payfast.getPaymentUrl(payment);
    const url2 = payfast.getPaymentUrl(payment);

    expect(url1).toBe(url2);
  });

  it("should handle special characters in customer name", () => {
    const payment: PaymentData = {
      orderId: 12345,
      amount: 500.0,
      customerEmail: "customer@example.com",
      customerName: "John O'Brien-Smith",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(payment);

    expect(paymentUrl).toBeTruthy();
    expect(paymentUrl).toContain("name_first=John");
  });

  it("should include order ID in payment reference", () => {
    const payment: PaymentData = {
      orderId: 98765,
      amount: 500.0,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(payment);

    expect(paymentUrl).toContain("order-98765");
  });

  it("should handle zero amount gracefully", () => {
    const payment: PaymentData = {
      orderId: 12345,
      amount: 0.0,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(payment);

    expect(paymentUrl).toContain("amount=0.00");
  });

  it("should handle large amounts correctly", () => {
    const payment: PaymentData = {
      orderId: 12345,
      amount: 99999.99,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "DTF Printing Order",
      itemDescription: "Custom DTF printing",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    };

    const paymentUrl = payfast.getPaymentUrl(payment);

    expect(paymentUrl).toContain("amount=99999.99");
  });
});
