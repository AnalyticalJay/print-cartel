import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  addChatFileAttachment,
  getChatFileAttachments,
  getChatFileAttachmentsByConversation,
  deleteChatFileAttachment,
  addChatMessage,
  createChatConversation,
} from "./db";
import { InsertChatFileAttachment } from "../drizzle/schema";

describe("Chat File Attachments", () => {
  let conversationId: number;
  let messageId: number;
  let attachmentId: number;

  beforeAll(async () => {
    // Create a test conversation
    conversationId = await createChatConversation({
      userId: 1,
      visitorName: "Test User",
      visitorEmail: "test@example.com",
      subject: "Test Conversation",
      status: "active",
    });

    // Create a test message
    messageId = await addChatMessage({
      conversationId,
      senderId: 1,
      senderType: "user",
      message: "Test message with file",
      isRead: 0,
    });
  });

  it("should add a file attachment", async () => {
    const attachment: InsertChatFileAttachment = {
      messageId,
      conversationId,
      fileUrl: "https://example.com/test-file.pdf",
      fileName: "test-file.pdf",
      fileSize: 1024000,
      mimeType: "application/pdf",
      fileType: "document",
      uploadedBy: 1,
      uploadedByType: "user",
    };

    attachmentId = await addChatFileAttachment(attachment);
    expect(attachmentId).toBeGreaterThan(0);
  });

  it("should retrieve file attachments for a message", async () => {
    const attachments = await getChatFileAttachments(messageId);
    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].fileName).toBe("test-file.pdf");
    expect(attachments[0].mimeType).toBe("application/pdf");
  });

  it("should retrieve all attachments in a conversation", async () => {
    const attachments = await getChatFileAttachmentsByConversation(conversationId);
    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].conversationId).toBe(conversationId);
  });

  it("should support different file types", async () => {
    const fileTypes = [
      { name: "image.png", type: "image", mime: "image/png" },
      { name: "video.mp4", type: "video", mime: "video/mp4" },
      { name: "audio.mp3", type: "audio", mime: "audio/mpeg" },
      { name: "document.docx", type: "document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    ];

    for (const file of fileTypes) {
      const attachment: InsertChatFileAttachment = {
        messageId,
        conversationId,
        fileUrl: `https://example.com/${file.name}`,
        fileName: file.name,
        fileSize: 2048000,
        mimeType: file.mime,
        fileType: file.type as "image" | "document" | "video" | "audio" | "other",
        uploadedBy: 1,
        uploadedByType: "user",
      };

      const id = await addChatFileAttachment(attachment);
      expect(id).toBeGreaterThan(0);

      const retrieved = await getChatFileAttachments(messageId);
      const found = retrieved.find((a) => a.fileName === file.name);
      expect(found).toBeDefined();
      expect(found?.fileType).toBe(file.type);
    }
  });

  it("should track file size correctly", async () => {
    const attachment: InsertChatFileAttachment = {
      messageId,
      conversationId,
      fileUrl: "https://example.com/large-file.zip",
      fileName: "large-file.zip",
      fileSize: 52428800, // 50MB
      mimeType: "application/zip",
      fileType: "other",
      uploadedBy: 1,
      uploadedByType: "admin",
    };

    const id = await addChatFileAttachment(attachment);
    const retrieved = await getChatFileAttachments(messageId);
    const found = retrieved.find((a) => a.fileName === "large-file.zip");
    expect(found?.fileSize).toBe(52428800);
  });

  it("should track uploader information", async () => {
    const attachment: InsertChatFileAttachment = {
      messageId,
      conversationId,
      fileUrl: "https://example.com/admin-file.pdf",
      fileName: "admin-file.pdf",
      fileSize: 1024000,
      mimeType: "application/pdf",
      fileType: "document",
      uploadedBy: 2,
      uploadedByType: "admin",
    };

    const id = await addChatFileAttachment(attachment);
    const retrieved = await getChatFileAttachments(messageId);
    const found = retrieved.find((a) => a.fileName === "admin-file.pdf");
    expect(found?.uploadedBy).toBe(2);
    expect(found?.uploadedByType).toBe("admin");
  });

  it("should delete file attachment", async () => {
    const attachment: InsertChatFileAttachment = {
      messageId,
      conversationId,
      fileUrl: "https://example.com/delete-me.txt",
      fileName: "delete-me.txt",
      fileSize: 512,
      mimeType: "text/plain",
      fileType: "document",
      uploadedBy: 1,
      uploadedByType: "user",
    };

    const id = await addChatFileAttachment(attachment);
    await deleteChatFileAttachment(id);

    const attachments = await getChatFileAttachments(messageId);
    const found = attachments.find((a) => a.fileName === "delete-me.txt");
    expect(found).toBeUndefined();
  });

  it("should handle multiple attachments per message", async () => {
    const newMessage = await addChatMessage({
      conversationId,
      senderId: 1,
      senderType: "user",
      message: "Message with multiple files",
      isRead: 0,
    });

    const files = [
      { name: "file1.pdf", size: 1024 },
      { name: "file2.jpg", size: 2048 },
      { name: "file3.docx", size: 4096 },
    ];

    for (const file of files) {
      await addChatFileAttachment({
        messageId: newMessage,
        conversationId,
        fileUrl: `https://example.com/${file.name}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: "application/octet-stream",
        fileType: "other",
        uploadedBy: 1,
        uploadedByType: "user",
      });
    }

    const attachments = await getChatFileAttachments(newMessage);
    expect(attachments.length).toBe(3);
    expect(attachments.map((a) => a.fileName).sort()).toEqual(
      files.map((f) => f.name).sort()
    );
  });

  afterAll(async () => {
    // Cleanup is handled by database transactions in real tests
    // In production, you'd want to also delete from S3
  });
});
