import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Admin procedure to approve order and send invoice to customer
 */
export const approveAndSendInvoice = protectedProcedure
  .input(z.object({
    orderId: z.number(),
    adminNotes: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get order
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!orderResult.length) {
        throw new Error("Order not found");
      }

      const order = orderResult[0];

      // Generate invoice if not already generated
      let invoiceUrl = order.invoiceUrl;
      if (!invoiceUrl) {
        // Create invoice and upload
        const { createInvoice } = await import("./invoice");
        const invoiceData = await createInvoice(input.orderId);
        
        // Generate and upload invoice PDF
        const { generateAndUploadInvoice } = await import("./invoice-generator");
        invoiceUrl = await generateAndUploadInvoice({
          orderId: order.id,
          invoiceNumber: invoiceData.invoiceNumber,
          totalPrice: invoiceData.totalAmount,
          depositAmount: invoiceData.depositAmount,
          paymentMethod: order.paymentMethod || "full_payment",
        });
      }

      // Update order status to approved and store invoice URL
      await db
        .update(orders)
        .set({
          status: "approved",
          invoiceUrl,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      // Send invoice email to customer
      const { sendInvoiceEmail } = await import("./invoice-email");
      await sendInvoiceEmail({
        customerEmail: order.customerEmail,
        customerName: `${order.customerFirstName} ${order.customerLastName}`,
        orderId: order.id,
        invoicePdfUrl: invoiceUrl,
        totalPrice: parseFloat(order.totalPriceEstimate as any),
        depositAmount: parseFloat(order.depositAmount as any) || parseFloat(order.totalPriceEstimate as any) * 0.5,
        paymentMethod: order.paymentMethod || "full_payment",
      });

      return {
        success: true,
        message: "Invoice approved and sent to customer",
        invoiceUrl,
      };
    } catch (error) {
      console.error("Failed to approve and send invoice:", error);
      throw error;
    }
  });
