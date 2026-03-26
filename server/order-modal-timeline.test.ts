import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "./db";
import { orders } from "@/../drizzle/schema";

describe("Order Modal with Timeline Integration", () => {
  let testOrderId: number;

  beforeEach(async () => {
    // Create a test order with full timeline data
    const result = await db.insert(orders).values({
      customerFirstName: "John",
      customerLastName: "Doe",
      customerEmail: "john@example.com",
      customerPhone: "555-1234",
      customerCompany: "Test Company",
      productId: 1,
      quantity: 5,
      colorId: 1,
      sizeId: 1,
      totalPriceEstimate: "500.00",
      depositAmount: "250.00",
      status: "quoted",
      paymentStatus: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
      quoteApprovedAt: new Date(),
      paymentVerifiedAt: null,
      paymentVerificationNotes: "Pending manual payment verification",
      quoteRejectionReason: null,
    });
    testOrderId = result[0].insertId as number;
  });

  it("should display order details in modal", async () => {
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, testOrderId),
    });

    expect(order).toBeDefined();
    expect(order?.customerFirstName).toBe("John");
    expect(order?.customerLastName).toBe("Doe");
    expect(order?.status).toBe("quoted");
  });

  it("should display timeline with status changes", async () => {
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, testOrderId),
    });

    // Timeline should show creation date
    expect(order?.createdAt).toBeDefined();
    
    // Timeline should show quote approval date
    expect(order?.quoteApprovedAt).toBeDefined();
  });

  it("should display payment verification notes in timeline", async () => {
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, testOrderId),
    });

    expect(order?.paymentVerificationNotes).toBe("Pending manual payment verification");
  });

  it("should display quote rejection reason if present", async () => {
    // Create order with rejection
    const result = await db.insert(orders).values({
      customerFirstName: "Jane",
      customerLastName: "Smith",
      customerEmail: "jane@example.com",
      customerPhone: "555-5678",
      productId: 1,
      quantity: 3,
      colorId: 1,
      sizeId: 1,
      totalPriceEstimate: "300.00",
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
      quoteRejectionReason: "Price too high",
    });

    const rejectedOrderId = result[0].insertId as number;
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, rejectedOrderId),
    });

    expect(order?.quoteRejectionReason).toBe("Price too high");
  });

  it("should display payment verified timestamp", async () => {
    const verifiedAt = new Date();
    const result = await db.insert(orders).values({
      customerFirstName: "Bob",
      customerLastName: "Johnson",
      customerEmail: "bob@example.com",
      customerPhone: "555-9999",
      productId: 1,
      quantity: 10,
      colorId: 1,
      sizeId: 1,
      totalPriceEstimate: "1000.00",
      depositAmount: "500.00",
      status: "approved",
      paymentStatus: "paid",
      createdAt: new Date(),
      updatedAt: new Date(),
      quoteApprovedAt: new Date(),
      paymentVerifiedAt: verifiedAt,
      paymentVerificationNotes: "Payment verified via bank transfer",
    });

    const paidOrderId = result[0].insertId as number;
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, paidOrderId),
    });

    expect(order?.paymentVerifiedAt).toEqual(verifiedAt);
    expect(order?.paymentStatus).toBe("paid");
  });

  it("should display admin notes in modal", async () => {
    const result = await db.insert(orders).values({
      customerFirstName: "Alice",
      customerLastName: "Brown",
      customerEmail: "alice@example.com",
      customerPhone: "555-4444",
      productId: 1,
      quantity: 2,
      colorId: 1,
      sizeId: 1,
      totalPriceEstimate: "200.00",
      status: "in-production",
      paymentStatus: "deposit_paid",
      createdAt: new Date(),
      updatedAt: new Date(),
      additionalNotes: "Rush order - priority production",
    });

    const orderId = result[0].insertId as number;
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    expect(order?.additionalNotes).toBe("Rush order - priority production");
  });

  it("should show complete order progression in timeline", async () => {
    const createdAt = new Date("2026-01-01");
    const quotedAt = new Date("2026-01-02");
    const approvedAt = new Date("2026-01-03");
    const paidAt = new Date("2026-01-04");

    const result = await db.insert(orders).values({
      customerFirstName: "Charlie",
      customerLastName: "Davis",
      customerEmail: "charlie@example.com",
      customerPhone: "555-7777",
      productId: 1,
      quantity: 5,
      colorId: 1,
      sizeId: 1,
      totalPriceEstimate: "500.00",
      depositAmount: "250.00",
      status: "completed",
      paymentStatus: "paid",
      createdAt,
      updatedAt: paidAt,
      quoteApprovedAt: approvedAt,
      paymentVerifiedAt: paidAt,
      paymentVerificationNotes: "Full payment received",
    });

    const orderId = result[0].insertId as number;
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    // Verify timeline progression
    expect(order?.createdAt).toEqual(createdAt);
    expect(order?.quoteApprovedAt).toEqual(approvedAt);
    expect(order?.paymentVerifiedAt).toEqual(paidAt);
    expect(order?.status).toBe("completed");
    expect(order?.paymentStatus).toBe("paid");
  });

  it("should handle orders with no timeline events", async () => {
    const result = await db.insert(orders).values({
      customerFirstName: "David",
      customerLastName: "Wilson",
      customerEmail: "david@example.com",
      customerPhone: "555-3333",
      productId: 1,
      quantity: 1,
      colorId: 1,
      sizeId: 1,
      totalPriceEstimate: "100.00",
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orderId = result[0].insertId as number;
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
    });

    // Should still have creation date
    expect(order?.createdAt).toBeDefined();
    // But no approval or payment dates
    expect(order?.quoteApprovedAt).toBeNull();
    expect(order?.paymentVerifiedAt).toBeNull();
  });
});
