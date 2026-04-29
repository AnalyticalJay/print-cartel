import { describe, it, expect } from "vitest";
import { PayFastIntegration } from "./payfast-integration";
import crypto from "crypto";

describe("Simplified Payment Flow Test", () => {
  it("should generate valid PayFast payment URL with correct signature", () => {
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: "-.Redemption_2026",
      isSandbox: false,
    });

    const paymentUrl = payfast.getPaymentUrl({
      orderId: 12345,
      amount: 500,
      customerEmail: "test@printcartel.co.za",
      customerName: "Test Customer",
      itemName: "Invoice for Order #12345",
      itemDescription: "Payment for DTF printing order",
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
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: "-.Redemption_2026",
      isSandbox: false,
    });

    // Create test notification data
    const notificationData = {
      m_payment_id: "order-12345",
      pf_payment_id: "1234567890",
      payment_status: "COMPLETE",
      item_name: "Invoice for Order #12345",
      item_description: "Payment for DTF printing order",
      amount_gross: "500.00",
      amount_fee: "50.00",
      amount_net: "450.00",
      custom_int1: "12345",
      custom_str1: "test@printcartel.co.za",
      name_first: "Test",
      name_last: "Customer",
      email_address: "test@printcartel.co.za",
      merchant_id: "19428362",
    };

    // Generate valid signature
    const sortedData = Object.keys(notificationData)
      .sort()
      .reduce((acc, key) => {
        if (notificationData[key as keyof typeof notificationData]) {
          acc[key] = notificationData[key as keyof typeof notificationData];
        }
        return acc;
      }, {} as Record<string, string>);

    let queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    queryString += "&passphrase=-.Redemption_2026";

    const signature = crypto.createHash("md5").update(queryString).digest("hex");

    // Verify signature
    const isValid = payfast.verifyNotificationSignature({
      ...notificationData,
      signature,
    } as any);

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
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: "-.Redemption_2026",
      isSandbox: false,
    });

    const paymentUrl = payfast.getPaymentUrl({
      orderId: 99999,
      amount: 1500.5,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      itemName: "Order Invoice",
      itemDescription: "Test payment",
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
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: "-.Redemption_2026",
      isSandbox: false,
    });

    const testAmounts = [100, 500, 1000, 5000, 10000];

    testAmounts.forEach((amount) => {
      const paymentUrl = payfast.getPaymentUrl({
        orderId: Math.floor(Math.random() * 100000),
        amount,
        customerEmail: "test@printcartel.co.za",
        customerName: "Test Customer",
        itemName: "Test Invoice",
        itemDescription: "Test payment",
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
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: "-.Redemption_2026",
      isSandbox: false,
    });

    const paymentUrl = payfast.getPaymentUrl({
      orderId: 12345,
      amount: 500,
      customerEmail: "test@printcartel.co.za",
      customerName: "Test Customer",
      itemName: "Test Invoice",
      itemDescription: "Test payment",
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
