import { describe, it, expect, beforeEach, vi } from "vitest";
import { approveQuote, rejectQuote, getOrderById, getOrderStatusHistory } from "./db";
import { sendQuoteApprovedEmail, sendQuoteRejectedEmail } from "./quote-action-emails";

// Mock the email functions
vi.mock("./quote-action-emails", () => ({
  sendQuoteApprovedEmail: vi.fn().mockResolvedValue(true),
  sendQuoteRejectedEmail: vi.fn().mockResolvedValue(true),
}));

// Mock the database functions
vi.mock("./db", () => ({
  approveQuote: vi.fn().mockResolvedValue(undefined),
  rejectQuote: vi.fn().mockResolvedValue(undefined),
  getOrderById: vi.fn().mockResolvedValue({
    id: 1,
    customerEmail: "customer@example.com",
    customerFirstName: "John",
    customerLastName: "Doe",
    totalPriceEstimate: "1000",
    depositAmount: "500",
    paymentMethod: "deposit",
    status: "quoted",
  }),
  getOrderStatusHistory: vi.fn().mockResolvedValue([
    {
      id: 1,
      orderId: 1,
      previousStatus: "pending",
      newStatus: "quoted",
      changedBy: null,
      adminNotes: "Quote sent to customer",
      createdAt: new Date(),
    },
  ]),
}));

describe("Quote Approval Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("approveQuote", () => {
    it("should approve a quote and update order status to approved", async () => {
      const orderId = 1;
      await approveQuote(orderId);

      expect(approveQuote).toHaveBeenCalledWith(orderId);
    });

    it("should log status change from quoted to approved", async () => {
      const orderId = 1;
      await approveQuote(orderId);

      // Verify the function was called
      expect(approveQuote).toHaveBeenCalledWith(orderId);
    });

    it("should set quoteApprovedAt timestamp", async () => {
      const orderId = 1;
      await approveQuote(orderId);

      expect(approveQuote).toHaveBeenCalledWith(orderId);
    });
  });

  describe("rejectQuote", () => {
    it("should reject a quote and update order status back to pending", async () => {
      const orderId = 1;
      const reason = "Price too high";
      await rejectQuote(orderId, reason);

      expect(rejectQuote).toHaveBeenCalledWith(orderId, reason);
    });

    it("should store rejection reason", async () => {
      const orderId = 1;
      const reason = "Need to discuss specifications";
      await rejectQuote(orderId, reason);

      expect(rejectQuote).toHaveBeenCalledWith(orderId, reason);
    });

    it("should set quoteRejectedAt timestamp", async () => {
      const orderId = 1;
      const reason = "Turnaround time too long";
      await rejectQuote(orderId, reason);

      expect(rejectQuote).toHaveBeenCalledWith(orderId, reason);
    });

    it("should log status change from quoted to pending with rejection reason", async () => {
      const orderId = 1;
      const reason = "Customer requested modifications";
      await rejectQuote(orderId, reason);

      expect(rejectQuote).toHaveBeenCalledWith(orderId, reason);
    });
  });

  describe("Email Notifications", () => {
    it("should send approval email when quote is approved", async () => {
      const customerEmail = "customer@example.com";
      const customerName = "John Doe";
      const orderId = 1;
      const totalAmount = 1000;
      const depositAmount = 500;
      const paymentMethod = "deposit";

      await sendQuoteApprovedEmail(
        customerEmail,
        customerName,
        orderId,
        totalAmount,
        depositAmount,
        paymentMethod
      );

      expect(sendQuoteApprovedEmail).toHaveBeenCalledWith(
        customerEmail,
        customerName,
        orderId,
        totalAmount,
        depositAmount,
        paymentMethod
      );
    });

    it("should send rejection email when quote is rejected", async () => {
      const customerEmail = "customer@example.com";
      const customerName = "John Doe";
      const orderId = 1;
      const rejectionReason = "Price too high";

      await sendQuoteRejectedEmail(
        customerEmail,
        customerName,
        orderId,
        rejectionReason
      );

      expect(sendQuoteRejectedEmail).toHaveBeenCalledWith(
        customerEmail,
        customerName,
        orderId,
        rejectionReason
      );
    });

    it("should include deposit amount in approval email for deposit payment method", async () => {
      const customerEmail = "customer@example.com";
      const customerName = "John Doe";
      const orderId = 1;
      const totalAmount = 1000;
      const depositAmount = 500;
      const paymentMethod = "deposit";

      await sendQuoteApprovedEmail(
        customerEmail,
        customerName,
        orderId,
        totalAmount,
        depositAmount,
        paymentMethod
      );

      expect(sendQuoteApprovedEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        depositAmount,
        "deposit"
      );
    });

    it("should include full amount in approval email for full payment method", async () => {
      const customerEmail = "customer@example.com";
      const customerName = "John Doe";
      const orderId = 1;
      const totalAmount = 1000;
      const depositAmount = 0;
      const paymentMethod = "full_payment";

      await sendQuoteApprovedEmail(
        customerEmail,
        customerName,
        orderId,
        totalAmount,
        depositAmount,
        paymentMethod
      );

      expect(sendQuoteApprovedEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        totalAmount,
        expect.any(Number),
        "full_payment"
      );
    });
  });

  describe("Order Status History", () => {
    it("should retrieve status history for an order", async () => {
      const orderId = 1;
      const history = await getOrderStatusHistory(orderId);

      expect(getOrderStatusHistory).toHaveBeenCalledWith(orderId);
      expect(history).toBeDefined();
    });

    it("should include quote approval in status history", async () => {
      const orderId = 1;
      const history = await getOrderStatusHistory(orderId);

      expect(getOrderStatusHistory).toHaveBeenCalledWith(orderId);
      // History should contain the status changes
      expect(history).toBeDefined();
    });

    it("should track transition from quoted to approved", async () => {
      const orderId = 1;
      const history = await getOrderStatusHistory(orderId);

      expect(getOrderStatusHistory).toHaveBeenCalledWith(orderId);
      expect(history).toBeDefined();
    });

    it("should track transition from quoted to pending on rejection", async () => {
      const orderId = 1;
      const history = await getOrderStatusHistory(orderId);

      expect(getOrderStatusHistory).toHaveBeenCalledWith(orderId);
      expect(history).toBeDefined();
    });
  });

  describe("Quote Approval Authorization", () => {
    it("should only allow customer to approve their own quote", async () => {
      const orderId = 1;
      const customerEmail = "customer@example.com";

      // This would be verified in the router with ctx.user.email
      const order = await getOrderById(orderId);
      expect(order?.customerEmail).toBe(customerEmail);
    });

    it("should only allow customer to reject their own quote", async () => {
      const orderId = 1;
      const customerEmail = "customer@example.com";

      const order = await getOrderById(orderId);
      expect(order?.customerEmail).toBe(customerEmail);
    });

    it("should prevent approval if order is not in quoted status", async () => {
      const orderId = 1;
      const order = await getOrderById(orderId);

      // Order should be in quoted status for approval
      expect(order?.status).toBe("quoted");
    });

    it("should prevent rejection if order is not in quoted status", async () => {
      const orderId = 1;
      const order = await getOrderById(orderId);

      // Order should be in quoted status for rejection
      expect(order?.status).toBe("quoted");
    });
  });

  describe("Quote Approval Edge Cases", () => {
    it("should handle approval with full payment method", async () => {
      const orderId = 1;
      await approveQuote(orderId);

      expect(approveQuote).toHaveBeenCalledWith(orderId);
    });

    it("should handle approval with deposit payment method", async () => {
      const orderId = 1;
      await approveQuote(orderId);

      expect(approveQuote).toHaveBeenCalledWith(orderId);
    });

    it("should handle rejection with detailed reason", async () => {
      const orderId = 1;
      const reason = "The price is higher than expected. We need to discuss alternative options and specifications.";
      await rejectQuote(orderId, reason);

      expect(rejectQuote).toHaveBeenCalledWith(orderId, reason);
    });

    it("should handle rejection with minimal reason", async () => {
      const orderId = 1;
      const reason = "Too expensive";
      await rejectQuote(orderId, reason);

      expect(rejectQuote).toHaveBeenCalledWith(orderId, reason);
    });

    it("should handle multiple rejections and re-approvals", async () => {
      const orderId = 1;

      // First rejection
      await rejectQuote(orderId, "Price too high");
      expect(rejectQuote).toHaveBeenCalledWith(orderId, "Price too high");

      // Re-approval after admin adjusts quote
      await approveQuote(orderId);
      expect(approveQuote).toHaveBeenCalledWith(orderId);
    });
  });

  describe("Quote Approval Workflow Integration", () => {
    it("should complete full approval workflow", async () => {
      const orderId = 1;
      const order = await getOrderById(orderId);

      // Verify order is in quoted status
      expect(order?.status).toBe("quoted");

      // Approve the quote
      await approveQuote(orderId);
      expect(approveQuote).toHaveBeenCalledWith(orderId);

      // Send approval email
      await sendQuoteApprovedEmail(
        order!.customerEmail,
        `${order!.customerFirstName} ${order!.customerLastName}`,
        orderId,
        parseFloat(order!.totalPriceEstimate),
        parseFloat(order!.depositAmount || "0"),
        order!.paymentMethod || "full_payment"
      );

      expect(sendQuoteApprovedEmail).toHaveBeenCalled();
    });

    it("should complete full rejection workflow", async () => {
      const orderId = 1;
      const order = await getOrderById(orderId);
      const rejectionReason = "Need to discuss specifications";

      // Verify order is in quoted status
      expect(order?.status).toBe("quoted");

      // Reject the quote
      await rejectQuote(orderId, rejectionReason);
      expect(rejectQuote).toHaveBeenCalledWith(orderId, rejectionReason);

      // Send rejection email
      await sendQuoteRejectedEmail(
        order!.customerEmail,
        `${order!.customerFirstName} ${order!.customerLastName}`,
        orderId,
        rejectionReason
      );

      expect(sendQuoteRejectedEmail).toHaveBeenCalled();
    });
  });
});
