import { getDb } from "./db";
import { orders, paymentRecords } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendStatusUpdateEmail } from "./email";

/**
 * Check if an order has received full payment and auto-progress to in-production
 * This is called after payment records are updated
 */
export async function checkAndProgressOrder(orderId: number): Promise<{
  progressed: boolean;
  newStatus?: string;
  totalPaid?: number;
  totalPrice?: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available for auto-progression check");
      return { progressed: false };
    }

    // Fetch the order
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      console.error(`Order ${orderId} not found for auto-progression`);
      return { progressed: false };
    }

    const order = orderResult[0];

    // Only auto-progress if order is in "approved" status
    if (order.status !== "approved") {
      return { progressed: false };
    }

    // Calculate total amount paid for this order
    const allPayments = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.orderId, orderId));

    const totalPaid = allPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount as any),
      0
    );

    const totalPrice = parseFloat(order.totalPriceEstimate as any);

    // Check if full payment has been received
    if (totalPaid >= totalPrice) {
      // Update order status to in-production
      await db
        .update(orders)
        .set({
          status: "in-production",
          paymentStatus: "paid",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // Send status update email to customer
      try {
        await sendStatusUpdateEmail(
          order.id,
          order.customerEmail,
          order.customerFirstName,
          "in-production"
        );
      } catch (emailError) {
        console.error("Failed to send auto-progression email:", emailError);
        // Don't throw - order progression succeeded even if email fails
      }

      return {
        progressed: true,
        newStatus: "in-production",
        totalPaid,
        totalPrice,
      };
    }

    return { progressed: false, totalPaid, totalPrice };
  } catch (error) {
    console.error("Error in checkAndProgressOrder:", error);
    return { progressed: false };
  }
}

/**
 * Get auto-progression status for an order
 * Returns current payment status and whether order is eligible for progression
 */
export async function getProgressionStatus(orderId: number): Promise<{
  canProgress: boolean;
  currentStatus: string;
  totalPaid: number;
  totalPrice: number;
  remainingAmount: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orderResult[0];
    const totalPrice = parseFloat(order.totalPriceEstimate as any);

    // Calculate total amount paid
    const allPayments = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.orderId, orderId));

    const totalPaid = allPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount as any),
      0
    );

    const remainingAmount = Math.max(0, totalPrice - totalPaid);

    return {
      canProgress: order.status === "approved" && totalPaid >= totalPrice,
      currentStatus: order.status,
      totalPaid,
      totalPrice,
      remainingAmount,
    };
  } catch (error) {
    console.error("Error getting progression status:", error);
    throw error;
  }
}
