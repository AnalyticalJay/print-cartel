import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders, paymentRecords } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PayFastIntegration } from "../payfast-integration";
import { sendPaymentConfirmationEmail } from "../payment-confirmation-email";
import { sendPaymentReceiptEmailWithRetry } from "../send-payment-receipt";
import { checkAndProgressOrder } from "../auto-progression";

// Helper function to get PayFast integration with current env vars
function getPayFastIntegration() {
  return new PayFastIntegration({
    merchantId: process.env.PAYFAST_MERCHANT_ID || "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
    passphrase: process.env.PAYFAST_PASSPHRASE || "",
    isSandbox: process.env.PAYFAST_SANDBOX === "true",
  });
}

export const paymentRouter = router({
  // Initiate PayFast payment
  initiatePayFastPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number().positive(),
        returnUrl: z.string().url(),
        cancelUrl: z.string().url(),
        notifyUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Fetch order
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const order = orderResult[0];

        // Verify order belongs to current user
        if (order.customerEmail !== ctx.user?.email) {
          throw new Error("Unauthorized: Order does not belong to this user");
        }

        // Generate payment URL with fresh PayFast instance
        const payfast = getPayFastIntegration();
        const paymentUrl = payfast.getPaymentUrl({
          orderId: input.orderId,
          amount: input.amount,
          customerEmail: order.customerEmail,
          customerFirstName: order.customerFirstName || "Customer",
          customerLastName: order.customerLastName || ".",
          itemName: `Invoice for Order #${input.orderId}`,
          itemDescription: `Payment for DTF printing order`,
          returnUrl: input.returnUrl,
          cancelUrl: input.cancelUrl,
          notifyUrl: input.notifyUrl,
        });

        return {
          success: true,
          paymentUrl,
        };
      } catch (error) {
        console.error("Failed to initiate PayFast payment:", error);
        throw error;
      }
    }),

  // Record manual payment submission
  submitManualPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number().positive(),
        paymentMethod: z.enum(["bank_transfer", "eft", "other"]),
        proofFileName: z.string(),
        proofFileUrl: z.string().url(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Fetch order
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const order = orderResult[0];

        // Verify order belongs to current user
        if (order.customerEmail !== ctx.user?.email) {
          throw new Error("Unauthorized: Order does not belong to this user");
        }

        // Update order with payment verification info
        await db
          .update(orders)
          .set({
            paymentVerificationStatus: "pending",
            paymentVerificationNotes: `${input.paymentMethod} payment submitted. Proof: ${input.proofFileUrl}. ${input.notes || ""}`,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));

        console.log(
          `✓ Manual payment submitted for order ${input.orderId}: ${input.amount} ZAR via ${input.paymentMethod}`
        );

        return {
          success: true,
          message: "Payment proof submitted successfully. Admin will verify within 24 hours.",
        };
      } catch (error) {
        console.error("Failed to submit manual payment:", error);
        throw error;
      }
    }),

  // Get payment status for order
  getPaymentStatus: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const order = orderResult[0];

        // Verify order belongs to current user
        if (order.customerEmail !== ctx.user?.email) {
          throw new Error("Unauthorized: Order does not belong to this user");
        }

        return {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          amountPaid: order.amountPaid,
          totalAmount: parseFloat(order.totalPriceEstimate),
          depositAmount: order.depositAmount,
          remainingBalance:
            parseFloat(order.totalPriceEstimate) - (parseFloat(order.amountPaid || "0") || 0),
          verificationStatus: order.paymentVerificationStatus,
          verificationNotes: order.paymentVerificationNotes,
        };
      } catch (error) {
        console.error("Failed to get payment status:", error);
        throw error;
      }
    }),

  // Verify PayFast notification (webhook)
  verifyPayFastNotification: protectedProcedure
    .input(
      z.object({
        m_payment_id: z.string(),
        pf_payment_id: z.string(),
        payment_status: z.string(),
        amount_gross: z.string(),
        signature: z.string(),
        custom_int1: z.string(),
        custom_str1: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify signature
        const payfast = getPayFastIntegration();
        const isValid = payfast.verifyNotificationSignature(input as any);
        if (!isValid) {
          console.error("Invalid PayFast signature");
          return { success: false, error: "Invalid signature" };
        }

        const orderId = parseInt(input.custom_int1);
        const customerEmail = input.custom_str1;

        // Fetch order
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!orderResult.length) {
          console.error(`Order ${orderId} not found`);
          return { success: false, error: "Order not found" };
        }

        const order = orderResult[0];

        // Verify email matches
        if (order.customerEmail !== customerEmail) {
          console.error(`Email mismatch for order ${orderId}`);
          return { success: false, error: "Email mismatch" };
        }

        // Update payment status if successful
        if (input.payment_status === "COMPLETE") {
          const paidAmount = parseFloat(input.amount_gross);

          await db
            .update(orders)
            .set({
              paymentStatus: "paid",
              amountPaid: paidAmount.toString(),
              paymentVerificationStatus: "verified",
              paymentVerificationNotes: `PayFast payment verified: ${paidAmount} ZAR`,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          // Check if order should auto-progress to in-production
          try {
            const progressionResult = await checkAndProgressOrder(orderId);
            if (progressionResult.progressed) {
              console.log(`✓ Order ${orderId} auto-progressed to in-production after payment`);
            }
          } catch (progressionError) {
            console.error("Error during auto-progression:", progressionError);
            // Don't fail the payment verification if auto-progression fails
          }

          // Send payment receipt email to customer with retry logic
          try {
            const totalAmount = parseFloat(order.totalPriceEstimate);
            const remainingBalance = Math.max(0, totalAmount - paidAmount);
            const estimatedDeliveryDate = new Date();
            estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

            await sendPaymentReceiptEmailWithRetry(
              order.customerEmail,
              {
                orderId,
                invoiceNumber: `INV-${orderId}`,
                customerName: `${order.customerFirstName} ${order.customerLastName}`,
                customerEmail: order.customerEmail,
                paymentDate: new Date().toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                paymentMethod: "payfast",
                amountPaid: paidAmount,
                totalOrderAmount: totalAmount,
                remainingBalance,
                garmentType: "Custom Apparel",
                quantity: order.quantity || 1,
                color: undefined,
                size: undefined,
                deliveryMethod: (order.deliveryMethod as "delivery" | "collection") || "delivery",
                deliveryAddress: order.deliveryAddress || undefined,
                estimatedDeliveryDate: estimatedDeliveryDate.toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              }
            );
            console.log(`✓ Payment receipt email sent to ${order.customerEmail}`);
          } catch (emailError) {
            console.error(`Failed to send payment receipt email for order ${orderId}:`, emailError);
          }

          console.log(`✓ Payment verified for order ${orderId}: ${paidAmount} ZAR`);
        }

        return { success: true };
      } catch (error) {
        console.error("PayFast notification verification error:", error);
        return { success: false, error: "Verification failed" };
      }
    }),

  // Store payment method selection
  recordPaymentMethod: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentMethod: z.enum(["payfast", "eft", "bank_transfer"]),
        amount: z.number().positive(),
        paymentType: z.enum(["deposit", "final_payment"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify order exists and belongs to user
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!orderResult.length) {
          throw new Error("Order not found");
        }

        const order = orderResult[0];
        if (order.customerEmail !== ctx.user?.email) {
          throw new Error("Unauthorized: Order does not belong to this user");
        }

        // Insert payment record with selected method
        const result = await db.insert(paymentRecords).values({
          orderId: input.orderId,
          amount: input.amount.toString(),
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          paymentType: input.paymentType,
        });

        return {
          success: true,
          message: `Payment method ${input.paymentMethod} recorded for order #${input.orderId}`,
        };
      } catch (error) {
        console.error("Error recording payment method:", error);
        throw new Error("Failed to record payment method");
      }
    }),
});
