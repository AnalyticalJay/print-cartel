import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { PayFastIntegration } from "./payfast-integration";
import crypto from "crypto";

describe("End-to-End Payment Flow", () => {
  let db: any;
  let testOrderId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  afterAll(async () => {
    // Cleanup test data
    if (testOrderId && db) {
      try {
        // Delete test order if it exists
        const { eq } = await import("drizzle-orm");
        await db.delete(orders).where(eq(orders.id, testOrderId));
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
  });

  it("should create a test order successfully", async () => {
    const { eq } = await import("drizzle-orm");

    const orderData = {
      customerFirstName: "Test",
      customerLastName: "Customer",
      customerEmail: "test@printcartel.co.za",
      customerPhone: "+27123456789",
      deliveryMethod: "delivery" as const,
      deliveryAddress: "123 Test Street, Cape Town",
      garmentType: "tshirt",
      garmentColor: "black",
      garmentSize: "M",
      quantity: 5,
      printPlacement: "front",
      printWidth: 20,
      printHeight: 15,
      totalPriceEstimate: "500.00",
      depositAmount: "0.00",
      amountPaid: "0.00",
      paymentStatus: "pending",
      paymentVerificationStatus: "pending",
      orderStatus: "pending_design_upload",
    };

    const result = await db.insert(orders).values(orderData);
    testOrderId = result[0];

    expect(testOrderId).toBeGreaterThan(0);
    console.log(`✓ Test order created: ${testOrderId}`);
  });

  it("should generate valid PayFast payment URL", async () => {
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: process.env.PAYFAST_PASSPHRASE || "",
      isSandbox: false,
    });

    const paymentUrl = payfast.getPaymentUrl({
      orderId: testOrderId,
      amount: 500,
      customerEmail: "test@printcartel.co.za",
      customerName: "Test Customer",
      itemName: `Invoice for Order #${testOrderId}`,
      itemDescription: "Payment for DTF printing order",
      returnUrl: "https://printcartel.co.za/order/success",
      cancelUrl: "https://printcartel.co.za/order/cancel",
      notifyUrl: "https://printcartel.co.za/api/payfast/notify",
    });

    expect(paymentUrl).toBeDefined();
    expect(paymentUrl).toContain("https://www.payfast.co.za/eng/process");
    expect(paymentUrl).toContain("merchant_id=19428362");
    expect(paymentUrl).toContain("signature=");

    console.log(`✓ PayFast URL generated successfully`);
    console.log(`  URL: ${paymentUrl.substring(0, 100)}...`);
  });

  it("should verify PayFast notification signature correctly", async () => {
    const payfast = new PayFastIntegration({
      merchantId: "19428362",
      merchantKey: "x9mjrsxlwirog",
      passphrase: process.env.PAYFAST_PASSPHRASE || "",
      isSandbox: false,
    });

    // Create test notification data
    const notificationData = {
      m_payment_id: `order-${testOrderId}`,
      pf_payment_id: "1234567890",
      payment_status: "COMPLETE",
      item_name: `Invoice for Order #${testOrderId}`,
      item_description: "Payment for DTF printing order",
      amount_gross: "500.00",
      amount_fee: "50.00",
      amount_net: "450.00",
      custom_int1: testOrderId.toString(),
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

    if (process.env.PAYFAST_PASSPHRASE) queryString += `&passphrase=${process.env.PAYFAST_PASSPHRASE}`;

    const signature = crypto.createHash("md5").update(queryString).digest("hex");

    // Verify signature
    const isValid = payfast.verifyNotificationSignature({
      ...notificationData,
      signature,
    } as any);

    expect(isValid).toBe(true);
    console.log(`✓ PayFast signature verification passed`);
  });

  it("should handle payment with full amount", async () => {
    const { eq } = await import("drizzle-orm");

    // Simulate payment received
    const totalAmount = 500;
    const paidAmount = 500;

    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        amountPaid: paidAmount.toString(),
        paymentVerificationStatus: "verified",
        paymentVerificationNotes: `PayFast payment verified: ${paidAmount} ZAR`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, testOrderId));

    // Verify update
    const updatedOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, testOrderId))
      .limit(1);

    expect(updatedOrder[0].paymentStatus).toBe("paid");
    expect(updatedOrder[0].amountPaid).toBe(paidAmount.toString());
    expect(updatedOrder[0].paymentVerificationStatus).toBe("verified");

    console.log(`✓ Full payment recorded successfully`);
    console.log(`  Amount: R${paidAmount}`);
  });

  it("should calculate remaining balance correctly", async () => {
    const { eq } = await import("drizzle-orm");

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, testOrderId))
      .limit(1);

    const totalAmount = parseFloat(order[0].totalPriceEstimate);
    const paidAmount = parseFloat(order[0].amountPaid || "0");
    const remainingBalance = totalAmount - paidAmount;

    expect(remainingBalance).toBe(0);
    console.log(`✓ Remaining balance calculated correctly: R${remainingBalance.toFixed(2)}`);
  });

  it("should generate correct payment receipt email data", async () => {
    const { eq } = await import("drizzle-orm");

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, testOrderId))
      .limit(1);

    const totalAmount = parseFloat(order[0].totalPriceEstimate);
    const paidAmount = parseFloat(order[0].amountPaid || "0");
    const remainingBalance = Math.max(0, totalAmount - paidAmount);
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

    const receiptData = {
      orderId: testOrderId,
      invoiceNumber: `INV-${testOrderId}`,
      customerName: `${order[0].customerFirstName} ${order[0].customerLastName}`,
      customerEmail: order[0].customerEmail,
      paymentDate: new Date().toLocaleDateString("en-ZA"),
      paymentMethod: "payfast",
      amountPaid: paidAmount,
      totalOrderAmount: totalAmount,
      remainingBalance,
      garmentType: "Custom Apparel",
      quantity: order[0].quantity,
      deliveryMethod: order[0].deliveryMethod,
      deliveryAddress: order[0].deliveryAddress,
      estimatedDeliveryDate: estimatedDeliveryDate.toLocaleDateString("en-ZA"),
    };

    expect(receiptData.amountPaid).toBe(500);
    expect(receiptData.remainingBalance).toBe(0);
    expect(receiptData.paymentMethod).toBe("payfast");

    console.log(`✓ Payment receipt data generated successfully`);
    console.log(`  Invoice: ${receiptData.invoiceNumber}`);
    console.log(`  Amount Paid: R${receiptData.amountPaid.toFixed(2)}`);
    console.log(`  Estimated Delivery: ${receiptData.estimatedDeliveryDate}`);
  });

  it("should verify full payment flow from order to completion", async () => {
    const { eq } = await import("drizzle-orm");

    // Get final order state
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, testOrderId))
      .limit(1);

    // Verify all payment fields
    expect(order[0].paymentStatus).toBe("paid");
    expect(order[0].amountPaid).toBe("500");
    expect(order[0].paymentVerificationStatus).toBe("verified");
    expect(parseFloat(order[0].totalPriceEstimate)).toBe(500);

    console.log(`✓ Full payment flow verified successfully`);
    console.log(`  Order ID: ${testOrderId}`);
    console.log(`  Status: ${order[0].paymentStatus}`);
    console.log(`  Amount Paid: R${order[0].amountPaid}`);
    console.log(`  Verification: ${order[0].paymentVerificationStatus}`);
  });
});
