/**
 * Email Retry Queue
 * Manages failed email delivery attempts with exponential backoff
 */

import { sendPaymentReceiptEmail } from "./send-payment-receipt";
import type { PaymentReceiptData } from "./payment-receipt-email";

export interface EmailQueueItem {
  id: string;
  recipientEmail: string;
  emailType: "payment_receipt" | "order_confirmation" | "design_approval" | "status_update";
  subject: string;
  htmlContent: string;
  textContent: string;
  receiptData?: PaymentReceiptData;
  retryCount: number;
  maxRetries: number;
  nextRetryTime: Date;
  status: "pending" | "sent" | "failed";
  error?: string;
  createdAt: Date;
  sentAt?: Date;
}

// In-memory queue for email retry logic
const emailRetryQueue: Map<string, EmailQueueItem> = new Map();
let queueId = 0;

/**
 * Add email to retry queue
 */
export function addToEmailQueue(
  item: Omit<EmailQueueItem, "id" | "createdAt">
): string {
  const id = `email-${++queueId}-${Date.now()}`;
  const queueItem: EmailQueueItem = {
    ...item,
    id,
    createdAt: new Date(),
  };

  emailRetryQueue.set(id, queueItem);
  console.log(
    `✓ Email added to retry queue: ${item.recipientEmail} (Type: ${item.emailType}, ID: ${id})`
  );

  return id;
}

/**
 * Get pending emails from queue
 */
export function getPendingEmails(): EmailQueueItem[] {
  const now = new Date();
  const pending: EmailQueueItem[] = [];

  emailRetryQueue.forEach((item) => {
    if (item.status === "pending" && item.nextRetryTime <= now) {
      pending.push(item);
    }
  });

  return pending;
}

/**
 * Update email queue item status
 */
export function updateEmailQueueStatus(
  id: string,
  status: "pending" | "sent" | "failed",
  error?: string,
  nextRetryTime?: Date
): void {
  const item = emailRetryQueue.get(id);
  if (!item) {
    console.warn(`Email queue item ${id} not found`);
    return;
  }

  item.status = status;
  item.error = error;
  item.nextRetryTime = nextRetryTime || new Date();
  if (status === "sent") {
    item.sentAt = new Date();
  }

  console.log(`✓ Email queue item ${id} updated: ${status}`);
}

/**
 * Process email retry queue
 */
export async function processEmailRetryQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  try {
    const pendingEmails = getPendingEmails();

    if (pendingEmails.length === 0) {
      console.log("No pending emails in retry queue");
      return { processed: 0, sent: 0, failed: 0 };
    }

    console.log(`Processing ${pendingEmails.length} pending emails from retry queue`);

    let sent = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        if (email.emailType === "payment_receipt" && email.receiptData) {
          const result = await sendPaymentReceiptEmail(
            email.recipientEmail,
            email.receiptData
          );

          if (result.success) {
            updateEmailQueueStatus(email.id, "sent");
            sent++;
            console.log(`✓ Email sent from queue: ${email.recipientEmail}`);
          } else {
            // Calculate next retry time with exponential backoff
            const nextRetryTime = calculateNextRetryTime(
              email.retryCount,
              email.maxRetries
            );

            if (email.retryCount < email.maxRetries) {
              email.retryCount++;
              updateEmailQueueStatus(
                email.id,
                "pending",
                result.error,
                nextRetryTime
              );
              console.log(
                `⚠ Email retry scheduled for ${email.recipientEmail} (Attempt ${email.retryCount}/${email.maxRetries})`
              );
            } else {
              updateEmailQueueStatus(
                email.id,
                "failed",
                `Max retries exceeded: ${result.error}`
              );
              console.error(
                `✗ Email failed permanently for ${email.recipientEmail}: ${result.error}`
              );
              failed++;
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Error processing email ${email.id}:`, errorMessage);

        const nextRetryTime = calculateNextRetryTime(
          email.retryCount,
          email.maxRetries
        );

        if (email.retryCount < email.maxRetries) {
          email.retryCount++;
          updateEmailQueueStatus(
            email.id,
            "pending",
            errorMessage,
            nextRetryTime
          );
        } else {
          updateEmailQueueStatus(
            email.id,
            "failed",
            `Max retries exceeded: ${errorMessage}`
          );
          failed++;
        }
      }
    }

    console.log(
      `✓ Email retry queue processed: ${sent} sent, ${failed} failed, ${pendingEmails.length - sent - failed} rescheduled`
    );

    return {
      processed: pendingEmails.length,
      sent,
      failed,
    };
  } catch (error) {
    console.error("Failed to process email retry queue:", error);
    return { processed: 0, sent: 0, failed: 0 };
  }
}

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetryTime(
  retryCount: number,
  maxRetries: number
): Date {
  const baseDelay = 60000; // 1 minute
  const maxDelay = 86400000; // 24 hours
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(2, retryCount),
    maxDelay
  );

  const nextRetry = new Date();
  nextRetry.setTime(nextRetry.getTime() + exponentialDelay);

  return nextRetry;
}

/**
 * Get queue statistics
 */
export function getEmailQueueStats(): {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  avgRetries: number;
} {
  const allItems = Array.from(emailRetryQueue.values());

  const pending = allItems.filter((item) => item.status === "pending").length;
  const sent = allItems.filter((item) => item.status === "sent").length;
  const failed = allItems.filter((item) => item.status === "failed").length;

  const avgRetries =
    allItems.length > 0
      ? allItems.reduce((sum, item) => sum + item.retryCount, 0) /
        allItems.length
      : 0;

  return {
    total: allItems.length,
    pending,
    sent,
    failed,
    avgRetries: Math.round(avgRetries * 100) / 100,
  };
}

/**
 * Clean up old completed emails from queue (older than 30 days)
 */
export function cleanupEmailQueue(daysOld: number = 30): number {
  let cleaned = 0;

  if (daysOld < 0) {
    emailRetryQueue.forEach((item, id) => {
      if (item.status === "sent" || item.status === "failed") {
        emailRetryQueue.delete(id);
        cleaned++;
      }
    });
    console.log(`✓ Cleaned up ${cleaned} completed emails from queue`);
  } else {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    emailRetryQueue.forEach((item, id) => {
      if (
        (item.status === "sent" || item.status === "failed") &&
        item.createdAt < cutoffDate
      ) {
        emailRetryQueue.delete(id);
        cleaned++;
      }
    });

    console.log(
      `✓ Cleaned up ${cleaned} old emails from queue (older than ${daysOld} days)`
    );
  }

  return cleaned;
}

/**
 * Get email queue item by ID
 */
export function getEmailQueueItem(id: string): EmailQueueItem | undefined {
  return emailRetryQueue.get(id);
}

/**
 * Get all email queue items
 */
export function getAllEmailQueueItems(): EmailQueueItem[] {
  return Array.from(emailRetryQueue.values());
}
