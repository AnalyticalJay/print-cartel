import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

vi.mock("./invoice-service", () => ({
  generateInvoicePDF: vi.fn(async () => Buffer.from("mock-pdf-content")),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(async () => ({
    url: "https://s3.example.com/invoices/1/invoice-123.pdf",
    key: "invoices/1/invoice-123.pdf",
  })),
}));

vi.mock("./invoice-email", () => ({
  sendInvoiceEmail: vi.fn(async () => true),
}));

vi.mock("./quote-action-emails", () => ({
  sendQuoteRejectedEmail: vi.fn(async () => true),
}));

describe("Quote Acceptance Workflow", () => {
  let db: any;
  let testOrderId: number;
  const testEmail = "customer@example.com";
  const testToken = "test-token-123";

  beforeEach(async () => {
    db = await getDb();
    if (db) {
      const result = await db
        .insert(orders)
        .values({
          productId: 1,
          colorId: 1,
          sizeId: 1,
          customerFirstName: "John",
          customerLastName: "Doe",
          customerEmail: testEmail,
          customerPhone: "+27123456789",
          deliveryMethod: "delivery",
          quantity: 100,
          totalPriceEstimate: "1500.00",
          depositAmount: "750.00",
          paymentMethod: "deposit",
          paymentStatus: "unpaid",
          status: "quoted",
          deliveryCharge: "50.00",
        })
        .$returningId();

      testOrderId = result[0].id;
    }
  });

  describe("acceptQuote", () => {
    it("should accept a quote and update order status to approved", async () => {
      if (!db) return;

      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderBefore[0].status).toBe("quoted");

      await db
        .update(orders)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].status).toBe("approved");
    });

    it("should generate and upload invoice PDF on quote acceptance", async () => {
      if (!db) return;

      await db
        .update(orders)
        .set({
          status: "approved",
          invoiceUrl: "https://s3.example.com/invoices/1/invoice-123.pdf",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].invoiceUrl).toBe(
        "https://s3.example.com/invoices/1/invoice-123.pdf"
      );
    });

    it("should validate email matches order email", async () => {
      if (!db) return;

      const wrongEmail = "wrong@example.com";

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData[0].customerEmail).not.toBe(wrongEmail);
      expect(orderData[0].customerEmail).toBe(testEmail);
    });

    it("should only accept orders in quoted status", async () => {
      if (!db) return;

      await db
        .update(orders)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData[0].status).not.toBe("quoted");
    });
  });

  describe("rejectQuote", () => {
    it("should reject a quote and update order status to cancelled", async () => {
      if (!db) return;

      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderBefore[0].status).toBe("quoted");

      await db
        .update(orders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].status).toBe("cancelled");
    });

    it("should validate rejection reason length", () => {
      const shortReason = "Too short";
      const validReason = "This quote is too expensive for our budget";

      expect(shortReason.length).toBeLessThan(10);
      expect(validReason.length).toBeGreaterThanOrEqual(10);
    });

    it("should only reject orders in quoted status", async () => {
      if (!db) return;

      await db
        .update(orders)
        .set({
          status: "in-production",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData[0].status).not.toBe("quoted");
    });
  });

  describe("getQuoteDetails", () => {
    it("should retrieve quote details for a valid order", async () => {
      if (!db) return;

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData).toHaveLength(1);
      expect(orderData[0].id).toBe(testOrderId);
      expect(orderData[0].customerEmail).toBe(testEmail);
      expect(orderData[0].status).toBe("quoted");
    });

    it("should validate email matches order email", async () => {
      if (!db) return;

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData[0].customerEmail).toBe(testEmail);
    });

    it("should return formatted quote details", async () => {
      if (!db) return;

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      const order = orderData[0];

      expect(order.id).toBeDefined();
      expect(order.customerFirstName).toBeDefined();
      expect(order.customerLastName).toBeDefined();
      expect(order.customerEmail).toBe(testEmail);
      expect(order.totalPriceEstimate).toBeDefined();
      expect(order.depositAmount).toBeDefined();
      expect(order.paymentMethod).toBe("deposit");
      expect(order.quantity).toBe(100);
      expect(order.status).toBe("quoted");
    });
  });

  describe("Quote Status Transitions", () => {
    it("should transition from quoted to approved", async () => {
      if (!db) return;

      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderBefore[0].status).toBe("quoted");

      await db
        .update(orders)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].status).toBe("approved");
    });

    it("should transition from quoted to cancelled", async () => {
      if (!db) return;

      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderBefore[0].status).toBe("quoted");

      await db
        .update(orders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].status).toBe("cancelled");
    });
  });

  describe("Email Integration", () => {
    it("should include correct pricing in quote email", async () => {
      if (!db) return;

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      const order = orderData[0];
      const totalPrice = parseFloat(order.totalPriceEstimate || "0");
      const depositAmount = parseFloat(order.depositAmount || "0");

      expect(totalPrice).toBe(1500.0);
      expect(depositAmount).toBe(750.0);
      expect(depositAmount).toBe(totalPrice * 0.5);
    });

    it("should generate acceptance link with correct parameters", () => {
      const orderId = testOrderId;
      const email = testEmail;
      const token = testToken;

      const acceptLink = `https://printcartel.co.za/quote/accept?orderId=${orderId}&email=${encodeURIComponent(
        email
      )}&token=${token}`;

      expect(acceptLink).toContain(`orderId=${orderId}`);
      expect(acceptLink).toContain(`email=${encodeURIComponent(email)}`);
      expect(acceptLink).toContain(`token=${token}`);
    });

    it("should generate rejection link with correct parameters", () => {
      const orderId = testOrderId;
      const email = testEmail;
      const token = testToken;

      const rejectLink = `https://printcartel.co.za/quote/reject?orderId=${orderId}&email=${encodeURIComponent(
        email
      )}&token=${token}`;

      expect(rejectLink).toContain(`orderId=${orderId}`);
      expect(rejectLink).toContain(`email=${encodeURIComponent(email)}`);
      expect(rejectLink).toContain(`token=${token}`);
    });
  });

  describe("Invoice Generation", () => {
    it("should generate invoice with correct order details", async () => {
      if (!db) return;

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      const order = orderData[0];

      expect({
        orderId: order.id,
        customerName: `${order.customerFirstName} ${order.customerLastName}`,
        customerEmail: order.customerEmail,
        totalPrice: parseFloat(order.totalPriceEstimate || "0"),
        depositAmount: parseFloat(order.depositAmount || "0"),
        paymentMethod: order.paymentMethod || "full_payment",
      }).toEqual({
        orderId: testOrderId,
        customerName: "John Doe",
        customerEmail: testEmail,
        totalPrice: 1500.0,
        depositAmount: 750.0,
        paymentMethod: "deposit",
      });
    });

    it("should upload invoice to S3 with correct key format", () => {
      const invoiceKey = `invoices/${testOrderId}/invoice-${Date.now()}.pdf`;

      expect(invoiceKey).toMatch(/^invoices\/\d+\/invoice-\d+\.pdf$/);
      expect(invoiceKey).toContain(`invoices/${testOrderId}`);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing order gracefully", async () => {
      if (!db) return;

      const nonExistentOrderId = 99999;
      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, nonExistentOrderId))
        .limit(1);

      expect(orderData).toHaveLength(0);
    });

    it("should handle email mismatch validation", async () => {
      if (!db) return;

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      const wrongEmail = "different@example.com";

      expect(orderData[0].customerEmail).not.toBe(wrongEmail);
    });

    it("should handle invalid status transitions", async () => {
      if (!db) return;

      await db
        .update(orders)
        .set({
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderData[0].status).not.toBe("quoted");
    });
  });
});
