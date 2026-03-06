import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  createChatConversation,
  getChatConversation,
  getChatConversationsByUserId,
  addChatMessage,
  getChatMessages,
  updateChatConversationStatus,
} from "./db";

describe("Chat functionality", () => {
  let conversationId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should create a chat conversation", async () => {
    const result = await createChatConversation({
      userId: 1,
      visitorName: "John Doe",
      visitorEmail: "john@example.com",
      subject: "Question about DTF printing",
      status: "active",
    });

    expect(result).toBeGreaterThan(0);
    conversationId = result;
  });

  it("should retrieve a chat conversation", async () => {
    const conversation = await getChatConversation(conversationId);

    expect(conversation).toBeDefined();
    expect(conversation?.visitorName).toBe("John Doe");
    expect(conversation?.visitorEmail).toBe("john@example.com");
    expect(conversation?.status).toBe("active");
  });

  it("should add a message to a conversation", async () => {
    const messageId = await addChatMessage({
      conversationId,
      senderId: null,
      senderType: "visitor",
      message: "Hi, I have a question about your printing services.",
      isRead: 0,
    });

    expect(messageId).toBeGreaterThan(0);
  });

  it("should retrieve messages from a conversation", async () => {
    const messages = await getChatMessages(conversationId);

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].message).toBe(
      "Hi, I have a question about your printing services."
    );
    expect(messages[0].senderType).toBe("visitor");
  });

  it("should add multiple messages", async () => {
    await addChatMessage({
      conversationId,
      senderId: 1,
      senderType: "admin",
      message: "Thank you for contacting us! How can we help?",
      isRead: 0,
    });

    await addChatMessage({
      conversationId,
      senderId: null,
      senderType: "visitor",
      message: "I want to know about bulk pricing.",
      isRead: 0,
    });

    const messages = await getChatMessages(conversationId);
    expect(messages.length).toBeGreaterThanOrEqual(3);
  });

  it("should update conversation status", async () => {
    await updateChatConversationStatus(conversationId, "closed");

    const conversation = await getChatConversation(conversationId);
    expect(conversation?.status).toBe("closed");
  });

  it("should retrieve conversations by user ID", async () => {
    // Create another conversation
    const anotherId = await createChatConversation({
      userId: 1,
      visitorName: "Jane Smith",
      visitorEmail: "jane@example.com",
      subject: "Order inquiry",
      status: "active",
    });

    const conversations = await getChatConversationsByUserId(1);

    expect(conversations.length).toBeGreaterThanOrEqual(2);
    expect(conversations.some((c: any) => c.id === conversationId)).toBe(true);
    expect(conversations.some((c: any) => c.id === anotherId)).toBe(true);
  });

  it("should have proper message timestamps", async () => {
    const messages = await getChatMessages(conversationId);

    expect(messages.length).toBeGreaterThan(0);
    messages.forEach((msg: any) => {
      expect(msg.createdAt).toBeDefined();
      expect(msg.createdAt instanceof Date || typeof msg.createdAt === "string").toBe(true);
    });
  });

  it("should handle empty conversation", async () => {
    const newConversationId = await createChatConversation({
      userId: 2,
      visitorName: "Test User",
      visitorEmail: "test@example.com",
      subject: "Test",
      status: "active",
    });

    const messages = await getChatMessages(newConversationId);
    expect(messages.length).toBe(0);
  });
});
