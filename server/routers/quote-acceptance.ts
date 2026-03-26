import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateInvoicePDF } from "../invoice-service";
import { storagePut } from "../storage";
import { sendInvoiceEmail } from "../invoice-email";
import { sendQuoteRejectedEmail } from "../quote-action-emails";

/**
 * Quote acceptance router - handles customer quote acceptance/rejection from dashboard
 */
export const quoteAcceptanceRouter = router({
  /**
   * Accept a quote and generate invoice
   * Called from customer dashboard when they accept a pending quote
   */
  acceptQuote: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Fetch the order
        const orderData = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (orderData.length === 0) {
          throw new Error("Order not found");
        }

        const order = orderData[0];

        // Verify email matches
        if (order.customerEmail !== input.email) {
          throw new Error("Email does not match order");
        }

        // Verify order is in pending status (customer accepts from dashboard)
        if (order.status !== "pending") {
          throw new Error("Order is not in pending status");
        }

        // Generate invoice PDF
        const invoiceBuffer = await generateInvoicePDF(order.id);

        // Upload invoice to S3
        const invoiceKey = `invoices/${order.id}/invoice-${Date.now()}.pdf`;
        const { url: invoiceUrl } = await storagePut(
          invoiceKey,
          invoiceBuffer,
          "application/pdf"
        );

        // Update order with invoice URL and status to approved
        await db
          .update(orders)
          .set({
            status: "approved",
            invoiceUrl,
            invoiceAcceptedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        // Send invoice email with PDF attachment
        await sendInvoiceEmail({
          orderId: order.id,
          customerEmail: order.customerEmail,
          customerName: `${order.customerFirstName} ${order.customerLastName}`,
          totalPrice: parseFloat(order.totalPriceEstimate || "0"),
          depositAmount: parseFloat(order.depositAmount || "0"),
          paymentMethod: order.paymentMethod || "full_payment",
          invoicePdfUrl: invoiceUrl,
        });

        return {
          success: true,
          message: "Quote accepted successfully. Invoice sent to your email.",
          orderId: order.id,
          invoiceUrl,
        };
      } catch (error) {
        console.error("Error accepting quote:", error);
        throw error;
      }
    }),

  /**
   * Reject a quote
   * Called from customer dashboard when they decline a pending quote
   */
  rejectQuote: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        email: z.string().email(),
        reason: z.string().min(10).max(500),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Fetch the order
        const orderData = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (orderData.length === 0) {
          throw new Error("Order not found");
        }

        const order = orderData[0];

        // Verify email matches
        if (order.customerEmail !== input.email) {
          throw new Error("Email does not match order");
        }

        // Verify order is in pending status
        if (order.status !== "pending") {
          throw new Error("Order is not in pending status");
        }

        // Update order status to cancelled with rejection reason
        await db
          .update(orders)
          .set({
            status: "cancelled",
            invoiceDeclinedAt: new Date(),
            invoiceDeclineReason: input.reason,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        // Send rejection notification email
        await sendQuoteRejectedEmail(
          order.customerEmail,
          `${order.customerFirstName} ${order.customerLastName}`,
          order.id,
          input.reason
        );

        return {
          success: true,
          message: "Quote declined. We will follow up with you soon.",
          orderId: order.id,
        };
      } catch (error) {
        console.error("Error rejecting quote:", error);
        throw error;
      }
    }),

  /**
   * Get quote details for a customer
   * Used to display quote information on dashboard
   */
  getQuoteDetails: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        email: z.string().email(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Fetch the order
        const orderData = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (orderData.length === 0) {
          throw new Error("Order not found");
        }

        const order = orderData[0];

        // Verify email matches
        if (order.customerEmail !== input.email) {
          throw new Error("Email does not match order");
        }

        return {
          id: order.id,
          status: order.status,
          customerName: `${order.customerFirstName} ${order.customerLastName}`,
          customerEmail: order.customerEmail,
          quantity: order.quantity,
          totalPrice: parseFloat(order.totalPriceEstimate || "0"),
          depositAmount: parseFloat(order.depositAmount || "0"),
          paymentMethod: order.paymentMethod,
          invoiceUrl: order.invoiceUrl,
          createdAt: order.createdAt,
        };
      } catch (error) {
        console.error("Error fetching quote details:", error);
        throw error;
      }
    }),
});
