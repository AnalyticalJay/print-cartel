import { getDb } from "./db";

/**
 * Email retry configuration
 */
export const EMAIL_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000, // 1 second
  MAX_DELAY_MS: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
};

/**
 * Email queue for tracking failed emails and retries
 */
interface EmailQueueItem {
  id: string;
  type: "order_confirmation" | "status_update" | "design_approval" | "payment_reminder";
  recipientEmail: string;
  subject: string;
  data: Record<string, any>;
  retryCount: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;
  error?: string;
  createdAt: Date;
}

const emailQueue: Map<string, EmailQueueItem> = new Map();

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = EMAIL_RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(EMAIL_RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);
  return Math.min(delay, EMAIL_RETRY_CONFIG.MAX_DELAY_MS);
}

/**
 * Add email to retry queue
 */
export function addToEmailRetryQueue(
  type: EmailQueueItem["type"],
  recipientEmail: string,
  subject: string,
  data: Record<string, any>,
  error?: string
): string {
  const id = `${type}-${recipientEmail}-${Date.now()}`;
  
  const queueItem: EmailQueueItem = {
    id,
    type,
    recipientEmail,
    subject,
    data,
    retryCount: 0,
    error,
    createdAt: new Date(),
    nextRetryAt: new Date(Date.now() + calculateBackoffDelay(0)),
  };

  emailQueue.set(id, queueItem);
  console.log(`Email added to retry queue: ${id}`);

  return id;
}

/**
 * Get next email to retry
 */
export function getNextEmailToRetry(): EmailQueueItem | null {
  const now = new Date();
  
  for (const [, item] of emailQueue) {
    if (
      item.retryCount < EMAIL_RETRY_CONFIG.MAX_RETRIES &&
      item.nextRetryAt &&
      item.nextRetryAt <= now
    ) {
      return item;
    }
  }

  return null;
}

/**
 * Mark email retry as successful
 */
export function markEmailRetrySuccess(id: string): void {
  emailQueue.delete(id);
  console.log(`Email retry successful and removed from queue: ${id}`);
}

/**
 * Mark email retry as failed and schedule next retry
 */
export function markEmailRetryFailed(id: string, error: string): void {
  const item = emailQueue.get(id);
  if (!item) return;

  item.retryCount++;
  item.lastRetryAt = new Date();
  item.error = error;

  if (item.retryCount >= EMAIL_RETRY_CONFIG.MAX_RETRIES) {
    console.error(`Email retry exhausted (${item.retryCount} attempts): ${id}`, error);
    // Keep in queue for manual review but mark as exhausted
    item.nextRetryAt = undefined;
  } else {
    const delay = calculateBackoffDelay(item.retryCount);
    item.nextRetryAt = new Date(Date.now() + delay);
    console.log(`Email retry scheduled for ${item.nextRetryAt.toISOString()}: ${id}`);
  }
}

/**
 * Get email retry queue status
 */
export function getEmailRetryQueueStatus() {
  const total = emailQueue.size;
  const pending = Array.from(emailQueue.values()).filter(
    (item) => item.retryCount < EMAIL_RETRY_CONFIG.MAX_RETRIES && item.nextRetryAt
  ).length;
  const exhausted = Array.from(emailQueue.values()).filter(
    (item) => item.retryCount >= EMAIL_RETRY_CONFIG.MAX_RETRIES
  ).length;

  return {
    total,
    pending,
    exhausted,
    items: Array.from(emailQueue.values()),
  };
}

/**
 * Clear email retry queue (for testing)
 */
export function clearEmailRetryQueue(): void {
  emailQueue.clear();
  console.log("Email retry queue cleared");
}

/**
 * Wrap email sending with retry logic
 */
export async function sendEmailWithRetry<T>(
  emailType: EmailQueueItem["type"],
  recipientEmail: string,
  subject: string,
  data: Record<string, any>,
  sendFn: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const result = await sendFn();
    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send ${emailType} email to ${recipientEmail}:`, errorMessage);

    // Add to retry queue
    addToEmailRetryQueue(emailType, recipientEmail, subject, data, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Process email retry queue (should be called periodically)
 */
export async function processEmailRetryQueue(
  emailSenders: Record<string, (data: any) => Promise<void>>
): Promise<{ processed: number; successful: number; failed: number }> {
  let processed = 0;
  let successful = 0;
  let failed = 0;

  let item = getNextEmailToRetry();
  while (item) {
    processed++;
    
    try {
      const sender = emailSenders[item.type];
      if (!sender) {
        throw new Error(`No email sender found for type: ${item.type}`);
      }

      await sender(item.data);
      markEmailRetrySuccess(item.id);
      successful++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      markEmailRetryFailed(item.id, errorMessage);
      failed++;
    }

    item = getNextEmailToRetry();
  }

  if (processed > 0) {
    console.log(`Email retry queue processed: ${processed} total, ${successful} successful, ${failed} failed`);
  }

  return { processed, successful, failed };
}
