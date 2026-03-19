import { storagePut, storageGet } from "./storage";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Upload payment proof document to S3 and update order record
 */
export async function uploadPaymentProof(
  orderId: number,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ url: string; key: string }> {
  try {
    // Generate unique file key with timestamp and random suffix
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileKey = `payment-proofs/${orderId}/${timestamp}-${randomSuffix}-${fileName}`;

    // Upload to S3
    const { url, key } = await storagePut(fileKey, fileBuffer, mimeType);

    // Update order with payment proof URL
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(orders)
      .set({
        paymentProofUrl: url,
        paymentProofUploadedAt: new Date(),
        paymentVerificationStatus: "pending",
      })
      .where(eq(orders.id, orderId));

    return { url, key };
  } catch (error) {
    console.error("Failed to upload payment proof:", error);
    throw new Error("Failed to upload payment proof");
  }
}

/**
 * Get payment proof URL for download
 */
export async function getPaymentProofUrl(orderId: number, expiresIn?: number): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0 || !order[0].paymentProofUrl) {
      return null;
    }

    // If URL is already a full S3 URL, return it as-is
    if (order[0].paymentProofUrl.startsWith("http")) {
      return order[0].paymentProofUrl;
    }

    // Otherwise, get presigned URL
    const { url } = await storageGet(order[0].paymentProofUrl, expiresIn);
    return url;
  } catch (error) {
    console.error("Failed to get payment proof URL:", error);
    return null;
  }
}

/**
 * Verify payment proof and update order status
 */
export async function verifyPaymentProof(
  orderId: number,
  verified: boolean,
  notes?: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updateData: any = {
      paymentVerificationStatus: verified ? "verified" : "rejected",
      paymentVerifiedAt: new Date(),
      paymentVerificationNotes: notes || null,
    };

    // If verified, update payment status to paid
    if (verified) {
      updateData.paymentStatus = "paid";
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));
  } catch (error) {
    console.error("Failed to verify payment proof:", error);
    throw new Error("Failed to verify payment proof");
  }
}

/**
 * Get payment proof details for an order
 */
export async function getPaymentProofDetails(orderId: number): Promise<{
  url: string | null;
  uploadedAt: Date | null;
  status: string;
  verifiedAt: Date | null;
  notes: string | null;
} | null> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return null;
    }

    const o = order[0];
    return {
      url: o.paymentProofUrl || null,
      uploadedAt: o.paymentProofUploadedAt || null,
      status: o.paymentVerificationStatus || "pending",
      verifiedAt: o.paymentVerifiedAt || null,
      notes: o.paymentVerificationNotes || null,
    };
  } catch (error) {
    console.error("Failed to get payment proof details:", error);
    return null;
  }
}
