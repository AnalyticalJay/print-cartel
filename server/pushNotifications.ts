import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Configure web-push with VAPID keys
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPrivateKey && vapidPublicKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: number,
  payload: PushNotificationPayload
) {
  if (!vapidPrivateKey || !vapidPublicKey) {
    console.warn("Push notifications not configured - VAPID keys missing");
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available for push notifications");
      return { success: false, error: "Database unavailable" };
    }

    // Get all active push subscriptions for the user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.isActive && sub.endpoint
    );

    if (activeSubscriptions.length === 0) {
      console.log(`No active push subscriptions for user ${userId}`);
      return { success: false, error: "No active subscriptions" };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/logo.png",
      badge: payload.badge || "/logo.png",
      tag: payload.tag || "notification",
      url: payload.url || "/",
      requireInteraction: payload.requireInteraction || false,
    });

    const results = await Promise.allSettled(
      activeSubscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          notificationPayload
        )
      )
    );

    // Handle failed subscriptions
    const failedIndices = results
      .map((result, index) =>
        result.status === "rejected" ? index : -1
      )
      .filter((index) => index !== -1);

    // Mark failed subscriptions as inactive
    for (const index of failedIndices) {
      const failedSub = activeSubscriptions[index];
      if (failedSub) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, failedSub.id));
      }
    }

    const successCount = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    console.log(
      `Push notifications sent: ${successCount}/${activeSubscriptions.length} successful`
    );

    return {
      success: true,
      sent: successCount,
      failed: failedIndices.length,
    };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send push notification to all admins
 */
export async function sendPushNotificationToAllAdmins(
  payload: PushNotificationPayload
) {
  if (!vapidPrivateKey || !vapidPublicKey) {
    console.warn("Push notifications not configured - VAPID keys missing");
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available for push notifications");
      return { success: false, error: "Database unavailable" };
    }

    // Get all active push subscriptions for all users
    const subscriptions = await db.select().from(pushSubscriptions);

    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.isActive && sub.endpoint
    );

    if (activeSubscriptions.length === 0) {
      console.log("No active push subscriptions for admins");
      return { success: false, error: "No active subscriptions" };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/logo.png",
      badge: payload.badge || "/logo.png",
      tag: payload.tag || "notification",
      url: payload.url || "/",
      requireInteraction: payload.requireInteraction || false,
    });

    const results = await Promise.allSettled(
      activeSubscriptions.map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          notificationPayload
        )
      )
    );

    // Handle failed subscriptions
    const failedIndices = results
      .map((result, index) =>
        result.status === "rejected" ? index : -1
      )
      .filter((index) => index !== -1);

    // Mark failed subscriptions as inactive
    for (const index of failedIndices) {
      const failedSub = activeSubscriptions[index];
      if (failedSub) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, failedSub.id));
      }
    }

    const successCount = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    console.log(
      `Push notifications sent to admins: ${successCount}/${activeSubscriptions.length} successful`
    );

    return {
      success: true,
      sent: successCount,
      failed: failedIndices.length,
    };
  } catch (error) {
    console.error("Error sending push notifications to admins:", error);
    return { success: false, error: String(error) };
  }
}
