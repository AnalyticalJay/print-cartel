import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { buildPayFastPaymentUrl } from "../payfast-service";
import { getOrderById } from "../db";

export const payfastRouter = router({
  /**
   * Generate PayFast payment URL for an order
   */
  generatePaymentUrl: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number().positive(),
        returnUrl: z.string().url(),
        cancelUrl: z.string().url(),
        notifyUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify order belongs to user
        const order = await getOrderById(input.orderId);
        if (!order || order.customerEmail !== ctx.user.email) {
          throw new Error("Unauthorized: Order not found or does not belong to user");
        }

        // Get PayFast credentials from environment
        const merchantId = process.env.PAYFAST_MERCHANT_ID;
        const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
        const passphrase = process.env.PAYFAST_PASSPHRASE;

        if (!merchantId || !merchantKey || !passphrase) {
          throw new Error("PayFast credentials not configured");
        }

        // Build payment URL
        const paymentUrl = buildPayFastPaymentUrl(
          {
            merchantId,
            merchantKey,
            passphrase,
            sandbox: process.env.NODE_ENV === "development",
          },
          {
            orderId: input.orderId,
            amount: input.amount,
            customerEmail: order.customerEmail,
            customerName: `${order.customerFirstName || ""} ${order.customerLastName || ""}`.trim() || "Customer",
            description: `Print Cartel Order #${input.orderId}`,
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
            notifyUrl: input.notifyUrl,
          }
        );

        return { paymentUrl };
      } catch (error) {
        console.error("Failed to generate PayFast URL:", error);
        throw error;
      }
    }),

  /**
   * Verify PayFast callback and update order status
   */
  handleCallback: protectedProcedure
    .input(
      z.object({
        m_payment_id: z.string(),
        pf_payment_id: z.string(),
        payment_status: z.string(),
        amount_gross: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { verifyPayFastSignature, extractOrderIdFromPayment, isPaymentSuccessful } =
          await import("../payfast-service");

        // Verify signature
        const passphrase = process.env.PAYFAST_PASSPHRASE;
        if (!passphrase) {
          throw new Error("PayFast passphrase not configured");
        }

        const isValid = verifyPayFastSignature(
          {
            m_payment_id: input.m_payment_id,
            pf_payment_id: input.pf_payment_id,
            payment_status: input.payment_status,
            amount_gross: input.amount_gross,
          },
          input.signature,
          passphrase
        );

        if (!isValid) {
          throw new Error("Invalid PayFast signature");
        }

        // Extract order ID
        const orderId = extractOrderIdFromPayment(input.m_payment_id);
        if (!orderId) {
          throw new Error("Invalid payment ID format");
        }

        // Check if payment is successful
        if (isPaymentSuccessful(input.payment_status)) {
          return {
            success: true,
            orderId,
            paymentStatus: input.payment_status,
            message: "Payment verified successfully",
          };
        } else {
          return {
            success: false,
            orderId,
            paymentStatus: input.payment_status,
            message: "Payment not completed",
          };
        }
      } catch (error) {
        console.error("Failed to handle PayFast callback:", error);
        throw error;
      }
    }),
});
