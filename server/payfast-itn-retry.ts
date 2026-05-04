import { db } from "../drizzle/client";
import { payFastItnRetryQueue, orders } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { verifyPayFastSignature } from "./payfast-service";

/**
 * PayFast ITN Retry Service
 * Handles retry logic for failed ITN callbacks with exponential backoff
 */
export class PayFastItnRetryService {
  private static readonly MAX_RETRIES = 5;
  private static readonly BASE_RETRY_DELAY_MS = 60000; // 1 minute
  private static readonly MAX_RETRY_DELAY_MS = 86400000; // 24 hours

  /**
   * Calculate next retry time with exponential backoff
   * Formula: min(baseDelay * 2^attemptCount, maxDelay) + random jitter (0-10%)
   */
  private static calculateNextRetryTime(attemptCount: number): Date {
    const exponentialDelay = Math.min(
      this.BASE_RETRY_DELAY_MS * Math.pow(2, attemptCount),
      this.MAX_RETRY_DELAY_MS
    );

    // Add random jitter (0-10%) to prevent thundering herd
    const jitter = exponentialDelay * (Math.random() * 0.1);
    const totalDelay = exponentialDelay + jitter;

    return new Date(Date.now() + totalDelay);
  }

  /**
   * Add ITN to retry queue when initial processing fails
   */
  static async queueForRetry(
    orderId: number,
    transactionId: string,
    itnData: Record<string, any>,
    failureReason?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const nextRetryAt = this.calculateNextRetryTime(0);

      await db.insert(payFastItnRetryQueue).values({
        orderId,
        transactionId,
        itnData,
        status: "pending",
        attemptCount: 0,
        maxAttempts: this.MAX_RETRIES,
        nextRetryAt,
        lastErrorMessage: errorMessage,
        failureReason: (failureReason as any) || "unknown_error",
      });

      console.log(
        `[PayFast ITN Retry] Queued order ${orderId} (txn: ${transactionId}) for retry at ${nextRetryAt.toISOString()}`
      );
    } catch (error) {
      console.error(
        `[PayFast ITN Retry] Failed to queue retry for order ${orderId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process all pending retries that are due
   * Called by scheduled task or manual trigger
   */
  static async processPendingRetries(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const stats = { processed: 0, successful: 0, failed: 0 };

    try {
      // Find all pending retries that are due for processing
      const dueRetries = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(
          and(
            eq(payFastItnRetryQueue.status, "pending"),
            lt(payFastItnRetryQueue.nextRetryAt, new Date())
          )
        )
        .limit(50); // Process max 50 at a time to avoid overload

      console.log(
        `[PayFast ITN Retry] Found ${dueRetries.length} pending retries due for processing`
      );

      for (const retry of dueRetries) {
        stats.processed++;

        try {
          // Mark as processing
          await db
            .update(payFastItnRetryQueue)
            .set({
              status: "processing",
              lastAttemptAt: new Date(),
            })
            .where(eq(payFastItnRetryQueue.id, retry.id));

          // Attempt to process the ITN
          const success = await this.processItnRetry(retry);

          if (success) {
            // Mark as completed
            await db
              .update(payFastItnRetryQueue)
              .set({
                status: "completed",
                lastAttemptAt: new Date(),
              })
              .where(eq(payFastItnRetryQueue.id, retry.id));

            stats.successful++;
            console.log(
              `[PayFast ITN Retry] Successfully processed retry for order ${retry.orderId}`
            );
          } else {
            // Schedule next retry
            await this.scheduleNextRetry(retry);
            stats.failed++;
          }
        } catch (error) {
          console.error(
            `[PayFast ITN Retry] Error processing retry for order ${retry.orderId}:`,
            error
          );
          await this.scheduleNextRetry(retry, String(error));
          stats.failed++;
        }
      }

      console.log(
        `[PayFast ITN Retry] Processed ${stats.processed} retries: ${stats.successful} successful, ${stats.failed} failed`
      );
    } catch (error) {
      console.error("[PayFast ITN Retry] Fatal error in processPendingRetries:", error);
    }

    return stats;
  }

  /**
   * Process a single ITN retry
   */
  private static async processItnRetry(
    retry: typeof payFastItnRetryQueue.$inferSelect
  ): Promise<boolean> {
    try {
      const itnData = retry.itnData as Record<string, any>;

      // Verify signature using the canonical PHP-encoded implementation
      const { signature: receivedSig, ...notifData } = itnData;
      const isValidSignature = verifyPayFastSignature(
        notifData,
        receivedSig,
        process.env.PAYFAST_PASSPHRASE || ""
      );

      if (!isValidSignature) {
        throw new Error("Invalid ITN signature");
      }

      // Update order payment status based on ITN
      const paymentStatus = itnData.payment_status === "COMPLETE" ? "paid" : "unpaid";
      const amount = itnData.amount_gross ? parseFloat(itnData.amount_gross) : 0;

      await db
        .update(orders)
        .set({
          paymentStatus,
          amountPaid: amount.toString(),
        })
        .where(eq(orders.id, retry.orderId));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[PayFast ITN Retry] Failed to process ITN for order ${retry.orderId}: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Schedule next retry for a failed attempt
   */
  private static async scheduleNextRetry(
    retry: typeof payFastItnRetryQueue.$inferSelect,
    errorMessage?: string
  ): Promise<void> {
    const nextAttemptCount = retry.attemptCount + 1;

    if (nextAttemptCount >= retry.maxAttempts) {
      // Max retries exceeded - mark as failed and abandoned
      await db
        .update(payFastItnRetryQueue)
        .set({
          status: "abandoned",
          lastAttemptAt: new Date(),
          lastErrorMessage: errorMessage || retry.lastErrorMessage,
          failureReason: "unknown_error",
        })
        .where(eq(payFastItnRetryQueue.id, retry.id));

      console.warn(
        `[PayFast ITN Retry] Abandoned retry for order ${retry.orderId} after ${nextAttemptCount} attempts`
      );

      // TODO: Send alert to admin about abandoned payment
      return;
    }

    // Calculate next retry time
    const nextRetryAt = this.calculateNextRetryTime(nextAttemptCount);

    await db
      .update(payFastItnRetryQueue)
      .set({
        status: "pending",
        attemptCount: nextAttemptCount,
        nextRetryAt,
        lastAttemptAt: new Date(),
        lastErrorMessage: errorMessage || retry.lastErrorMessage,
      })
      .where(eq(payFastItnRetryQueue.id, retry.id));

    console.log(
      `[PayFast ITN Retry] Scheduled retry ${nextAttemptCount}/${retry.maxAttempts} for order ${retry.orderId} at ${nextRetryAt.toISOString()}`
    );
  }

  /**
   * Get retry statistics for monitoring
   */
  static async getRetryStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    abandoned: number;
    totalRetries: number;
  } | null> {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      abandoned: 0,
      totalRetries: 0,
    };

    try {
      const allRetries = await db.select().from(payFastItnRetryQueue);

      stats.totalRetries = allRetries.length;

      for (const retry of allRetries) {
        switch (retry.status) {
          case "pending":
            stats.pending++;
            break;
          case "processing":
            stats.processing++;
            break;
          case "completed":
            stats.completed++;
            break;
          case "failed":
            stats.failed++;
            break;
          case "abandoned":
            stats.abandoned++;
            break;
        }
      }
    } catch (error) {
      console.error("[PayFast ITN Retry] Error getting retry stats:", error);
    }

    return stats;
  }

  /**
   * Manually retry a specific failed ITN
   * Useful for admin intervention
   */
  static async manualRetry(retryId: number): Promise<boolean> {
    try {
      const retry = await db
        .select()
        .from(payFastItnRetryQueue)
        .where(eq(payFastItnRetryQueue.id, retryId))
        .limit(1);

      if (retry.length === 0) {
        throw new Error(`Retry record not found: ${retryId}`);
      }

      const retryRecord = retry[0];

      // Reset to pending for immediate retry
      const nextRetryAt = this.calculateNextRetryTime(0);

      await db
        .update(payFastItnRetryQueue)
        .set({
          status: "pending",
          attemptCount: 0,
          nextRetryAt,
          lastErrorMessage: null,
        })
        .where(eq(payFastItnRetryQueue.id, retryId));

      console.log(
        `[PayFast ITN Retry] Manually reset retry ${retryId} for order ${retryRecord.orderId}`
      );

      return true;
    } catch (error) {
      console.error("[PayFast ITN Retry] Error in manualRetry:", error);
      throw error;
    }
  }
}
