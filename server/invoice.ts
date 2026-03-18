import { getDb } from "./db";
import { orders, paymentRecords } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `INV-${timestamp}-${random}`;
}

/**
 * Calculate deposit amount (50% of total)
 */
export function calculateDepositAmount(totalPrice: number): number {
  return Math.round((totalPrice * 0.5) * 100) / 100;
}

/**
 * Create invoice for an order
 */
export async function createInvoice(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const invoiceNumber = generateInvoiceNumber();
  const invoiceDate = new Date();

  // Update order with invoice details
  await db
    .update(orders)
    .set({
      invoiceNumber,
      invoiceDate,
    })
    .where(eq(orders.id, orderId));

  return {
    invoiceNumber,
    invoiceDate,
    orderId,
    customerEmail: order.customerEmail,
    customerName: `${order.customerFirstName} ${order.customerLastName}`,
    totalAmount: parseFloat(order.totalPriceEstimate.toString()),
    depositAmount: calculateDepositAmount(
      parseFloat(order.totalPriceEstimate.toString())
    ),
    deliveryCharge: parseFloat(order.deliveryCharge?.toString() || "0"),
  };
}

/**
 * Record a payment for an order
 */
export async function recordPayment(
  orderId: number,
  amount: number,
  paymentMethod: string,
  paymentType: "deposit" | "final_payment",
  transactionId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert payment record
  const result = await db.insert(paymentRecords).values({
    orderId,
    amount: amount.toString(),
    paymentMethod,
    paymentType,
    transactionId,
    paymentStatus: "completed",
  });

  // Get order to calculate new totals
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const currentAmountPaid = parseFloat(order.amountPaid?.toString() || "0");
  const newAmountPaid = currentAmountPaid + amount;
  const totalPrice = parseFloat(order.totalPriceEstimate.toString());

  // Determine new payment status
  let newPaymentStatus: "unpaid" | "deposit_paid" | "paid" | "cancelled" =
    "unpaid";

  if (newAmountPaid >= totalPrice) {
    newPaymentStatus = "paid";
  } else if (newAmountPaid >= calculateDepositAmount(totalPrice)) {
    newPaymentStatus = "deposit_paid";
  }

  // Update order payment status
  await db
    .update(orders)
    .set({
      amountPaid: newAmountPaid.toString(),
      paymentStatus: newPaymentStatus,
    })
    .where(eq(orders.id, orderId));

  return {
    newPaymentStatus,
    amountPaid: newAmountPaid,
    remainingBalance: Math.max(0, totalPrice - newAmountPaid),
  };
}

/**
 * Get payment status for an order
 */
export async function getPaymentStatus(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const totalPrice = parseFloat(order.totalPriceEstimate.toString());
  const amountPaid = parseFloat(order.amountPaid?.toString() || "0");
  const depositAmount = calculateDepositAmount(totalPrice);

  return {
    orderId,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalPrice,
    depositAmount,
    amountPaid,
    remainingBalance: Math.max(0, totalPrice - amountPaid),
    isDepositPaid: amountPaid >= depositAmount,
    isFullyPaid: amountPaid >= totalPrice,
  };
}

/**
 * Get payment history for an order
 */
export async function getPaymentHistory(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const payments = await db.query.paymentRecords.findMany({
    where: eq(paymentRecords.orderId, orderId),
  });

  return payments.sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
