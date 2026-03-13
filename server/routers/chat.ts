import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createChatConversation,
  getChatConversation,
  getChatConversationsByUserId,
  updateChatConversationStatus,
  addChatMessage,
  getChatMessages,
  markChatMessagesAsRead,
  getAllChatConversations,
  getChatConversationsByOrderId,
  linkConversationToOrder,
  getConversationWithMessages,
  getUnreadMessageCount,
} from "../db";

export const chatRouter = router({
  // Create a new chat conversation (public - for visitors)
  createConversation: publicProcedure
    .input(
      z.object({
        visitorName: z.string().min(1, "Name is required"),
        visitorEmail: z.string().email("Valid email is required"),
        subject: z.string().min(1, "Subject is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 0; // Use 0 for anonymous visitors
      const conversationId = await createChatConversation({
        userId,
        visitorName: input.visitorName,
        visitorEmail: input.visitorEmail,
        subject: input.subject,
        status: "active",
      });
      return { conversationId };
    }),

  // Get conversation details
  getConversation: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return getChatConversation(input.conversationId);
    }),

  // Get all conversations for a user (protected)
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return getChatConversationsByUserId(ctx.user.id);
  }),

  // Update conversation status (admin only)
  updateStatus: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        status: z.enum(["active", "closed", "archived"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      await updateChatConversationStatus(input.conversationId, input.status);
      return { success: true };
    }),

  // Send a message
  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1, "Message cannot be empty"),
        senderType: z.enum(["user", "visitor", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const messageId = await addChatMessage({
        conversationId: input.conversationId,
        senderId: ctx.user?.id,
        senderType: input.senderType,
        message: input.message,
        isRead: 0,
      });
      return { messageId, success: true };
    }),

  // Get messages for a conversation
  getMessages: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return getChatMessages(input.conversationId);
    }),

  // Mark messages as read
  markAsRead: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      await markChatMessagesAsRead(input.conversationId);
      return { success: true };
    }),

  // Admin: Get all conversations with unread counts
  getAllConversations: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    const conversations = await getAllChatConversations();
    const withUnreadCounts = await Promise.all(
      conversations.map(async (conv) => ({
        ...conv,
        unreadCount: await getUnreadMessageCount(conv.id),
      }))
    );
    return withUnreadCounts;
  }),

  // Admin: Get conversation with full message history
  getConversationHistory: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return getConversationWithMessages(input.conversationId);
    }),

  // Admin: Send reply to conversation
  sendAdminReply: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1, 'Message cannot be empty'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      const messageId = await addChatMessage({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        senderType: 'admin',
        message: input.message,
        isRead: 0,
      });
      await updateChatConversationStatus(input.conversationId, 'active');
      return { messageId, success: true };
    }),

  // Admin: Link conversation to order
  linkToOrder: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        orderId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      await linkConversationToOrder(input.conversationId, input.orderId);
      return { success: true };
    }),

  // Get conversations for a specific order
  getByOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return getChatConversationsByOrderId(input.orderId);
    }),

  // Customer: Get communication history
  getCustomerCommunications: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await getChatConversationsByUserId(ctx.user.id);
    const enhanced = await Promise.all(
      conversations.map(async (conv) => ({
        ...conv,
        unreadCount: await getUnreadMessageCount(conv.id),
      }))
    );
    return enhanced;
  }),
});
