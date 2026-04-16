import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { orders, paymentRecords } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendStatusUpdateEmail } from "./email";
import { checkAndProgressOrder } from "./auto-progression";

/**
 * Verify and confirm a payment record
 * Updates payment status and optionally progresses order to in-production
 */
export const verifyPayment = protectedProcedure
  .input(
    z.object({
      paymentId: z.number().positive(),
      orderId: z.number().positive(),
      verificationNotes: z.string().optional(),
      progressToProduction: z.boolean().default(true),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch the payment record
      const payment = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.id, input.paymentId))
        .limit(1);

      if (payment.length === 0) {
        throw new Error("Payment record not found");
      }

      // Update payment record status to completed
      await db
        .update(paymentRecords)
        .set({
          paymentStatus: "completed",
          updatedAt: new Date(),
        })
        .where(eq(paymentRecords.id, input.paymentId));

      // Fetch the order
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      const currentOrder = order[0];

      // Calculate total amount paid
      const allPayments = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.orderId, input.orderId));

      const totalPaid = allPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount as any),
        0
      );

      const totalPrice = parseFloat(currentOrder.totalPriceEstimate as any);

      // Determine new payment status
      let newPaymentStatus = currentOrder.paymentStatus;
      if (totalPaid >= totalPrice) {
        newPaymentStatus = "paid";
      } else if (totalPaid > 0) {
        newPaymentStatus = "deposit_paid";
      }

      // Update order payment status and verification notes
      const updateData: any = {
        paymentStatus: newPaymentStatus,
        paymentVerificationStatus: "verified",
        paymentVerifiedAt: new Date(),
        amountPaid: totalPaid,
        updatedAt: new Date(),
      };

      if (input.verificationNotes) {
        updateData.paymentVerificationNotes = input.verificationNotes;
      }

      // Progress to production if requested and payment is complete
      if (input.progressToProduction && totalPaid >= totalPrice && currentOrder.status === "approved") {
        updateData.status = "in-production";
      }

      await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));

      // Send status update email to customer
      try {
        await sendStatusUpdateEmail(
          currentOrder.id,
          currentOrder.customerEmail,
          currentOrder.customerFirstName,
          input.progressToProduction && totalPaid >= totalPrice ? "in-production" : currentOrder.status
        );
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't throw - payment verification succeeded even if email fails
      }

      return {
        success: true,
        message: "Payment verified successfully",
        paymentStatus: newPaymentStatus,
        orderStatus: input.progressToProduction && totalPaid >= totalPrice ? "in-production" : currentOrder.status,
        totalPaid,
        totalPrice,
      };
    } catch (error) {
      console.error("Failed to verify payment:", error);
      throw error;
    }
  });

/**
 * Reject a payment record
 * Updates payment status to failed and adds rejection reason
 */
export const rejectPayment = protectedProcedure
  .input(
    z.object({
      paymentId: z.number().positive(),
      orderId: z.number().positive(),
      rejectionReason: z.string().min(10, "Rejection reason must be at least 10 characters"),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update payment record status to failed
      await db
        .update(paymentRecords)
        .set({
          paymentStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(paymentRecords.id, input.paymentId));

      // Fetch the order
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      const currentOrder = order[0];

      // Update order payment verification status
      await db
        .update(orders)
        .set({
          paymentVerificationStatus: "rejected",
          paymentVerificationNotes: input.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      // Send rejection email to customer
      try {
        await sendStatusUpdateEmail(
          currentOrder.id,
          currentOrder.customerEmail,
          currentOrder.customerFirstName,
          "cancelled"
        );
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      return {
        success: true,
        message: "Payment rejected successfully",
        rejectionReason: input.rejectionReason,
      };
    } catch (error) {
      console.error("Failed to reject payment:", error);
      throw error;
    }
  });

/**
 * Get reconciliation details for a specific order
 * Shows all payments, totals, and verification status
 */
export const getReconciliationDetails = protectedProcedure
  .input(z.object({ orderId: z.number().positive() }))
  .query(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch order
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      if (order.length === 0) {
        throw new Error("Order not found");
      }

      const currentOrder = order[0];

      // Fetch all payment records for this order
      const payments = await db
        .select()
        .from(paymentRecords)
        .where(eq(paymentRecords.orderId, input.orderId));

      // Calculate totals
      const totalPrice = parseFloat(currentOrder.totalPriceEstimate as any);
      const depositAmount = parseFloat(currentOrder.depositAmount as any) || 0;
      const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0);
      const remainingBalance = totalPrice - amountPaid;

      // Categorize payments
      const depositPayments = payments.filter((p) => p.paymentType === "deposit");
      const finalPayments = payments.filter((p) => p.paymentType === "final_payment");

      const depositPaid = depositPayments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0);
      const finalPaid = finalPayments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0);

      return {
        order: {
          id: currentOrder.id,
          customerName: `${currentOrder.customerFirstName} ${currentOrder.customerLastName}`,
          customerEmail: currentOrder.customerEmail,
          status: currentOrder.status,
          paymentStatus: currentOrder.paymentStatus,
          paymentVerificationStatus: currentOrder.paymentVerificationStatus,
          paymentVerificationNotes: currentOrder.paymentVerificationNotes,
          paymentVerifiedAt: currentOrder.paymentVerifiedAt,
        },
        financials: {
          totalPrice,
          depositAmount,
          amountPaid,
          remainingBalance,
          depositPaid,
          finalPaid,
          isFullyPaid: amountPaid >= totalPrice,
          isDepositPaid: depositPaid >= depositAmount,
        },
        payments: payments.map((p) => ({
          id: p.id,
          amount: parseFloat(p.amount as any),
          paymentMethod: p.paymentMethod,
          paymentStatus: p.paymentStatus,
          paymentType: p.paymentType,
          transactionId: p.transactionId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      };
    } catch (error) {
      console.error("Failed to fetch reconciliation details:", error);
      throw error;
    }
  });

/**
 * Bulk verify payments for multiple orders
 * Useful for batch processing confirmed payments
 */
export const bulkVerifyPayments = protectedProcedure
  .input(
    z.object({
      paymentIds: z.array(z.number().positive()).min(1),
      progressToProduction: z.boolean().default(true),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const paymentId of input.paymentIds) {
        try {
          // Fetch payment
          const payment = await db
            .select()
            .from(paymentRecords)
            .where(eq(paymentRecords.id, paymentId))
            .limit(1);

          if (payment.length === 0) {
            results.failed++;
            results.errors.push(`Payment ${paymentId} not found`);
            continue;
          }

          // Update payment status
          await db
            .update(paymentRecords)
            .set({
              paymentStatus: "completed",
              updatedAt: new Date(),
            })
            .where(eq(paymentRecords.id, paymentId));

          // Fetch order
          const order = await db
            .select()
            .from(orders)
            .where(eq(orders.id, payment[0].orderId))
            .limit(1);

          if (order.length === 0) {
            results.failed++;
            results.errors.push(`Order for payment ${paymentId} not found`);
            continue;
          }

          // Calculate totals and update order
          const allPayments = await db
            .select()
            .from(paymentRecords)
            .where(eq(paymentRecords.orderId, payment[0].orderId));

          const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount as any), 0);
          const totalPrice = parseFloat(order[0].totalPriceEstimate as any);

          let newPaymentStatus = order[0].paymentStatus;
          if (totalPaid >= totalPrice) {
            newPaymentStatus = "paid";
          } else if (totalPaid > 0) {
            newPaymentStatus = "deposit_paid";
          }

          const updateData: any = {
            paymentStatus: newPaymentStatus,
            paymentVerificationStatus: "verified",
            paymentVerifiedAt: new Date(),
            amountPaid: totalPaid,
            updatedAt: new Date(),
          };

          if (input.progressToProduction && totalPaid >= totalPrice && order[0].status === "approved") {
            updateData.status = "in-production";
          }

          await db.update(orders).set(updateData).where(eq(orders.id, payment[0].orderId));

          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing payment ${paymentId}: ${error}`);
        }
      }

      return {
        success: results.successful > 0,
        message: `Processed ${results.successful} successful, ${results.failed} failed`,
        ...results,
      };
    } catch (error) {
      console.error("Failed to bulk verify payments:", error);
      throw error;
    }
  });
