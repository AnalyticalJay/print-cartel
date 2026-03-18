import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { orders, paymentRecords } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  generateInvoiceNumber,
  calculateDepositAmount,
  createInvoice,
  recordPayment,
  getPaymentStatus,
  getPaymentHistory,
} from "./invoice";

describe("Payment and Invoicing System", () => {
  let testOrderId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test order
    const result = await db.insert(orders).values({
      productId: 1,
      colorId: 1,
      sizeId: 1,
      quantity: 1,
      customerFirstName: "Test",
      customerLastName: "Customer",
      customerEmail: "test@example.com",
      customerPhone: "1234567890",
      status: "pending",
      totalPriceEstimate: "1000",
      deliveryCharge: "50",
      paymentStatus: "unpaid",
    });

    // Get the inserted order ID
    const insertedOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, "test@example.com"));
    testOrderId = insertedOrders[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (db && testOrderId) {
      await db.delete(paymentRecords).where(eq(paymentRecords.orderId, testOrderId));
      await db.delete(orders).where(eq(orders.id, testOrderId));
    }
  });

  it("should generate a unique invoice number", () => {
    const invoice1 = generateInvoiceNumber();
    const invoice2 = generateInvoiceNumber();

    expect(invoice1).toMatch(/^INV-\d+-\d+$/);
    expect(invoice2).toMatch(/^INV-\d+-\d+$/);
    expect(invoice1).not.toBe(invoice2);
  });

  it("should calculate 50% deposit correctly", () => {
    const totalPrice = 1000;
    const deposit = calculateDepositAmount(totalPrice);

    expect(deposit).toBe(500);
  });

  it("should calculate deposit for decimal amounts", () => {
    const totalPrice = 1234.56;
    const deposit = calculateDepositAmount(totalPrice);

    expect(deposit).toBe(617.28);
  });

  it("should create an invoice for an order", async () => {
    const invoice = await createInvoice(testOrderId);

    expect(invoice).toHaveProperty("invoiceNumber");
    expect(invoice).toHaveProperty("invoiceDate");
    expect(invoice.orderId).toBe(testOrderId);
    expect(invoice.customerEmail).toBe("test@example.com");
    expect(invoice.totalAmount).toBe(1000);
    expect(invoice.depositAmount).toBe(500);
    expect(invoice.deliveryCharge).toBe(50);
  });

  it("should record a deposit payment", async () => {
    const depositAmount = 500;
    const result = await recordPayment(
      testOrderId,
      depositAmount,
      "credit_card",
      "deposit",
      "txn_12345"
    );

    expect(result.newPaymentStatus).toBe("deposit_paid");
    expect(result.amountPaid).toBe(depositAmount);
    expect(result.remainingBalance).toBe(500); // 1000 - 500
  });

  it("should record final payment and mark order as fully paid", async () => {
    // First record the remaining balance
    const remainingBalance = 500;
    const result = await recordPayment(
      testOrderId,
      remainingBalance,
      "credit_card",
      "final_payment",
      "txn_67890"
    );

    expect(result.newPaymentStatus).toBe("paid");
    expect(result.amountPaid).toBe(1000); // 500 + 500
    expect(result.remainingBalance).toBe(0);
  });

  it("should get payment status for an order", async () => {
    const status = await getPaymentStatus(testOrderId);

    expect(status.orderId).toBe(testOrderId);
    expect(status.paymentStatus).toBe("paid");
    expect(status.totalPrice).toBe(1000);
    expect(status.depositAmount).toBe(500);
    expect(status.amountPaid).toBe(1000);
    expect(status.remainingBalance).toBe(0);
    expect(status.isDepositPaid).toBe(true);
    expect(status.isFullyPaid).toBe(true);
  });

  it("should get payment history for an order", async () => {
    const history = await getPaymentHistory(testOrderId);

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(2); // At least deposit and final payment
    expect(history[0]).toHaveProperty("orderId", testOrderId);
    expect(history[0]).toHaveProperty("amount");
    expect(history[0]).toHaveProperty("paymentStatus");
  });

  it("should handle partial payment correctly", async () => {
    // Create another test order
    const result = await db.insert(orders).values({
      productId: 1,
      colorId: 1,
      sizeId: 1,
      quantity: 1,
      customerFirstName: "Partial",
      customerLastName: "Payment",
      customerEmail: "partial@example.com",
      customerPhone: "9876543210",
      status: "pending",
      totalPriceEstimate: "2000",
      deliveryCharge: "100",
      paymentStatus: "unpaid",
    });

    const partialOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, "partial@example.com"));
    const partialOrderId = partialOrders[0].id;

    // Record a partial payment (less than 50%)
    const partialAmount = 300;
    const paymentResult = await recordPayment(
      partialOrderId,
      partialAmount,
      "bank_transfer",
      "deposit",
      "txn_partial"
    );

    expect(paymentResult.newPaymentStatus).toBe("unpaid");
    expect(paymentResult.amountPaid).toBe(partialAmount);
    expect(paymentResult.remainingBalance).toBe(1700); // 2000 - 300

    // Clean up
    await db.delete(paymentRecords).where(eq(paymentRecords.orderId, partialOrderId));
    await db.delete(orders).where(eq(orders.id, partialOrderId));
  });

  it("should track payment method correctly", async () => {
    const history = await getPaymentHistory(testOrderId);

    const creditCardPayments = history.filter((p: any) => p.paymentMethod === "credit_card");
    expect(creditCardPayments.length).toBeGreaterThan(0);
  });
});
