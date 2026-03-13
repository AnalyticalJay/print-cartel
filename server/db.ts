import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, productColors, productSizes, printOptions, printPlacements, orders, orderPrints, InsertOrder, InsertOrderPrint, chatConversations, chatMessages, InsertChatConversation, InsertChatMessage, resellerInquiries, InsertResellerInquiry, bulkPricingTiers, resellerResponses, InsertResellerResponse } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["firstName", "lastName", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.phone !== undefined) {
      values.phone = user.phone ?? null;
      updateSet.phone = user.phone ?? null;
    }

    if (user.companyName !== undefined) {
      values.companyName = user.companyName ?? null;
      updateSet.companyName = user.companyName ?? null;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Product queries
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products);
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

export async function getProductColors(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productColors).where(eq(productColors.productId, productId));
}

export async function getProductSizes(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productSizes).where(eq(productSizes.productId, productId));
}

export async function getAllPrintOptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(printOptions);
}

export async function getAllPrintPlacements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(printPlacements);
}

// Order queries
export async function createOrder(orderData: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(orderData);
  return result[0].insertId;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(orders.createdAt);
}

export async function updateOrderStatus(orderId: number, status: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

export async function createOrderPrint(printData: InsertOrderPrint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderPrints).values(printData);
  return result[0].insertId;
}

export async function getOrderPrints(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderPrints).where(eq(orderPrints.orderId, orderId));
}

export async function getOrdersByCustomerEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(orders.createdAt);
}

// Chat functions
export async function createChatConversation(data: InsertChatConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatConversations).values(data);
  return result[0].insertId;
}

export async function getChatConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
  return result[0] || null;
}

export async function getChatConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(chatConversations.updatedAt);
}

export async function updateChatConversationStatus(conversationId: number, status: "active" | "closed" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatConversations).set({ status }).where(eq(chatConversations.id, conversationId));
}

export async function addChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(data);
  return result[0].insertId;
}

export async function getChatMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

export async function markChatMessagesAsRead(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatMessages).set({ isRead: 1 }).where(eq(chatMessages.conversationId, conversationId));
}

// Get all conversations (for admin)
export async function getAllChatConversations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).orderBy(desc(chatConversations.updatedAt));
}

// Get conversations by order ID
export async function getChatConversationsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).where(eq(chatConversations.orderId, orderId)).orderBy(desc(chatConversations.updatedAt));
}

// Link conversation to order
export async function linkConversationToOrder(conversationId: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatConversations).set({ orderId }).where(eq(chatConversations.id, conversationId));
}

// Get conversation with all messages
export async function getConversationWithMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return null;
  const conversation = await getChatConversation(conversationId);
  if (!conversation) return null;
  const messages = await getChatMessages(conversationId);
  return { ...conversation, messages };
}

// Get unread message count for a conversation
export async function getUnreadMessageCount(conversationId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(chatMessages).where(and(eq(chatMessages.conversationId, conversationId), eq(chatMessages.isRead, 0)));
  return result.length;
}

// Reseller inquiry functions
export async function createResellerInquiry(data: InsertResellerInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(resellerInquiries).values(data);
  return result[0].insertId;
}

export async function getResellerInquiry(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(resellerInquiries).where(eq(resellerInquiries.id, id));
  return result[0] || null;
}

export async function getAllResellerInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerInquiries).orderBy(resellerInquiries.createdAt);
}

export async function updateResellerInquiryStatus(id: number, status: "new" | "contacted" | "qualified" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resellerInquiries).set({ status }).where(eq(resellerInquiries.id, id));
}

// Bulk pricing functions
export async function getBulkPricingTiers(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bulkPricingTiers).where(eq(bulkPricingTiers.productId, productId)).orderBy(bulkPricingTiers.minQuantity);
}

export async function getAllBulkPricingTiers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bulkPricingTiers).orderBy(bulkPricingTiers.productId, bulkPricingTiers.minQuantity);
}

// Reseller response functions
export async function createResellerResponse(data: InsertResellerResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(resellerResponses).values(data);
  return result[0].insertId;
}

export async function getResellerResponses(inquiryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerResponses).where(eq(resellerResponses.inquiryId, inquiryId)).orderBy(resellerResponses.sentAt);
}

export async function getResellerResponseCount(inquiryId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(resellerResponses).where(eq(resellerResponses.inquiryId, inquiryId));
  return result.length;
}


// Chat system message functions
export async function createSystemMessage(
  conversationId: number,
  message: string,
  messageType: "system" | "status_update" = "system",
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatMessages).values({
    conversationId,
    senderType: "admin",
    messageType,
    message,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
  return result[0].insertId;
}

export async function createOrderStatusUpdateMessage(
  conversationId: number,
  orderId: number,
  previousStatus: string,
  newStatus: string
) {
  const statusMessages: Record<string, string> = {
    pending: "Your order has been received and is pending review.",
    quoted: "We have prepared a quote for your order.",
    approved: "Your order has been approved and is being prepared.",
    completed: "Your order has been completed and is ready for shipment.",
    shipped: "Your order has been shipped.",
    cancelled: "Your order has been cancelled.",
  };

  const message = `Order status updated: ${previousStatus.toUpperCase()} → ${newStatus.toUpperCase()}. ${statusMessages[newStatus] || ""}`;
  
  return createSystemMessage(
    conversationId,
    message,
    "status_update",
    {
      orderId,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    }
  );
}

export async function getConversationByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatConversations).where(eq(chatConversations.orderId, orderId));
  return result[0] || null;
}
