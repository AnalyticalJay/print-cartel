import { eq, and } from "drizzle-orm";
import { db as drizzleDb } from "../drizzle/client";
import { users, orders, orderPrints, orderLineItems, pushSubscriptions, notifications, chatConversations, chatMessages, designTemplates, templateCustomizations, resellerInquiries, resellerResponses, bulkPricingTiers, referralProgram, referralTracking, gangSheets, gangSheetArtwork, productColors, productSizes, productionQueue, products } from "../drizzle/schema";
import type { InsertUser, InsertOrder, InsertOrderPrint, InsertOrderLineItem, DesignTemplate, ResellerInquiry } from "../drizzle/schema";

export async function getDb() {
  try {
    return drizzleDb;
  } catch (error) {
    console.error("Database connection error:", error);
    return null;
  }
}

// Product functions
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products);
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.select().from(orders).where(eq(orders.id, productId)).limit(1);
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

export async function getProductPrices() {
  return {};
}

export async function upsertUser(userData: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserByOpenId(userData.openId);
  if (existing) {
    await updateUser(existing.id, userData);
    return existing.id;
  }
  return await createUser(userData);
}

export async function createUser(userData: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(userData);
  return result[0].insertId;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function updateUser(userId: number, userData: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(userData).where(eq(users.id, userId));
}

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

export async function createOrderLineItem(lineItemData: InsertOrderLineItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderLineItems).values(lineItemData);
  return result[0].insertId;
}

export async function getOrderLineItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderLineItems).where(eq(orderLineItems.orderId, orderId));
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

export async function getConversationByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatConversations).where(eq(chatConversations.orderId, orderId)).limit(1);
  return result[0];
}

export async function createConversation(conversationData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatConversations).values(conversationData);
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

export async function createMessage(messageData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(messageData);
  return result[0].insertId;
}

export async function createOrderStatusUpdateMessage(conversationId: number, orderId: number, previousStatus: string, newStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values({
    conversationId,
    senderId: 0,
    senderType: "admin",
    messageType: "status_update",
    message: `Order status updated from ${previousStatus} to ${newStatus}`,
    metadata: JSON.stringify({ orderId, previousStatus, newStatus }),
  });
  return result[0].insertId;
}

export async function getAllConversations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).orderBy(chatConversations.updatedAt);
}

export async function updateConversation(conversationId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatConversations).set(data).where(eq(chatConversations.id, conversationId));
}

export async function getPushSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function createPushSubscription(subscriptionData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pushSubscriptions).values(subscriptionData);
  return result[0].insertId;
}

export async function updatePushSubscription(userId: number, subscriptionData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pushSubscriptions).set(subscriptionData).where(eq(pushSubscriptions.userId, userId));
}

export async function createNotification(notificationData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notificationData);
  return result[0].insertId;
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
}


// Template functions
export async function getAllDesignTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(designTemplates);
}

export async function getDesignTemplatesByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(designTemplates).where(eq(designTemplates.category, category));
}

export async function getDesignTemplateById(templateId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(designTemplates).where(eq(designTemplates.id, templateId)).limit(1);
  return result[0] || null;
}

export async function getTemplateCustomizations(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(templateCustomizations).where(eq(templateCustomizations.templateId, templateId));
}

export async function getPopularTemplates(limit: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(designTemplates).where(eq(designTemplates.isPopular, true)).limit(limit);
}

export async function getTemplateCategories() {
  const db = await getDb();
  if (!db) return [];
  // Get distinct categories from designTemplates
  const templates = await db.select({ category: designTemplates.category }).from(designTemplates);
  return Array.from(new Set(templates.map(t => t.category)));
}

export async function incrementTemplateUsage(templateId: number) {
  const db = await getDb();
  if (!db) return;
  const template = await getDesignTemplateById(templateId);
  if (template) {
    await db.update(designTemplates).set({ usageCount: (template.usageCount || 0) + 1 }).where(eq(designTemplates.id, templateId));
  }
}


// Reseller functions
export async function getAllBulkPricingTiers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bulkPricingTiers);
}

export async function createResellerResponse(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resellerResponses).values(data);
  return result[0].insertId;
}

export async function getResellerResponses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerResponses);
}

export async function updateResellerInquiryStatus(inquiryId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(resellerInquiries).set({ status: status as any }).where(eq(resellerInquiries.id, inquiryId));
}

export async function getBulkPricingTiers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bulkPricingTiers);
}


// Print functions
export async function getAllPrintOptions() {
  return [];
}

export async function getAllPrintPlacements() {
  // Return mock placement data with placementName property
  return [
    { id: 1, placementName: "Front Center", description: "Center front of garment" },
    { id: 2, placementName: "Back Center", description: "Center back of garment" },
    { id: 3, placementName: "Left Sleeve", description: "Left sleeve" },
    { id: 4, placementName: "Right Sleeve", description: "Right sleeve" },
  ];
}

// Chat functions
export async function createChatConversation(conversationData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Placeholder - returns null
  return null;
}

export async function getChatConversation(conversationId: number) {
  // Placeholder - returns null
  return null;
}

export async function getChatConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).where(eq(chatConversations.userId, userId));
}

export async function updateChatConversationStatus(conversationId: number, status: string) {
  // Placeholder - does nothing
  return;
}


// Additional chat functions
export async function addChatMessage(messageData: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values(messageData);
  return result[0].insertId;
}

export async function getChatMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

export async function markChatMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatMessages).set({ isRead: 1 }).where(eq(chatMessages.conversationId, conversationId));
}

export async function getAllChatConversations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).orderBy(chatConversations.updatedAt);
}

export async function getChatConversationsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).where(eq(chatConversations.orderId, orderId));
}

export async function linkConversationToOrder(conversationId: number, orderId: number) {
  return;
}


export async function getConversationWithMessages(conversationId: number) {
  return null;
}

export async function getUnreadMessageCount(userId: number) {
  return 0;
}

export async function addChatFileAttachment(attachmentData: any) {
  return null;
}

export async function getChatFileAttachments(messageId: number) {
  return [];
}

export async function getChatFileAttachmentsByConversation(conversationId: number) {
  return [];
}

export async function deleteChatFileAttachment(attachmentId: number) {
  return;
}

export async function getConversationWithMessagesAndAttachments(conversationId: number) {
  return null;
}


// Reseller inquiry functions
export async function createResellerInquiry(inquiryData: any): Promise<ResellerInquiry | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(resellerInquiries).values(inquiryData);
  const inquiryId = result[0].insertId;
  return getResellerInquiry(inquiryId);
}

export async function getAllResellerInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerInquiries).orderBy(resellerInquiries.createdAt);
}

export async function getResellerInquiry(inquiryId: number): Promise<ResellerInquiry | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(resellerInquiries).where(eq(resellerInquiries.id, inquiryId)).limit(1);
  return result[0] || null;
}


// Referral program functions
export async function createReferralProgram(userId: number, referralCode: string, discountPercentage: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(referralProgram).values({
    userId,
    referralCode,
    discountPercentage: discountPercentage.toString(),
  });
  return result[0].insertId;
}

export async function getReferralProgramByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referralProgram).where(eq(referralProgram.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getReferralProgramByCode(referralCode: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referralProgram).where(eq(referralProgram.referralCode, referralCode)).limit(1);
  return result[0] || null;
}

export async function createReferralTracking(referralId: number, referredEmail: string, referredUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(referralTracking).values({
    referralId,
    referredUserId,
    referredEmail,
  });
  return result[0].insertId;
}

export async function getReferralTrackingByReferralId(referralId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(referralTracking).where(eq(referralTracking.referralId, referralId));
}

export async function getReferralTrackingByReferredEmail(referredEmail: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referralTracking).where(eq(referralTracking.referredEmail, referredEmail)).limit(1);
  return result[0] || null;
}

export async function completeReferralTracking(trackingId: number, firstOrderId: number, rewardAmount: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(referralTracking).set({
    status: "completed",
    firstOrderId,
    firstOrderDate: new Date(),
    rewardAmount: rewardAmount.toString(),
    rewardClaimedDate: new Date(),
  }).where(eq(referralTracking.id, trackingId));
}

// Gang sheet functions
export async function createGangSheet(gangSheetData: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(gangSheets).values(gangSheetData);
  return result[0].insertId;
}

export async function getGangSheet(gangSheetId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gangSheets).where(eq(gangSheets.id, gangSheetId)).limit(1);
  return result[0] || null;
}

export async function getGangSheetsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gangSheets).where(eq(gangSheets.userId, userId));
}

export async function updateGangSheet(gangSheetId: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(gangSheets).set(data).where(eq(gangSheets.id, gangSheetId));
}

export async function addGangSheetArtwork(artworkData: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(gangSheetArtwork).values(artworkData);
  return result[0].insertId;
}

export async function getGangSheetArtwork(gangSheetId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gangSheetArtwork).where(eq(gangSheetArtwork.gangSheetId, gangSheetId));
}

export async function deleteGangSheetArtwork(artworkId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(gangSheetArtwork).where(eq(gangSheetArtwork.id, artworkId));
}


// Production queue functions
export async function getProductionQueueByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(productionQueue).where(eq(productionQueue.orderId, orderId)).limit(1);
  return result[0] || null;
}

export async function createProductionQueueEntry(orderId: number, estimatedCompletionDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(productionQueue).values({
    orderId,
    status: "pending",
    estimatedCompletionDate,
  });
  return result[0].insertId;
}

export async function updateProductionQueueEntry(queueId: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(productionQueue).set(data).where(eq(productionQueue.id, queueId));
}

export async function getAllProductionQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productionQueue).orderBy(productionQueue.createdAt);
}

export async function deleteGangSheet(gangSheetId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(gangSheets).where(eq(gangSheets.id, gangSheetId));
}


export async function getProductionQueueByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productionQueue).where(eq(productionQueue.status, status as any));
}

export async function updateProductionQueueStatus(queueId: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) return;
  const data: any = { status };
  if (notes) data.productionNotes = notes;
  await db.update(productionQueue).set(data).where(eq(productionQueue.id, queueId));
}

export async function assignProductionQueueToAdmin(queueId: number, adminId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(productionQueue).set({ assignedToAdminId: adminId }).where(eq(productionQueue.id, queueId));
}

export async function updateProductionQueuePriority(queueId: number, priority: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(productionQueue).set({ priority: priority as any }).where(eq(productionQueue.id, queueId));
}

export async function getProductionQueueByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productionQueue).where(eq(productionQueue.assignedToAdminId, adminId));
}


export async function getPushSubscriptionByEndpoint(endpoint: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).limit(1);
  return result[0] || null;
}

export async function getAllGangSheets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gangSheets).orderBy(gangSheets.createdAt);
}


export async function deletePushSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscriptionId));
}


export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}


export async function savePushSubscription(subscriptionData: any) {
  const db = await getDb();
  if (!db) return null;
  // Check if subscription already exists
  const existing = await getPushSubscriptionByEndpoint(subscriptionData.endpoint);
  if (existing) {
    await updatePushSubscription(existing.userId, subscriptionData);
    return existing.id;
  }
  const result = await db.insert(pushSubscriptions).values(subscriptionData);
  return result[0].insertId;
}


export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.id, notificationId));
}


export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, notificationId));
}


export async function updateGangSheetArtwork(artworkId: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(gangSheetArtwork).set(data).where(eq(gangSheetArtwork.id, artworkId));
}

export async function getGangSheetById(gangSheetId: number) {
  const db = await getDb();
  if (!db) return null;
  return getGangSheet(gangSheetId);
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt).limit(limit);
  return result;
}
