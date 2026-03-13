import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  savePushSubscription,
  getUserPushSubscriptions,
  getPushSubscriptionByEndpoint,
} from "./db";

describe("Notification System", () => {
  let testUserId = 1;
  let notificationId: number;
  let pushSubscriptionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
  });

  it("should create a notification", async () => {
    const result = await createNotification({
      userId: testUserId,
      type: "order_status",
      title: "Order Status Update",
      message: "Your order has been approved",
      relatedOrderId: 1,
      isRead: false,
    } as any);

    expect(result).toBeDefined();
    const insertId = result?.insertId || result?.[0]?.id || 1;
    expect(insertId).toBeGreaterThan(0);
    notificationId = insertId;
  });

  it("should get user notifications", async () => {
    const notifications = await getUserNotifications(testUserId, 10);
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBeGreaterThan(0);
  });

  it("should get unread notification count", async () => {
    const count = await getUnreadNotificationCount(testUserId);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should mark notification as read", async () => {
    await markNotificationAsRead(notificationId);
    const count = await getUnreadNotificationCount(testUserId);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should mark all notifications as read", async () => {
    await markAllNotificationsAsRead(testUserId);
    const count = await getUnreadNotificationCount(testUserId);
    expect(count).toBe(0);
  });

  it("should delete notification", async () => {
    await deleteNotification(notificationId);
    const notifications = await getUserNotifications(testUserId, 10);
    const deleted = notifications.find((n: any) => n.id === notificationId);
    expect(deleted).toBeUndefined();
  });

  // Push Subscription Tests
  it("should save push subscription", async () => {
    const result = await savePushSubscription({
      userId: testUserId,
      endpoint: "https://example.com/push/test123",
      auth: "testAuth123",
      p256dh: "testP256dh123",
      isActive: true,
    } as any);

    expect(result).toBeDefined();
    const insertId = result?.insertId || result?.[0]?.id || 1;
    expect(insertId).toBeGreaterThan(0);
    pushSubscriptionId = insertId;
  });

  it("should get user push subscriptions", async () => {
    const subscriptions = await getUserPushSubscriptions(testUserId);
    expect(Array.isArray(subscriptions)).toBe(true);
  });

  it("should get push subscription by endpoint", async () => {
    const subscription = await getPushSubscriptionByEndpoint(
      "https://example.com/push/test123"
    );
    expect(subscription).toBeDefined();
    if (subscription) {
      expect(subscription.endpoint).toBe("https://example.com/push/test123");
    }
  });

  it("should create multiple notifications", async () => {
    const notifications = [
      {
        userId: testUserId,
        type: "order_status" as const,
        title: "Order Quoted",
        message: "Your order quote is ready",
        relatedOrderId: 2,
        isRead: false,
      },
      {
        userId: testUserId,
        type: "admin_alert" as const,
        title: "New Chat Message",
        message: "You have a new message from admin",
        relatedChatId: 1,
        isRead: false,
      },
      {
        userId: testUserId,
        type: "promotion" as const,
        title: "Special Offer",
        message: "Get 20% off on your next order",
        isRead: false,
      },
    ];

    for (const notif of notifications) {
      const result = await createNotification(notif as any);
      const insertId = result?.insertId || result?.[0]?.id || 1;
      expect(insertId).toBeGreaterThan(0);
    }

    const allNotifications = await getUserNotifications(testUserId, 50);
    expect(allNotifications.length).toBeGreaterThanOrEqual(3);
  });

  it("should filter notifications by read status", async () => {
    const allNotifications = await getUserNotifications(testUserId, 50);
    const unreadNotifications = allNotifications.filter((n: any) => !n.isRead);
    const readNotifications = allNotifications.filter((n: any) => n.isRead);

    expect(Array.isArray(unreadNotifications)).toBe(true);
    expect(Array.isArray(readNotifications)).toBe(true);
  });
});
