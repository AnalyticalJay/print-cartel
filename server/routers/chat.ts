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
  addChatFileAttachment,
  getChatFileAttachments,
  getChatFileAttachmentsByConversation,
  deleteChatFileAttachment,
  getConversationWithMessagesAndAttachments,
} from "../db";
import { storagePut } from "../storage";

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

  // Upload file attachment to chat
  uploadFileAttachment: publicProcedure
    .input(
      z.object({
        conversationId: z.number(),
        messageId: z.number(),
        fileName: z.string().min(1, "File name is required"),
        fileData: z.string(), // Base64 encoded file data
        mimeType: z.string().min(1, "MIME type is required"),
        uploadedByType: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64 file data
        const buffer = Buffer.from(input.fileData, "base64");
        const fileSize = buffer.length;

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (fileSize > maxSize) {
          throw new Error(`File size exceeds maximum limit of 50MB`);
        }

        // Determine file type
        const fileExtension = input.fileName.split(".").pop()?.toLowerCase() || "";
        const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
        const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "txt"];
        const videoExtensions = ["mp4", "avi", "mov", "mkv", "webm"];
        const audioExtensions = ["mp3", "wav", "aac", "flac"];

        let fileType: "image" | "document" | "video" | "audio" | "other" = "other";
        if (imageExtensions.includes(fileExtension)) fileType = "image";
        else if (documentExtensions.includes(fileExtension)) fileType = "document";
        else if (videoExtensions.includes(fileExtension)) fileType = "video";
        else if (audioExtensions.includes(fileExtension)) fileType = "audio";

        // Upload to S3
        const fileKey = `chat-attachments/${input.conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Save attachment metadata to database
        const attachmentId = await addChatFileAttachment({
          messageId: input.messageId,
          conversationId: input.conversationId,
          fileUrl: url,
          fileName: input.fileName,
          fileSize,
          mimeType: input.mimeType,
          fileType,
          uploadedBy: ctx.user?.id,
          uploadedByType: input.uploadedByType,
        });

        return {
          success: true,
          attachmentId,
          fileUrl: url,
          fileName: input.fileName,
          fileSize,
        };
      } catch (error) {
        console.error("File upload error:", error);
        throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  // Get file attachments for a message
  getMessageAttachments: publicProcedure
    .input(z.object({ messageId: z.number() }))
    .query(async ({ input }) => {
      return getChatFileAttachments(input.messageId);
    }),

  // Get all attachments in a conversation
  getConversationAttachments: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return getChatFileAttachmentsByConversation(input.conversationId);
    }),

  // Delete file attachment (admin only)
  deleteFileAttachment: protectedProcedure
    .input(z.object({ attachmentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      await deleteChatFileAttachment(input.attachmentId);
      return { success: true };
    }),

  // Get conversation with messages and attachments
  getConversationWithAttachments: publicProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return getConversationWithMessagesAndAttachments(input.conversationId);
    }),
});
