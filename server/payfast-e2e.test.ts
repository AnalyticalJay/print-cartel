import { describe, it, expect } from "vitest";
import { buildPayFastPaymentUrl, verifyPayFastSignature } from "./payfast-service";

/**
 * End-to-End PayFast Payment Flow Tests
 * Simulates the complete payment flow from order to PayFast redirect
 */

describe("PayFast E2E Payment Flow", () => {
  const testMerchantId = "19428362";
  const testMerchantKey = "x9mjrsxlwirog";
  const testPassphrase = "-,Redemption_2026";

  it("should generate valid payment URL with correct signature", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const paymentData = {
      orderId: 12345,
      amount: 500.0,
      customerEmail: "customer@printcartel.co.za",
      customerName: "John Smith",
      description: "Print Cartel Order #12345",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=12345",
      cancelUrl: "https://printcartel.co.za/payment?orderId=12345",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    // Generate payment URL
    const paymentUrl = buildPayFastPaymentUrl(config, paymentData);

    // Verify URL structure
    expect(paymentUrl).toContain("https://sandbox.payfast.co.za/eng/process?");
    expect(paymentUrl).toContain("merchant_id=19428362");
    expect(paymentUrl).toContain("merchant_key=x9mjrsxlwirog");
    expect(paymentUrl).toContain("order_12345");
    expect(paymentUrl).toContain("amount=500.00");
    expect(paymentUrl).toContain("signature=");

    // Extract and verify signature
    const signatureMatch = paymentUrl.match(/signature=([a-f0-9]{32})/);
    expect(signatureMatch).toBeTruthy();

    if (signatureMatch) {
      const signature = signatureMatch[1];

      // Reconstruct the data that was signed
      const signedData = {
        merchant_id: config.merchantId,
        merchant_key: config.merchantKey,
        return_url: paymentData.returnUrl,
        cancel_url: paymentData.cancelUrl,
        notify_url: paymentData.notifyUrl,
        name_first: "John",
        name_last: "Smith",
        email_address: paymentData.customerEmail,
        m_payment_id: "order_12345",
        amount: "500.00",
        item_name: paymentData.description,
        item_description: "Order #12345",
      };

      // Verify the signature is valid
      const isValid = verifyPayFastSignature(signedData, signature, config.passphrase);
      expect(isValid).toBe(true);
    }
  });

  it("should handle deposit payments correctly", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const totalAmount = 1000.0;
    const depositAmount = totalAmount * 0.5; // 50% deposit

    const paymentData = {
      orderId: 54321,
      amount: depositAmount,
      customerEmail: "customer@example.com",
      customerName: "Jane Doe",
      description: "Print Cartel Order #54321 - Deposit",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=54321",
      cancelUrl: "https://printcartel.co.za/payment?orderId=54321",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const paymentUrl = buildPayFastPaymentUrl(config, paymentData);

    // Verify deposit amount is correct
    expect(paymentUrl).toContain("amount=500.00");
    expect(paymentUrl).toContain("order_54321");
  });

  it("should handle full payment correctly", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const fullAmount = 2500.0;

    const paymentData = {
      orderId: 99999,
      amount: fullAmount,
      customerEmail: "customer@example.com",
      customerName: "Bob Johnson",
      description: "Print Cartel Order #99999 - Full Payment",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=99999",
      cancelUrl: "https://printcartel.co.za/payment?orderId=99999",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const paymentUrl = buildPayFastPaymentUrl(config, paymentData);

    // Verify full amount is correct
    expect(paymentUrl).toContain("amount=2500.00");
    expect(paymentUrl).toContain("order_99999");
  });

  it("should handle special characters in customer names", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const paymentData = {
      orderId: 11111,
      amount: 750.0,
      customerEmail: "customer@example.com",
      customerName: "Jean-Pierre O'Brien",
      description: "Print Cartel Order #11111",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=11111",
      cancelUrl: "https://printcartel.co.za/payment?orderId=11111",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const paymentUrl = buildPayFastPaymentUrl(config, paymentData);

    // Should contain special characters in the final URL
    expect(paymentUrl).toContain("name_first=Jean-Pierre");
    expect(paymentUrl).toContain("name_last=O'Brien");
  });

  it("should handle production environment correctly", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: false, // Production
    };

    const paymentData = {
      orderId: 22222,
      amount: 1200.0,
      customerEmail: "customer@example.com",
      customerName: "Alice Smith",
      description: "Print Cartel Order #22222",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=22222",
      cancelUrl: "https://printcartel.co.za/payment?orderId=22222",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const paymentUrl = buildPayFastPaymentUrl(config, paymentData);

    // Should use production URL
    expect(paymentUrl).toContain("https://www.payfast.co.za/eng/process?");
    expect(paymentUrl).not.toContain("sandbox");
  });

  it("should generate unique signatures for different orders", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const paymentData1 = {
      orderId: 33333,
      amount: 500.0,
      customerEmail: "customer1@example.com",
      customerName: "Customer One",
      description: "Order 1",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=33333",
      cancelUrl: "https://printcartel.co.za/payment?orderId=33333",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const paymentData2 = {
      orderId: 44444,
      amount: 500.0,
      customerEmail: "customer2@example.com",
      customerName: "Customer Two",
      description: "Order 2",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=44444",
      cancelUrl: "https://printcartel.co.za/payment?orderId=44444",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const url1 = buildPayFastPaymentUrl(config, paymentData1);
    const url2 = buildPayFastPaymentUrl(config, paymentData2);

    // Extract signatures
    const sig1Match = url1.match(/signature=([a-f0-9]{32})/);
    const sig2Match = url2.match(/signature=([a-f0-9]{32})/);

    expect(sig1Match).toBeTruthy();
    expect(sig2Match).toBeTruthy();

    if (sig1Match && sig2Match) {
      // Signatures should be different for different orders
      expect(sig1Match[1]).not.toBe(sig2Match[1]);
    }
  });

  it("should include all required PayFast fields in URL", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const paymentData = {
      orderId: 55555,
      amount: 1500.0,
      customerEmail: "customer@example.com",
      customerName: "Test Customer",
      description: "Test Order",
      returnUrl: "https://printcartel.co.za/payment-success?orderId=55555",
      cancelUrl: "https://printcartel.co.za/payment?orderId=55555",
      notifyUrl: "https://printcartel.co.za/api/payfast/callback",
    };

    const paymentUrl = buildPayFastPaymentUrl(config, paymentData);

    // Check for all required fields
    expect(paymentUrl).toContain("merchant_id=");
    expect(paymentUrl).toContain("merchant_key=");
    expect(paymentUrl).toContain("return_url=");
    expect(paymentUrl).toContain("cancel_url=");
    expect(paymentUrl).toContain("notify_url=");
    expect(paymentUrl).toContain("name_first=");
    expect(paymentUrl).toContain("name_last=");
    expect(paymentUrl).toContain("email_address=");
    expect(paymentUrl).toContain("m_payment_id=");
    expect(paymentUrl).toContain("amount=");
    expect(paymentUrl).toContain("item_name=");
    expect(paymentUrl).toContain("item_description=");
    expect(paymentUrl).toContain("signature=");
  });

  it("should format amounts with exactly 2 decimal places", () => {
    const config = {
      merchantId: testMerchantId,
      merchantKey: testMerchantKey,
      passphrase: testPassphrase,
      sandbox: true,
    };

    const testAmounts = [
      { input: 100, expected: "100.00" },
      { input: 100.5, expected: "100.50" },
      { input: 100.55, expected: "100.55" },
      { input: 1000, expected: "1000.00" },
      { input: 0.01, expected: "0.01" },
    ];

    testAmounts.forEach(({ input, expected }) => {
      const paymentData = {
        orderId: 66666,
        amount: input,
        customerEmail: "customer@example.com",
        customerName: "Test Customer",
        description: "Test Order",
        returnUrl: "https://printcartel.co.za/payment-success?orderId=66666",
        cancelUrl: "https://printcartel.co.za/payment?orderId=66666",
        notifyUrl: "https://printcartel.co.za/api/payfast/callback",
      };

      const paymentUrl = buildPayFastPaymentUrl(config, paymentData);
      expect(paymentUrl).toContain(`amount=${expected}`);
    });
  });
});
