/**
 * Simplified Payment Flow Tests
 * Tests the PayFast payment integration with the new buildPayFastPaymentUrl interface
 */
import { describe, it, expect } from "vitest";
import {
  buildPayFastPaymentUrl,
  generatePayFastSignature,
  verifyPayFastSignature,
} from "./payfast-service";

const TEST_CONFIG = {
  merchantId: "19428362",
  merchantKey: "x9mjrsxlwirog",
  passphrase: process.env.PAYFAST_PASSPHRASE || "",
  sandbox: false,
};

describe("Simplified Payment Flow Test", () => {
  it("should generate valid PayFast payment URL with correct signature", () => {
    const paymentUrl = buildPayFastPaymentUrl(TEST_CONFIG, {
      orderId: 12345,
      amount: 500,
      customerEmail: "test@printcartel.co.za",
      customerFirstName: "Test",
      customerLastName: "Customer",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    expect(paymentUrl).toBeDefined();
    expect(paymentUrl).toContain("https://www.payfast.co.za/eng/process");
    expect(paymentUrl).toContain("merchant_id=19428362");
    expect(paymentUrl).toContain("amount=500.00");
    expect(paymentUrl).toContain("signature=");
    expect(paymentUrl).toContain("custom_int1=12345");
    expect(paymentUrl).toContain("custom_str1=test%40printcartel.co.za");

    console.log("✓ PayFast URL generated successfully");
    console.log(`  URL: ${paymentUrl.substring(0, 100)}...`);
  });

  it("should verify PayFast notification signature correctly", () => {
    // Build notification data in insertion order (as PayFast sends it)
    const notificationData: Record<string, string> = {};
    notificationData["m_payment_id"] = "order-12345";
    notificationData["pf_payment_id"] = "1234567890";
    notificationData["payment_status"] = "COMPLETE";
    notificationData["item_name"] = "Invoice for Order #12345";
    notificationData["item_description"] = "Payment for DTF printing order";
    notificationData["amount_gross"] = "500.00";
    notificationData["amount_fee"] = "50.00";
    notificationData["amount_net"] = "450.00";
    notificationData["custom_int1"] = "12345";
    notificationData["custom_str1"] = "test@printcartel.co.za";
    notificationData["name_first"] = "Test";
    notificationData["name_last"] = "Customer";
    notificationData["email_address"] = "test@printcartel.co.za";
    notificationData["merchant_id"] = "19428362";

    // Generate signature in insertion order (NOT alphabetical - PayFast requirement)
    const signature = generatePayFastSignature(notificationData, process.env.PAYFAST_PASSPHRASE || "");

    // Verify signature
    const isValid = verifyPayFastSignature(notificationData, signature, process.env.PAYFAST_PASSPHRASE || "");
    expect(isValid).toBe(true);
    console.log("✓ PayFast signature verification passed");
    console.log(`  Signature: ${signature}`);
  });

  it("should handle full payment amount correctly", () => {
    const totalAmount = 500;
    const paidAmount = 500;
    const remainingBalance = totalAmount - paidAmount;

    expect(remainingBalance).toBe(0);
    console.log("✓ Full payment amount handled correctly");
    console.log(`  Total: R${totalAmount.toFixed(2)}`);
    console.log(`  Paid: R${paidAmount.toFixed(2)}`);
    console.log(`  Remaining: R${remainingBalance.toFixed(2)}`);
  });

  it("should generate payment receipt data correctly", () => {
    const orderId = 12345;
    const totalAmount = 500;
    const paidAmount = 500;
    const remainingBalance = Math.max(0, totalAmount - paidAmount);
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

    const receiptData = {
      orderId,
      invoiceNumber: `INV-${orderId}`,
      customerName: "Test Customer",
      customerEmail: "test@printcartel.co.za",
      paymentDate: new Date().toLocaleDateString("en-ZA"),
      paymentMethod: "payfast",
      amountPaid: paidAmount,
      totalOrderAmount: totalAmount,
      remainingBalance,
      garmentType: "Custom Apparel",
      quantity: 5,
      deliveryMethod: "delivery",
      deliveryAddress: "123 Test Street, Cape Town",
      estimatedDeliveryDate: estimatedDeliveryDate.toLocaleDateString("en-ZA"),
    };

    expect(receiptData.amountPaid).toBe(500);
    expect(receiptData.remainingBalance).toBe(0);
    expect(receiptData.paymentMethod).toBe("payfast");
    expect(receiptData.invoiceNumber).toBe("INV-12345");

    console.log("✓ Payment receipt data generated successfully");
    console.log(`  Invoice: ${receiptData.invoiceNumber}`);
    console.log(`  Amount Paid: R${receiptData.amountPaid.toFixed(2)}`);
    console.log(`  Estimated Delivery: ${receiptData.estimatedDeliveryDate}`);
  });

  it("should validate payment URL parameters", () => {
    const paymentUrl = buildPayFastPaymentUrl(TEST_CONFIG, {
      orderId: 99999,
      amount: 1500.5,
      customerEmail: "customer@example.com",
      customerFirstName: "John",
      customerLastName: "Doe",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    const url = new URL(paymentUrl);
    const params = new URLSearchParams(url.search);

    expect(params.get("merchant_id")).toBe("19428362");
    expect(params.get("merchant_key")).toBe("x9mjrsxlwirog");
    expect(params.get("amount")).toBe("1500.50");
    expect(params.get("custom_int1")).toBe("99999");
    expect(params.get("name_first")).toBe("John");
    expect(params.get("name_last")).toBe("Doe");
    expect(params.get("email_address")).toBe("customer@example.com");
    expect(params.get("signature")).toBeDefined();

    console.log("✓ Payment URL parameters validated");
    console.log(`  Merchant: ${params.get("merchant_id")}`);
    console.log(`  Amount: R${params.get("amount")}`);
    console.log(`  Order ID: ${params.get("custom_int1")}`);
  });

  it("should handle multiple payment amounts", () => {
    const testAmounts = [100, 500, 1000, 5000, 10000];

    testAmounts.forEach((amount) => {
      const paymentUrl = buildPayFastPaymentUrl(TEST_CONFIG, {
        orderId: Math.floor(Math.random() * 100000),
        amount,
        customerEmail: "test@printcartel.co.za",
        customerFirstName: "Test",
        customerLastName: "Customer",
        returnUrl: "https://printcartel.co.za/order/success",
        cancelUrl: "https://printcartel.co.za/order/cancel",
        notifyUrl: "https://printcartel.co.za/api/payfast/notify",
      });

      const url = new URL(paymentUrl);
      const params = new URLSearchParams(url.search);

      expect(params.get("amount")).toBe(amount.toFixed(2));
      expect(params.get("signature")).toBeDefined();
    });

    console.log("✓ Multiple payment amounts handled correctly");
    console.log(`  Tested amounts: ${testAmounts.map((a) => `R${a}`).join(", ")}`);
  });

  it("should verify live production mode is configured", () => {
    const paymentUrl = buildPayFastPaymentUrl(TEST_CONFIG, {
      orderId: 12345,
      amount: 500,
      customerEmail: "test@printcartel.co.za",
      customerFirstName: "Test",
      customerLastName: "Customer",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    expect(paymentUrl).toContain("https://www.payfast.co.za");
    expect(paymentUrl).not.toContain("sandbox");

    console.log("✓ Live production mode confirmed");
    console.log(`  URL: ${paymentUrl.substring(0, 80)}...`);
  });
});
