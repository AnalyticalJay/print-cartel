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
      // In a real app, you'd check if user is admin
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
});
