import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  savePushSubscription,
  getUserPushSubscriptions,
  deletePushSubscription,
  getPushSubscriptionByEndpoint,
} from "../db";

export const notificationsRouter = router({
  // Get user's notifications
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return await getUserNotifications(ctx.user.id, input.limit);
    }),

  // Get unread notification count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await getUnreadNotificationCount(ctx.user.id);
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  // Delete notification
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteNotification(input.notificationId);
      return { success: true };
    }),

  // Subscribe to push notifications
  subscribeToPush: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        auth: z.string(),
        p256dh: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if subscription already exists
      const existing = await getPushSubscriptionByEndpoint(input.endpoint);
      if (existing) {
        return { success: true, id: existing.id };
      }

      const result = await savePushSubscription({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        auth: input.auth,
        p256dh: input.p256dh,
        isActive: true,
      } as any);

      return { success: true, id: result };
    }),

  // Get user's push subscriptions
  getPushSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    return await getUserPushSubscriptions(ctx.user.id);
  }),

  // Unsubscribe from push notifications
  unsubscribeFromPush: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletePushSubscription(input.subscriptionId);
      return { success: true };
    }),

  // Create notification (admin only)
  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["order_status", "admin_alert", "system", "promotion"]),
        title: z.string(),
        message: z.string(),
        relatedOrderId: z.number().optional(),
        relatedChatId: z.number().optional(),
        actionUrl: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins can create notifications
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create notifications");
      }

      const result = await createNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedOrderId: input.relatedOrderId || null,
        relatedChatId: input.relatedChatId || null,
        actionUrl: input.actionUrl || null,
        metadata: input.metadata || null,
        isRead: false,
      } as any);

      return { success: true, id: result };
    }),
});
