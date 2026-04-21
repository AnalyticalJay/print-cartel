import { describe, it, expect } from "vitest";
import {
  generatePaymentReceiptHTML,
  generatePaymentReceiptText,
  type PaymentReceiptData,
} from "./payment-receipt-email";
import {
  addToEmailQueue,
  getPendingEmails,
  updateEmailQueueStatus,
  getEmailQueueStats,
  cleanupEmailQueue,
} from "./email-retry-queue";

describe("Payment Receipt Email System", () => {
  const testReceiptData: PaymentReceiptData = {
    orderId: 12345,
    invoiceNumber: "INV-12345",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    paymentDate: "21 April 2026, 10:30",
    paymentMethod: "payfast",
    amountPaid: 500.0,
    totalOrderAmount: 1000.0,
    remainingBalance: 500.0,
    garmentType: "T-Shirt",
    quantity: 50,
    color: "Black",
    size: "Medium",
    deliveryMethod: "delivery",
    deliveryAddress: "123 Main Street, Johannesburg",
    estimatedDeliveryDate: "28 April 2026",
    printSpecifications: {
      placement: "Front Center",
      size: "A4",
      colors: 3,
    },
    orderNotes: "Rush order - priority processing",
  };

  describe("Payment Receipt HTML Template", () => {
    it("should generate valid HTML receipt", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
      expect(html).toContain(testReceiptData.invoiceNumber);
      expect(html).toContain(testReceiptData.customerName);
    });

    it("should include all payment details", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("Payment Received");
      expect(html).toContain(`R${testReceiptData.amountPaid.toFixed(2)}`);
      expect(html).toContain(testReceiptData.paymentDate);
      expect(html).toContain("PayFast");
    });

    it("should include order summary", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain(testReceiptData.garmentType);
      expect(html).toContain(testReceiptData.quantity.toString());
      expect(html).toContain(testReceiptData.color);
      expect(html).toContain(testReceiptData.size);
    });

    it("should include invoice details", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("Invoice");
      expect(html).toContain(`R${testReceiptData.totalOrderAmount.toFixed(2)}`);
      expect(html).toContain(`R${testReceiptData.remainingBalance.toFixed(2)}`);
    });

    it("should include delivery information", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("Delivery Information");
      expect(html).toContain(testReceiptData.deliveryAddress);
      expect(html).toContain(testReceiptData.estimatedDeliveryDate);
    });

    it("should include print specifications", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("Print Specifications");
      expect(html).toContain(testReceiptData.printSpecifications.placement);
      expect(html).toContain(testReceiptData.printSpecifications.size);
      expect(html).toContain(testReceiptData.printSpecifications.colors.toString());
    });

    it("should include production timeline", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("Production Timeline");
      expect(html).toContain("Payment Confirmed");
      expect(html).toContain("Design Review");
      expect(html).toContain("Production");
      expect(html).toContain("Delivery");
    });

    it("should include support contact information", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("support@printcartel.co.za");
      expect(html).toContain("Need help?");
    });

    it("should show full payment status when no balance remaining", () => {
      const data = { ...testReceiptData, remainingBalance: 0 };
      const html = generatePaymentReceiptHTML(data);

      expect(html).toContain("Fully Paid");
      expect(html).toContain("✓");
    });

    it("should show partial payment status when balance remaining", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("Amount Due");
      expect(html).toContain(`R${testReceiptData.remainingBalance.toFixed(2)}`);
    });

    it("should handle order notes", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain(testReceiptData.orderNotes);
    });

    it("should handle missing optional fields gracefully", () => {
      const minimalData: PaymentReceiptData = {
        orderId: 1,
        invoiceNumber: "INV-1",
        customerName: "Test",
        customerEmail: "test@example.com",
        paymentDate: "Today",
        paymentMethod: "payfast",
        amountPaid: 100,
        totalOrderAmount: 100,
        remainingBalance: 0,
        garmentType: "Shirt",
        quantity: 1,
        deliveryMethod: "delivery",
        estimatedDeliveryDate: "Tomorrow",
      };

      const html = generatePaymentReceiptHTML(minimalData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain(minimalData.invoiceNumber);
    });
  });

  describe("Payment Receipt Text Template", () => {
    it("should generate valid text receipt", () => {
      const text = generatePaymentReceiptText(testReceiptData);

      expect(text).toContain("PRINT CARTEL");
      expect(text).toContain("PAYMENT RECEIPT");
      expect(text).toContain(testReceiptData.invoiceNumber);
    });

    it("should include all payment details in text", () => {
      const text = generatePaymentReceiptText(testReceiptData);

      expect(text).toContain("PAYMENT DETAILS");
      expect(text).toContain("PayFast");
      expect(text).toContain(`R${testReceiptData.amountPaid.toFixed(2)}`);
    });

    it("should include order summary in text", () => {
      const text = generatePaymentReceiptText(testReceiptData);

      expect(text).toContain("ORDER SUMMARY");
      expect(text).toContain(testReceiptData.garmentType);
      expect(text).toContain(testReceiptData.quantity.toString());
    });

    it("should include production timeline in text", () => {
      const text = generatePaymentReceiptText(testReceiptData);

      expect(text).toContain("PRODUCTION TIMELINE");
      expect(text).toContain("Design Review");
      expect(text).toContain("Production");
    });
  });

  describe("Email Retry Queue", () => {
    it("should add email to queue and return ID", () => {
      cleanupEmailQueue(-1);
      const id = addToEmailQueue({
        recipientEmail: "test@example.com",
        emailType: "payment_receipt",
        subject: "Payment Receipt",
        htmlContent: "<html></html>",
        textContent: "Text",
        receiptData: testReceiptData,
        retryCount: 0,
        maxRetries: 3,
        nextRetryTime: new Date(),
        status: "pending",
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^email-\d+-\d+$/);
    });

    it("should retrieve pending emails with past retry time", () => {
      cleanupEmailQueue(-1);
      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000);

      addToEmailQueue({
        recipientEmail: "test1@example.com",
        emailType: "payment_receipt",
        subject: "Receipt 1",
        htmlContent: "<html></html>",
        textContent: "Text",
        receiptData: testReceiptData,
        retryCount: 0,
        maxRetries: 3,
        nextRetryTime: pastTime,
        status: "pending",
      });

      const pending = getPendingEmails();
      expect(pending.length).toBeGreaterThan(0);
      const hasTest1 = pending.some((e) => e.recipientEmail === "test1@example.com");
      expect(hasTest1).toBe(true);
    });

    it("should update email status correctly", () => {
      cleanupEmailQueue(-1);
      const id = addToEmailQueue({
        recipientEmail: "test@example.com",
        emailType: "payment_receipt",
        subject: "Receipt",
        htmlContent: "<html></html>",
        textContent: "Text",
        receiptData: testReceiptData,
        retryCount: 0,
        maxRetries: 3,
        nextRetryTime: new Date(),
        status: "pending",
      });

      updateEmailQueueStatus(id, "sent");
      const item = getPendingEmails().find((e) => e.id === id);
      expect(item).toBeUndefined();
    });

    it("should return queue statistics", () => {
      cleanupEmailQueue(-1);
      addToEmailQueue({
        recipientEmail: "test1@example.com",
        emailType: "payment_receipt",
        subject: "Receipt 1",
        htmlContent: "<html></html>",
        textContent: "Text",
        receiptData: testReceiptData,
        retryCount: 0,
        maxRetries: 3,
        nextRetryTime: new Date(),
        status: "pending",
      });

      const stats = getEmailQueueStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.sent).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
    });

    it("should clean up completed emails", () => {
      cleanupEmailQueue(-1);
      addToEmailQueue({
        recipientEmail: "test@example.com",
        emailType: "payment_receipt",
        subject: "Receipt",
        htmlContent: "<html></html>",
        textContent: "Text",
        receiptData: testReceiptData,
        retryCount: 0,
        maxRetries: 3,
        nextRetryTime: new Date(),
        status: "sent",
      });

      const cleaned = cleanupEmailQueue(-1);
      expect(cleaned).toBeGreaterThan(0);
    });
  });

  describe("Email Content Validation", () => {
    it("should include clickable order status link", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("View Order Status");
      expect(html).toContain(`orderId=${testReceiptData.orderId}`);
    });

    it("should format currency correctly", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("R500.00");
      expect(html).toContain("R1000.00");
    });

    it("should include responsive email design", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("viewport");
      expect(html).toContain("max-width");
    });

    it("should include professional styling", () => {
      const html = generatePaymentReceiptHTML(testReceiptData);

      expect(html).toContain("<style>");
      expect(html).toContain("font-family");
      expect(html).toContain("background-color");
    });
  });

  describe("Different Payment Methods", () => {
    it("should handle PayFast payment method", () => {
      const data = { ...testReceiptData, paymentMethod: "payfast" as const };
      const html = generatePaymentReceiptHTML(data);

      expect(html).toContain("PayFast");
    });

    it("should handle bank transfer payment method", () => {
      const data = { ...testReceiptData, paymentMethod: "bank_transfer" as const };
      const html = generatePaymentReceiptHTML(data);

      expect(html).toContain("Bank Transfer");
    });

    it("should handle EFT payment method", () => {
      const data = { ...testReceiptData, paymentMethod: "eft" as const };
      const html = generatePaymentReceiptHTML(data);

      expect(html).toContain("EFT");
    });
  });

  describe("Delivery Methods", () => {
    it("should show delivery address for delivery method", () => {
      const data = { ...testReceiptData, deliveryMethod: "delivery" as const };
      const html = generatePaymentReceiptHTML(data);

      expect(html).toContain("Delivery Address");
      expect(html).toContain(testReceiptData.deliveryAddress);
    });

    it("should show collection info for collection method", () => {
      const data = { ...testReceiptData, deliveryMethod: "collection" as const };
      const html = generatePaymentReceiptHTML(data);

      expect(html).toContain("Collection Method");
      expect(html).toContain("pickup");
    });
  });
});
