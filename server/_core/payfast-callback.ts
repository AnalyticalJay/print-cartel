import { Request, Response } from "express";
import { verifyPayFastSignature, extractOrderIdFromPayment, isPaymentSuccessful } from "../payfast-service";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Handle PayFast callback/notification
 * This is called by PayFast after payment is processed
 */
export async function handlePayFastCallback(req: Request, res: Response) {
  try {
    const data = req.body;

    // Verify signature
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    if (!passphrase) {
      console.error("PayFast passphrase not configured");
      res.status(500).json({ error: "Configuration error" });
      return;
    }

    // Build data object for signature verification (must be in specific order)
    const signatureData: Record<string, string> = {
      m_payment_id: data.m_payment_id || "",
      pf_payment_id: data.pf_payment_id || "",
      payment_status: data.payment_status || "",
      item_name: data.item_name || "",
      item_description: data.item_description || "",
      amount_gross: data.amount_gross || "",
      amount_fee: data.amount_fee || "",
      amount_net: data.amount_net || "",
      custom_str1: data.custom_str1 || "",
      custom_str2: data.custom_str2 || "",
      custom_str3: data.custom_str3 || "",
      custom_str4: data.custom_str4 || "",
      custom_str5: data.custom_str5 || "",
      custom_int1: data.custom_int1 || "",
      custom_int2: data.custom_int2 || "",
      custom_int3: data.custom_int3 || "",
      custom_int4: data.custom_int4 || "",
      custom_int5: data.custom_int5 || "",
      name_first: data.name_first || "",
      name_last: data.name_last || "",
      email_address: data.email_address || "",
      merchant_id: data.merchant_id || "",
    };

    const isValid = verifyPayFastSignature(signatureData, data.signature || "", passphrase);

    if (!isValid) {
      console.error("Invalid PayFast signature");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    // Extract order ID
    const orderId = extractOrderIdFromPayment(data.m_payment_id);
    if (!orderId) {
      console.error("Invalid payment ID format:", data.m_payment_id);
      res.status(400).json({ error: "Invalid payment ID" });
      return;
    }

    // Check if payment is successful
    if (isPaymentSuccessful(data.payment_status)) {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      const providerAmount = Number.parseFloat(String(data.amount_gross));
      const checkoutEstimate = Number.parseFloat(String(order.totalPriceEstimate));
      if (!Number.isFinite(providerAmount) || providerAmount < 0) {
        res.status(400).json({ error: "Invalid payment amount" });
        return;
      }

      // The order total is the checkout snapshot used by invoices and remaining-balance logic.
      // Never overwrite it with callback data; flag any amount mismatch for manual review instead.
      if (!Number.isFinite(checkoutEstimate) || Math.abs(providerAmount - checkoutEstimate) > 0.01) {
        await db
          .update(orders)
          .set({
            paymentVerificationStatus: "pending",
            paymentVerificationNotes: `PayFast amount ${providerAmount.toFixed(2)} does not match checkout estimate ${Number.isFinite(checkoutEstimate) ? checkoutEstimate.toFixed(2) : "unavailable"}. Manual review required.`,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
        console.error(`PayFast amount mismatch for order ${orderId}`);
        res.status(200).json({ success: false, message: "Payment amount requires review" });
        return;
      }

      if (order.paymentStatus === "paid" && Math.abs(Number.parseFloat(String(order.amountPaid ?? 0)) - providerAmount) <= 0.01) {
        res.status(200).json({ success: true, message: "Payment already processed" });
        return;
      }

      await db
        .update(orders)
        .set({
          status: "approved",
          paymentStatus: "paid",
          amountPaid: providerAmount.toFixed(2),
          paymentVerificationStatus: "verified",
          paymentVerifiedAt: new Date(),
          paymentVerificationNotes: "PayFast amount matched the checkout estimate.",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`Payment successful for order ${orderId}`);
      res.status(200).json({ success: true, message: "Payment processed" });
    } else {
      console.log(`Payment failed for order ${orderId}. Status: ${data.payment_status}`);
      res.status(200).json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Error handling PayFast callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Verify PayFast payment (for ITN verification)
 * PayFast requires verification that the callback was received
 */
export async function verifyPayFastPayment(req: Request, res: Response) {
  try {
    // Send verification back to PayFast
    res.status(200).send("VERIFIED");
  } catch (error) {
    console.error("Error verifying PayFast payment:", error);
    res.status(500).send("FAILED");
  }
}
