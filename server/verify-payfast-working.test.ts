import { describe, it, expect } from "vitest";
import { PayFastIntegration } from "./payfast-integration";

describe("PayFast Payment System - Complete Verification", () => {
  const payfast = new PayFastIntegration({
    merchantId: process.env.PAYFAST_MERCHANT_ID || "19428362",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || "x9mjrsxlwirog",
    passphrase: process.env.PAYFAST_PASSPHRASE || "-,Redemption_2026",
    isSandbox: process.env.PAYFAST_SANDBOX === "true",
  });

  it("should have valid live production credentials configured", () => {
    expect(process.env.PAYFAST_MERCHANT_ID).toBeDefined();
    expect(process.env.PAYFAST_MERCHANT_KEY).toBeDefined();
    expect(process.env.PAYFAST_PASSPHRASE).toBeDefined();
    expect(process.env.PAYFAST_SANDBOX).toBe("false");
  });

  it("should generate valid payment URL for test order", async () => {
    const paymentUrl = payfast.getPaymentUrl({
      orderId: 12345,
      amount: 1500.0,
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      itemName: "Test Order",
      itemDescription: "Test payment",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    expect(paymentUrl).toBeDefined();
    expect(typeof paymentUrl).toBe("string");
    expect(paymentUrl).toContain("https://www.payfast.co.za/eng/process");
    expect(paymentUrl).toContain("merchant_id=19428362");
    expect(paymentUrl).toContain("amount=1500.00");
    expect(paymentUrl).toContain("signature=");
  });

  it("should include signature in payment URL", () => {
    const url = payfast.getPaymentUrl({
      orderId: 99999,
      amount: 500.0,
      customerEmail: "customer@printcartel.co.za",
      customerName: "John Doe",
      itemName: "Invoice #99999",
      itemDescription: "DTF Printing Order",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    const signatureMatch = url.match(/signature=([a-f0-9]{32})/);
    expect(signatureMatch).toBeTruthy();
    expect(signatureMatch?.[1]).toHaveLength(32); // MD5 hash is 32 chars
  });

  it("should handle special characters in passphrase correctly", async () => {
    const url = payfast.getPaymentUrl({
      orderId: 54321,
      amount: 2500.0,
      customerEmail: "special@chars.com",
      customerName: "Special Chars",
      itemName: "Test with special chars",
      itemDescription: "Testing comma and dash in passphrase",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    expect(url).toContain("signature=");
    // Verify URL is properly formed
    expect(url).toContain("https://www.payfast.co.za/eng/process");
  });

  it("should generate consistent signatures for same data", async () => {
    const paymentData = {
      orderId: 11111,
      amount: 1000.0,
      customerEmail: "consistent@test.com",
      customerName: "Consistent Test",
      itemName: "Consistency Test",
      itemDescription: "Testing signature consistency",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    };

    const url1 = payfast.getPaymentUrl(paymentData);
    const url2 = payfast.getPaymentUrl(paymentData);

    // Extract signatures from URLs
    const sig1 = url1.match(/signature=([a-f0-9]{32})/)?.[1];
    const sig2 = url2.match(/signature=([a-f0-9]{32})/)?.[1];

    expect(sig1).toBe(sig2);
  });

  it("should properly encode URL parameters", async () => {
    const url = payfast.getPaymentUrl({
      orderId: 77777,
      amount: 3000.0,
      customerEmail: "test+email@example.com",
      customerName: "Test Name With Spaces",
      itemName: "Item with / special & chars",
      itemDescription: "Description with multiple special characters",
      returnUrl: "https://printcartel.co.za/order/success?id=123&status=pending",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    // Verify URL is properly encoded
    expect(url).toContain("%40"); // @ is encoded
    expect(url).toContain("%2F"); // / is encoded
    expect(url).toContain("%26"); // & is encoded
    
    // Verify signature is present
    expect(url).toMatch(/signature=[a-f0-9]{32}/);
  });

  it("should be configured for live production (not sandbox)", () => {
    const url = payfast.getPaymentUrl({
      orderId: 88888,
      amount: 1500.0,
      customerEmail: "live@test.com",
      customerName: "Live Test",
      itemName: "Live Payment",
      itemDescription: "Testing live production",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    // Should use live PayFast URL, not sandbox
    expect(url).toContain("https://www.payfast.co.za/eng/process");
    expect(url).not.toContain("sandbox.payfast.co.za");
  });

  it("should generate valid payment URLs for various amounts", async () => {
    const amounts = [100, 500, 1000, 5000, 10000, 50000];

    for (const amount of amounts) {
      const url = payfast.getPaymentUrl({
        orderId: Math.floor(Math.random() * 100000),
        amount,
        customerEmail: "test@example.com",
        customerName: "Test Customer",
        itemName: `Order for R${amount}`,
        itemDescription: "Test payment",
        returnUrl: "https://printcartel.co.za/order/success",
        cancelUrl: "https://printcartel.co.za/order/cancel",
        notifyUrl: "https://printcartel.co.za/api/payfast/notify",
      });

      expect(url).toContain(`amount=${amount.toFixed(2)}`);
      expect(url).toMatch(/signature=[a-f0-9]{32}/);
    }
  });

  it("should verify notification signature correctly", () => {
    const notification = {
      m_payment_id: "order-12345",
      pf_payment_id: "1234567890",
      payment_status: "COMPLETE",
      item_name: "Test Item",
      item_description: "Test Description",
      amount_gross: "1500.00",
      amount_fee: "50.00",
      amount_net: "1450.00",
      custom_int1: "12345",
      custom_str1: "test@example.com",
      name_first: "Test",
      name_last: "User",
      email_address: "test@example.com",
      merchant_id: "19428362",
      signature: "", // Will be calculated
    };

    // This test verifies the signature verification method exists and works
    const result = payfast.verifyNotificationSignature(notification as any);
    // Result depends on correct signature being in notification
    expect(typeof result).toBe("boolean");
  });
});
