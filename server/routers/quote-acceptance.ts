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
 * Quote acceptance router - handles customer quote acceptance/rejection
 */
export const quoteAcceptanceRouter = router({
  /**
   * Accept a quote and generate invoice
   */
  acceptQuote: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        customerEmail: z.string().email(),
        acceptanceToken: z.string(),
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
        if (order.customerEmail !== input.customerEmail) {
          throw new Error("Email does not match order");
        }

        // Verify order is in quoted status
        if (order.status !== "quoted") {
          throw new Error("Order is not in quoted status");
        }

        // Update order status to approved
        await db
          .update(orders)
          .set({
            status: "approved",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        // Generate invoice PDF
        const invoiceBuffer = await generateInvoicePDF(order.id);

        // Upload invoice to S3
        const invoiceKey = `invoices/${order.id}/invoice-${Date.now()}.pdf`;
        const { url: invoiceUrl } = await storagePut(
          invoiceKey,
          invoiceBuffer,
          "application/pdf"
        );

        // Update order with invoice URL
        await db
          .update(orders)
          .set({
            invoiceUrl,
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
          message: "Quote accepted successfully",
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
   */
  rejectQuote: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        customerEmail: z.string().email(),
        rejectionReason: z.string().min(10).max(500),
        acceptanceToken: z.string(),
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
        if (order.customerEmail !== input.customerEmail) {
          throw new Error("Email does not match order");
        }

        // Verify order is in quoted status
        if (order.status !== "quoted") {
          throw new Error("Order is not in quoted status");
        }

        // Update order status to cancelled
        await db
          .update(orders)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        // Send rejection email
        await sendQuoteRejectedEmail(
          order.customerEmail,
          `${order.customerFirstName} ${order.customerLastName}`,
          order.id,
          input.rejectionReason
        );

        return {
          success: true,
          message: "Quote rejected successfully",
          orderId: order.id,
        };
      } catch (error) {
        console.error("Error rejecting quote:", error);
        throw error;
      }
    }),

  /**
   * Get quote details for acceptance page
   */
  getQuoteDetails: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        customerEmail: z.string().email(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

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
        if (order.customerEmail !== input.customerEmail) {
          throw new Error("Email does not match order");
        }

        return {
          orderId: order.id,
          customerName: `${order.customerFirstName} ${order.customerLastName}`,
          customerEmail: order.customerEmail,
          totalPrice: parseFloat(order.totalPriceEstimate || "0"),
          depositAmount: parseFloat(order.depositAmount || "0"),
          paymentMethod: order.paymentMethod || "full_payment",
          quantity: order.quantity,
          status: order.status,
          createdAt: order.createdAt,
        };
      } catch (error) {
        console.error("Error fetching quote details:", error);
        throw error;
      }
    }),
});
