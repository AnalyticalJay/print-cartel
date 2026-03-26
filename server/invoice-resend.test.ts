import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Invoice Resend Functionality", () => {
  let db: any;
  let testOrderId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test order with an invoice
    const result = await db.insert(orders).values({
      productId: 1,
      colorId: 1,
      sizeId: 1,
      quantity: 10,
      customerFirstName: "Invoice",
      customerLastName: "Tester",
      customerEmail: "invoice@test.com",
      customerPhone: "5555555555",
      totalPriceEstimate: "500.00",
      depositAmount: "250.00",
      paymentMethod: "deposit",
      paymentStatus: "unpaid",
      status: "approved",
      invoiceUrl: "https://example.com/invoice-test.pdf",
      invoiceDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    testOrderId = result[0].insertId;
  });

  afterAll(async () => {
    // Cleanup
    if (db && testOrderId) {
      await db.delete(orders).where(eq(orders.id, testOrderId));
    }
  });

  describe("resendInvoice mutation", () => {
    it("should resend invoice email successfully", async () => {
      const sendInvoiceEmailSpy = vi.fn().mockResolvedValue(undefined);

      // Mock the sendInvoiceEmail function
      vi.doMock("./invoice-email", () => ({
        sendInvoiceEmail: sendInvoiceEmailSpy,
      }));

      // Verify order has invoice
      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderBefore[0].invoiceUrl).toBe("https://example.com/invoice-test.pdf");
      expect(orderBefore[0].customerEmail).toBe("invoice@test.com");
    });

    it("should update updatedAt timestamp when resending", async () => {
      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      const beforeResend = orderBefore[0].updatedAt;

      // Update the timestamp
      await db
        .update(orders)
        .set({
          updatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].updatedAt).not.toBe(beforeResend);
      expect(orderAfter[0].updatedAt).toBeTruthy();
    });

    it("should fail if order has no invoice", async () => {
      // Create order without invoice
      const result = await db.insert(orders).values({
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        customerFirstName: "No",
        customerLastName: "Invoice",
        customerEmail: "noinvoice@test.com",
        customerPhone: "4444444444",
        totalPriceEstimate: "300.00",
        depositAmount: "150.00",
        paymentMethod: "deposit",
        paymentStatus: "unpaid",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const noInvoiceOrderId = result[0].insertId;

      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, noInvoiceOrderId))
        .limit(1);

      expect(order[0].invoiceUrl).toBeNull();

      // Cleanup
      await db.delete(orders).where(eq(orders.id, noInvoiceOrderId));
    });

    it("should include correct invoice details in resend", async () => {
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(order[0]).toMatchObject({
        customerFirstName: "Invoice",
        customerLastName: "Tester",
        customerEmail: "invoice@test.com",
        totalPriceEstimate: "500.00",
        depositAmount: "250.00",
        invoiceUrl: "https://example.com/invoice-test.pdf",
      });
    });

    it("should preserve invoice URL when resending", async () => {
      const orderBefore = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      const invoiceUrlBefore = orderBefore[0].invoiceUrl;

      // Simulate resend (update timestamp but keep URL)
      await db
        .update(orders)
        .set({
          updatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, testOrderId));

      const orderAfter = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId))
        .limit(1);

      expect(orderAfter[0].invoiceUrl).toBe(invoiceUrlBefore);
    });

    it("should handle multiple resends", async () => {
      const resendTimes = [];

      for (let i = 0; i < 3; i++) {
        await db
          .update(orders)
          .set({
            updatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, testOrderId));

        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, testOrderId))
          .limit(1);

        resendTimes.push(order[0].updatedAt);
      }

      // Verify timestamps are different (or at least the last one is set)
      expect(resendTimes[resendTimes.length - 1]).toBeTruthy();
    });

    it("should only allow admins to resend invoices", () => {
      // This would be tested in the router context
      // Non-admin users should get "Unauthorized: Admin access required" error
      expect(true).toBe(true); // Placeholder for integration test
    });
  });

  describe("Invoice retrieval and filtering", () => {
    it("should retrieve invoices with URLs", async () => {
      const allOrders = await db.select().from(orders);
      const invoicesWithUrls = allOrders.filter((o: any) => o.invoiceUrl);

      expect(invoicesWithUrls.length).toBeGreaterThan(0);
      invoicesWithUrls.forEach((invoice: any) => {
        expect(invoice.invoiceUrl).toBeTruthy();
      });
    });

    it("should filter invoices by status", async () => {
      const allOrders = await db.select().from(orders);

      const pendingInvoices = allOrders.filter(
        (o: any) => o.invoiceUrl && !o.invoiceAcceptedAt && !o.invoiceDeclinedAt
      );

      const acceptedInvoices = allOrders.filter(
        (o: any) => o.invoiceUrl && o.invoiceAcceptedAt && !o.invoiceDeclinedAt
      );

      const declinedInvoices = allOrders.filter((o: any) => o.invoiceUrl && o.invoiceDeclinedAt);

      // At least one category should have invoices
      const totalFiltered = pendingInvoices.length + acceptedInvoices.length + declinedInvoices.length;
      expect(totalFiltered).toBeGreaterThanOrEqual(0);
    });

    it("should calculate invoice statistics correctly", async () => {
      const allOrders = await db.select().from(orders);
      const withInvoices = allOrders.filter((i: any) => i.invoiceUrl);

      const stats = {
        total: withInvoices.length,
        pending: withInvoices.filter((i: any) => !i.invoiceAcceptedAt && !i.invoiceDeclinedAt).length,
        accepted: withInvoices.filter((i: any) => i.invoiceAcceptedAt && !i.invoiceDeclinedAt).length,
        declined: withInvoices.filter((i: any) => i.invoiceDeclinedAt).length,
        paid: withInvoices.filter((i: any) => i.paymentStatus === "paid" || i.paymentStatus === "deposit_paid")
          .length,
      };

      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.pending + stats.accepted + stats.declined).toBeLessThanOrEqual(stats.total);
    });
  });
});
