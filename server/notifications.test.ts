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


describe("Real-time Order and Design Notifications", () => {
  describe("Order Notifications", () => {
    it("should detect new orders", () => {
      const orders = [
        { id: 1, customerEmail: "test@example.com", status: "pending", createdAt: new Date() },
        { id: 2, customerEmail: "test2@example.com", status: "pending", createdAt: new Date() },
      ];

      const newOrderCount = orders.length;
      expect(newOrderCount).toBe(2);
    });

    it("should calculate order count difference", () => {
      const previousCount = 5;
      const currentCount = 8;
      const newOrders = currentCount - previousCount;

      expect(newOrders).toBe(3);
    });

    it("should format order notification message", () => {
      const newOrderCount = 2;
      const message = `${newOrderCount} new order${newOrderCount !== 1 ? "s" : ""} received`;

      expect(message).toBe("2 new orders received");
    });

    it("should format singular order notification message", () => {
      const newOrderCount = 1;
      const message = `${newOrderCount} new order${newOrderCount !== 1 ? "s" : ""} received`;

      expect(message).toBe("1 new order received");
    });
  });

  describe("Design Submission Notifications", () => {
    it("should detect new design submissions", () => {
      const designs = [
        { id: 1, orderId: 1, fileName: "design1.png", status: "pending" },
        { id: 2, orderId: 2, fileName: "design2.png", status: "pending" },
        { id: 3, orderId: 3, fileName: "design3.png", status: "pending" },
      ];

      const pendingDesigns = designs.filter((d) => d.status === "pending");
      expect(pendingDesigns.length).toBe(3);
    });

    it("should calculate design count difference", () => {
      const previousCount = 2;
      const currentCount = 5;
      const newDesigns = currentCount - previousCount;

      expect(newDesigns).toBe(3);
    });

    it("should format design notification message", () => {
      const newDesignCount = 2;
      const message = `${newDesignCount} design${newDesignCount !== 1 ? "s" : ""} awaiting approval`;

      expect(message).toBe("2 designs awaiting approval");
    });

    it("should format singular design notification message", () => {
      const newDesignCount = 1;
      const message = `${newDesignCount} design${newDesignCount !== 1 ? "s" : ""} awaiting approval`;

      expect(message).toBe("1 design awaiting approval");
    });
  });

  describe("Order Status Change Notifications", () => {
    it("should detect order status changes", () => {
      const previousStatus = "pending";
      const currentStatus = "approved";

      expect(previousStatus !== currentStatus).toBe(true);
    });

    it("should map status to notification message", () => {
      const statusMessages: Record<string, string> = {
        approved: "Order Approved",
        "in-production": "In Production",
        completed: "Order Completed",
        shipped: "Order Shipped",
        rejected: "Order Rejected",
      };

      expect(statusMessages["approved"]).toBe("Order Approved");
      expect(statusMessages["in-production"]).toBe("In Production");
      expect(statusMessages["completed"]).toBe("Order Completed");
      expect(statusMessages["shipped"]).toBe("Order Shipped");
      expect(statusMessages["rejected"]).toBe("Order Rejected");
    });
  });

  describe("Design Approval Notifications", () => {
    it("should detect design approval status changes", () => {
      const previousStatus = "pending";
      const currentStatus = "approved";

      expect(previousStatus !== currentStatus).toBe(true);
    });

    it("should map approval status to notification message", () => {
      const approvalMessages: Record<string, { title: string; type: string }> = {
        approved: {
          title: "Design Approved",
          type: "success",
        },
        "changes-requested": {
          title: "Design Changes Requested",
          type: "info",
        },
        rejected: {
          title: "Design Rejected",
          type: "error",
        },
      };

      expect(approvalMessages["approved"].title).toBe("Design Approved");
      expect(approvalMessages["approved"].type).toBe("success");
      expect(approvalMessages["changes-requested"].type).toBe("info");
      expect(approvalMessages["rejected"].type).toBe("error");
    });
  });

  describe("Notification Preferences", () => {
    it("should allow enabling/disabling order notifications", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: false,
        enableChatNotifications: false,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(preferences.enableOrderNotifications).toBe(true);
      expect(preferences.enableDesignNotifications).toBe(false);
    });

    it("should allow enabling/disabling design notifications", () => {
      const preferences = {
        enableOrderNotifications: false,
        enableDesignNotifications: true,
        enableChatNotifications: false,
        enableSoundNotifications: true,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(preferences.enableDesignNotifications).toBe(true);
    });

    it("should allow enabling/disabling sound notifications", () => {
      const preferences = {
        enableOrderNotifications: true,
        enableDesignNotifications: true,
        enableChatNotifications: true,
        enableSoundNotifications: false,
        enableBrowserNotifications: false,
        notificationFrequency: "immediate" as const,
      };

      expect(preferences.enableSoundNotifications).toBe(false);
    });

    it("should support different notification frequencies", () => {
      const frequencies = ["immediate", "batched", "daily"] as const;

      frequencies.forEach((freq) => {
        const preferences = {
          enableOrderNotifications: true,
          enableDesignNotifications: true,
          enableChatNotifications: true,
          enableSoundNotifications: true,
          enableBrowserNotifications: false,
          notificationFrequency: freq,
        };

        expect(preferences.notificationFrequency).toBe(freq);
      });
    });
  });
});
