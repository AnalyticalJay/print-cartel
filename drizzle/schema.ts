import { boolean, decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  fabricType: varchar("fabricType", { length: 255 }),
  productType: varchar("productType", { length: 100 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Product colors table
export const productColors = mysqlTable("productColors", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  colorName: varchar("colorName", { length: 100 }).notNull(),
  colorHex: varchar("colorHex", { length: 7 }).notNull(),
});

export type ProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = typeof productColors.$inferInsert;

// Product sizes table
export const productSizes = mysqlTable("productSizes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sizeName: varchar("sizeName", { length: 10 }).notNull(),
});

export type ProductSize = typeof productSizes.$inferSelect;
export type InsertProductSize = typeof productSizes.$inferInsert;

// Print options table (for different print sizes)
export const printOptions = mysqlTable("printOptions", {
  id: int("id").autoincrement().primaryKey(),
  printSize: varchar("printSize", { length: 50 }).notNull(), // Pocket Size, A5, A4, A3
  additionalPrice: decimal("additionalPrice", { precision: 10, scale: 2 }).notNull(),
});

export type PrintOption = typeof printOptions.$inferSelect;
export type InsertPrintOption = typeof printOptions.$inferInsert;

// Print placements table
export const printPlacements = mysqlTable("printPlacements", {
  id: int("id").autoincrement().primaryKey(),
  placementName: varchar("placementName", { length: 100 }).notNull(),
  positionCoordinates: json("positionCoordinates"), // JSON object with x, y, width, height
});

export type PrintPlacement = typeof printPlacements.$inferSelect;
export type InsertPrintPlacement = typeof printPlacements.$inferInsert;

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  productId: int("productId").notNull(),
  colorId: int("colorId").notNull(),
  sizeId: int("sizeId").notNull(),
  quantity: int("quantity").notNull(),
  totalPriceEstimate: decimal("totalPriceEstimate", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]).default("pending").notNull(),
  customerFirstName: varchar("customerFirstName", { length: 255 }).notNull(),
  customerLastName: varchar("customerLastName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  customerCompany: varchar("customerCompany", { length: 255 }),
  deliveryMethod: mysqlEnum("deliveryMethod", ["collection", "delivery"]).notNull(),
  deliveryAddress: text("deliveryAddress"),
  deliveryCharge: decimal("deliveryCharge", { precision: 10, scale: 2 }).default("0"),
  additionalNotes: text("additionalNotes"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "deposit_paid", "paid", "cancelled"]).default("unpaid").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["deposit", "full_payment"]).default("full_payment"),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }).default("0"),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  invoiceDate: timestamp("invoiceDate"),
  invoiceUrl: varchar("invoiceUrl", { length: 500 }),
  invoiceAcceptedAt: timestamp("invoiceAcceptedAt"),
  invoiceDeclinedAt: timestamp("invoiceDeclinedAt"),
  invoiceDeclineReason: text("invoiceDeclineReason"),
  quoteApprovedAt: timestamp("quoteApprovedAt"),
  quoteRejectedAt: timestamp("quoteRejectedAt"),
  quoteRejectionReason: text("quoteRejectionReason"),
  paymentProofUrl: varchar("paymentProofUrl", { length: 500 }),
  paymentProofUploadedAt: timestamp("paymentProofUploadedAt"),
  paymentVerificationStatus: mysqlEnum("paymentVerificationStatus", ["pending", "verified", "rejected"]).default("pending"),
  paymentVerifiedAt: timestamp("paymentVerifiedAt"),
  paymentVerificationNotes: text("paymentVerificationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Payment records table for tracking individual payments
export const paymentRecords = mysqlTable("paymentRecords", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // credit_card, bank_transfer, cash
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending"),
  transactionId: varchar("transactionId", { length: 255 }),
  paymentType: mysqlEnum("paymentType", ["deposit", "final_payment"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;

// Type for order creation (excludes auto-generated fields)
export type CreateOrderInput = Omit<InsertOrder, 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus' | 'amountPaid' | 'invoiceNumber' | 'invoiceDate'> & {
  deliveryMethod: 'collection' | 'delivery';
};

// Order prints table (for multiple placements per order)
export const orderPrints = mysqlTable("orderPrints", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  printSizeId: int("printSizeId").notNull(),
  placementId: int("placementId").notNull(),
  uploadedFilePath: varchar("uploadedFilePath", { length: 500 }),
  uploadedFileName: varchar("uploadedFileName", { length: 255 }),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  // Design approval workflow
  designApprovalStatus: varchar("designApprovalStatus", { length: 50 }).default("pending").notNull(),
  designApprovalNotes: text("designApprovalNotes"),
  designApprovedAt: timestamp("designApprovedAt"),
  designReviewedBy: varchar("designReviewedBy", { length: 255 }),
});

export type OrderPrint = typeof orderPrints.$inferSelect;
export type InsertOrderPrint = typeof orderPrints.$inferInsert;
// Quotes table (for custom quotes on orders)
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  adminId: int("adminId").notNull(),
  templateId: int("templateId"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  adjustedPrice: decimal("adjustedPrice", { precision: 10, scale: 2 }).notNull(),
  priceAdjustmentReason: text("priceAdjustmentReason"),
  adminNotes: text("adminNotes"),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  expiresAt: timestamp("expiresAt"),
  sentAt: timestamp("sentAt"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;


// Chat conversations table
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderId: int("orderId"), // Link to specific order if applicable
  visitorName: varchar("visitorName", { length: 255 }),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  status: mysqlEnum("status", ["active", "closed", "archived"]).default("active").notNull(),
  subject: varchar("subject", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Chat messages table
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId"),
  senderType: mysqlEnum("senderType", ["user", "visitor", "admin"]).notNull(),
  messageType: mysqlEnum("messageType", ["text", "system", "status_update"]).default("text").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON field for storing order status, previous status, etc.
  isRead: int("isRead").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Chat file attachments table
export const chatFileAttachments = mysqlTable("chatFileAttachments", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  conversationId: int("conversationId").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(), // S3 URL
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileType: mysqlEnum("fileType", ["image", "document", "video", "audio", "other"]).notNull(),
  uploadedBy: int("uploadedBy"), // user ID who uploaded
  uploadedByType: mysqlEnum("uploadedByType", ["user", "admin"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatFileAttachment = typeof chatFileAttachments.$inferSelect;
export type InsertChatFileAttachment = typeof chatFileAttachments.$inferInsert;

// Reseller inquiries table
export const resellerInquiries = mysqlTable("resellerInquiries", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  businessType: varchar("businessType", { length: 100 }).notNull(), // e.g., "Print Shop", "Clothing Brand", "Event Company"
  estimatedMonthlyVolume: varchar("estimatedMonthlyVolume", { length: 50 }).notNull(), // e.g., "100-500", "500-1000", "1000+"
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "rejected"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResellerInquiry = typeof resellerInquiries.$inferSelect;
export type InsertResellerInquiry = typeof resellerInquiries.$inferInsert;

// Bulk pricing tiers table
export const bulkPricingTiers = mysqlTable("bulkPricingTiers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  minQuantity: int("minQuantity").notNull(),
  maxQuantity: int("maxQuantity"),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).notNull(),
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BulkPricingTier = typeof bulkPricingTiers.$inferSelect;
export type InsertBulkPricingTier = typeof bulkPricingTiers.$inferInsert;


// Reseller responses table for admin communications
export const resellerResponses = mysqlTable("resellerResponses", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  adminId: int("adminId").notNull(),
  templateId: int("templateId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResellerResponse = typeof resellerResponses.$inferSelect;
export type InsertResellerResponse = typeof resellerResponses.$inferInsert;


// Gang sheets table for reseller orders
export const gangSheets = mysqlTable("gangSheets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: int("quantity").notNull().default(1),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "printing", "completed", "cancelled"]).default("draft").notNull(),
  exportFileUrl: varchar("exportFileUrl", { length: 500 }), // S3 URL to exported gang sheet
  exportFileName: varchar("exportFileName", { length: 255 }),
  exportFormat: mysqlEnum("exportFormat", ["png", "pdf"]).default("png"),
  previewImageUrl: varchar("previewImageUrl", { length: 500 }), // Preview thumbnail
  canvasWidth: int("canvasWidth").default(900).notNull(), // pixels
  canvasHeight: int("canvasHeight").default(3000).notNull(), // pixels
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  customerCompany: varchar("customerCompany", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GangSheet = typeof gangSheets.$inferSelect;
export type InsertGangSheet = typeof gangSheets.$inferInsert;

// Gang sheet artwork items
export const gangSheetArtwork = mysqlTable("gangSheetArtwork", {
  id: int("id").autoincrement().primaryKey(),
  gangSheetId: int("gangSheetId").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(), // S3 URL
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // bytes
  mimeType: varchar("mimeType", { length: 100 }),
  originalWidth: int("originalWidth"), // pixels
  originalHeight: int("originalHeight"), // pixels
  dpi: int("dpi").default(300), // dots per inch
  hasTransparency: int("hasTransparency").default(0), // 0 = false, 1 = true
  backgroundRemoved: int("backgroundRemoved").default(0), // 0 = false, 1 = true
  positionX: decimal("positionX", { precision: 10, scale: 2 }).notNull(), // mm
  positionY: decimal("positionY", { precision: 10, scale: 2 }).notNull(), // mm
  width: decimal("width", { precision: 10, scale: 2 }).notNull(), // mm
  height: decimal("height", { precision: 10, scale: 2 }).notNull(), // mm
  rotation: decimal("rotation", { precision: 5, scale: 2 }).default("0"), // degrees
  zIndex: int("zIndex").default(0), // stacking order
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GangSheetArtwork = typeof gangSheetArtwork.$inferSelect;
export type InsertGangSheetArtwork = typeof gangSheetArtwork.$inferInsert;

// Referral program table
export const referralProgram = mysqlTable("referralProgram", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who is referring
  referralCode: varchar("referralCode", { length: 50 }).notNull().unique(), // Unique code for sharing
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).default("10").notNull(), // Discount offered to referred friends
  totalReferrals: int("totalReferrals").default(0).notNull(), // Count of successful referrals
  totalRewardValue: decimal("totalRewardValue", { precision: 10, scale: 2 }).default("0").notNull(), // Total value of rewards earned
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralProgram = typeof referralProgram.$inferSelect;
export type InsertReferralProgram = typeof referralProgram.$inferInsert;

// Referral tracking table
export const referralTracking = mysqlTable("referralTracking", {
  id: int("id").autoincrement().primaryKey(),
  referralId: int("referralId").notNull(), // FK to referralProgram
  referredUserId: int("referredUserId").notNull(), // User who was referred
  referredEmail: varchar("referredEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  rewardType: mysqlEnum("rewardType", ["discount", "credit", "cash"]).default("discount").notNull(),
  firstOrderId: int("firstOrderId"), // First order placed by referred user
  firstOrderDate: timestamp("firstOrderDate"),
  rewardClaimedDate: timestamp("rewardClaimedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralTracking = typeof referralTracking.$inferSelect;
export type InsertReferralTracking = typeof referralTracking.$inferInsert;

// Production queue table for tracking order progress
export const productionQueue = mysqlTable("productionQueue", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  status: mysqlEnum("status", ["pending", "quoted", "approved", "in-production", "ready", "completed", "shipped", "cancelled"]).default("pending").notNull(),
  estimatedCompletionDate: timestamp("estimatedCompletionDate"),
  actualCompletionDate: timestamp("actualCompletionDate"),
  productionNotes: text("productionNotes"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  assignedToAdminId: int("assignedToAdminId"), // Admin assigned to this order
  gangSheetId: int("gangSheetId"), // Link to gang sheet if consolidated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductionQueue = typeof productionQueue.$inferSelect;
export type InsertProductionQueue = typeof productionQueue.$inferInsert;

// Design templates table
export const designTemplates = mysqlTable("designTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Sports", "Business", "Event", "Casual"
  templateImageUrl: varchar("templateImageUrl", { length: 500 }).notNull(), // Preview image
  templateDesignUrl: varchar("templateDesignUrl", { length: 500 }).notNull(), // Actual design file (SVG/PNG)
  defaultProductId: int("defaultProductId"), // Suggested product
  defaultColorId: int("defaultColorId"), // Suggested color
  defaultPlacements: json("defaultPlacements"), // Array of placement IDs
  defaultPrintSizes: json("defaultPrintSizes"), // Array of print size IDs
  isPopular: boolean("isPopular").default(false),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DesignTemplate = typeof designTemplates.$inferSelect;
export type InsertDesignTemplate = typeof designTemplates.$inferInsert;

// Template customization options
export const templateCustomizations = mysqlTable("templateCustomizations", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  customizationType: mysqlEnum("customizationType", ["color", "text", "size", "placement"]).notNull(),
  label: varchar("label", { length: 255 }).notNull(), // e.g., "Logo Color", "Company Name"
  defaultValue: varchar("defaultValue", { length: 255 }),
  allowedValues: json("allowedValues"), // Array of allowed values or constraints
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateCustomization = typeof templateCustomizations.$inferSelect;
export type InsertTemplateCustomization = typeof templateCustomizations.$inferInsert;

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["order_status", "admin_alert", "system", "promotion"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedOrderId: int("relatedOrderId"), // Link to order if applicable
  relatedChatId: int("relatedChatId"), // Link to chat conversation if applicable
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }), // URL to navigate to when clicked
  metadata: json("metadata"), // Additional data (order status, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Push subscription table for browser push notifications
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Order line items table - supports multiple garments per order
export const orderLineItems = mysqlTable("orderLineItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(), // FK to orders
  productId: int("productId").notNull(), // Which garment
  colorId: int("colorId").notNull(), // Which color
  sizeId: int("sizeId").notNull(), // Which size
  quantity: int("quantity").notNull(), // How many of this combination
  placementId: int("placementId").notNull(), // Where to print
  printSizeId: int("printSizeId").notNull(), // What size DTF
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // Price per unit
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  notes: text("notes"), // Special instructions for this line item
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderLineItem = typeof orderLineItems.$inferSelect;
export type InsertOrderLineItem = typeof orderLineItems.$inferInsert;

// Foreign key constraint for chat file attachments
// Note: Add these in a migration if not already present
// ALTER TABLE chatFileAttachments ADD CONSTRAINT fk_chat_file_message FOREIGN KEY (messageId) REFERENCES chatMessages(id) ON DELETE CASCADE;
// ALTER TABLE chatFileAttachments ADD CONSTRAINT fk_chat_file_conversation FOREIGN KEY (conversationId) REFERENCES chatConversations(id) ON DELETE CASCADE;


// Order status history table (for tracking all status changes)
export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  previousStatus: mysqlEnum("previousStatus", ["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]),
  newStatus: mysqlEnum("newStatus", ["pending", "quoted", "approved", "in-production", "completed", "shipped", "cancelled"]).notNull(),
  changedBy: int("changedBy"), // Admin user ID who made the change
  adminNotes: text("adminNotes"), // Notes about why the status was changed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;


// Payment proofs table for manual bank transfer verification
export const paymentProofs = mysqlTable("paymentProofs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // Admin user ID who verified
  adminNotes: text("adminNotes"), // Notes from admin (reason for rejection, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentProof = typeof paymentProofs.$inferSelect;
export type InsertPaymentProof = typeof paymentProofs.$inferInsert;

// Quote Templates table
export const quoteTemplates = mysqlTable(
  "quoteTemplates",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    templateType: mysqlEnum("templateType", ["standard", "bulk", "reseller", "custom"])
      .default("standard")
      .notNull(),
    headerText: text("headerText"),
    footerText: text("footerText"),
    includeTermsAndConditions: boolean("includeTermsAndConditions").default(true),
    termsAndConditions: text("termsAndConditions"),
    paymentTerms: varchar("paymentTerms", { length: 255 }),
    deliveryTerms: varchar("deliveryTerms", { length: 255 }),
    validityDays: int("validityDays").default(7),
    discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }),
    discountReason: varchar("discountReason", { length: 255 }),
    notes: text("notes"),
    isActive: boolean("isActive").default(true),
    createdBy: int("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    createdByIdx: index("idx_quote_templates_createdBy").on(table.createdBy),
    typeIdx: index("idx_quote_templates_type").on(table.templateType),
    activeIdx: index("idx_quote_templates_active").on(table.isActive),
  })
);

export type QuoteTemplate = typeof quoteTemplates.$inferSelect;
export type InsertQuoteTemplate = typeof quoteTemplates.$inferInsert;

// Quote Reminders table
export const quoteReminders = mysqlTable(
  "quoteReminders",
  {
    id: int("id").autoincrement().primaryKey(),
    quoteId: int("quoteId").notNull().references(() => quotes.id, { onDelete: "cascade" }),
    reminderType: mysqlEnum("reminderType", ["expiring_soon", "expired", "follow_up"]).notNull(),
    sentAt: timestamp("sentAt"),
    status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
    attemptCount: int("attemptCount").default(0),
    lastAttemptAt: timestamp("lastAttemptAt"),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_quote_reminders_status").on(table.status, table.reminderType),
    createdAtIdx: index("idx_quote_reminders_createdAt").on(table.createdAt),
  })
);

export type QuoteReminder = typeof quoteReminders.$inferSelect;
export type InsertQuoteReminder = typeof quoteReminders.$inferInsert;


// ============================================================================
// ADVANCED ORDER WIZARD TABLES - Per-Quantity Design Management
// ============================================================================

// Design variation tracking for line items - tracks if designs differ per quantity
export const lineItemDesignVariations = mysqlTable("lineItemDesignVariations", {
  id: int("id").autoincrement().primaryKey(),
  lineItemId: int("lineItemId").notNull().references(() => orderLineItems.id, { onDelete: "cascade" }),
  designVariationType: mysqlEnum("designVariationType", ["same_across_all", "different_per_quantity"]).default("same_across_all").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LineItemDesignVariation = typeof lineItemDesignVariations.$inferSelect;
export type InsertLineItemDesignVariation = typeof lineItemDesignVariations.$inferInsert;

// Design quantity tracking - tracks each individual quantity within a line item
export const designQuantityTracker = mysqlTable("designQuantityTracker", {
  id: int("id").autoincrement().primaryKey(),
  lineItemId: int("lineItemId").notNull().references(() => orderLineItems.id, { onDelete: "cascade" }),
  quantityNumber: int("quantityNumber").notNull(),
  hasCustomDesign: boolean("hasCustomDesign").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DesignQuantityTracker = typeof designQuantityTracker.$inferSelect;
export type InsertDesignQuantityTracker = typeof designQuantityTracker.$inferInsert;

// Design uploads table - tracks design files for specific placements on specific quantities
export const designUploadsByQuantity = mysqlTable("designUploadsByQuantity", {
  id: int("id").autoincrement().primaryKey(),
  designQuantityId: int("designQuantityId").notNull().references(() => designQuantityTracker.id, { onDelete: "cascade" }),
  placementId: int("placementId").notNull().references(() => printPlacements.id),
  printSizeId: int("printSizeId").notNull().references(() => printOptions.id),
  uploadedFilePath: varchar("uploadedFilePath", { length: 500 }).notNull(),
  uploadedFileName: varchar("uploadedFileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type DesignUploadByQuantity = typeof designUploadsByQuantity.$inferSelect;
export type InsertDesignUploadByQuantity = typeof designUploadsByQuantity.$inferInsert;

// Design summary cache - for quick retrieval of design info per order
export const designSummaryCache = mysqlTable("designSummaryCache", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  totalDesignCount: int("totalDesignCount").notNull(),
  placementBreakdown: json("placementBreakdown"),
  hasMultipleDesignVariations: boolean("hasMultipleDesignVariations").default(false).notNull(),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DesignSummaryCache = typeof designSummaryCache.$inferSelect;
export type InsertDesignSummaryCache = typeof designSummaryCache.$inferInsert;


// PayFast ITN Retry Queue - Tracks failed ITN callbacks for retry processing
export const payFastItnRetryQueue = mysqlTable(
  "payFastItnRetryQueue",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
    transactionId: varchar("transactionId", { length: 255 }).notNull(),
    itnData: json("itnData").notNull(), // Full ITN payload from PayFast
    status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "abandoned"]).default("pending").notNull(),
    attemptCount: int("attemptCount").default(0).notNull(),
    maxAttempts: int("maxAttempts").default(5).notNull(),
    nextRetryAt: timestamp("nextRetryAt"),
    lastAttemptAt: timestamp("lastAttemptAt"),
    lastErrorMessage: text("lastErrorMessage"),
    failureReason: mysqlEnum("failureReason", [
      "signature_verification_failed",
      "order_not_found",
      "payment_already_processed",
      "database_error",
      "email_send_failed",
      "unknown_error",
      "timeout"
    ]),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("idx_payfast_itn_orderId").on(table.orderId),
    statusIdx: index("idx_payfast_itn_status").on(table.status),
    nextRetryIdx: index("idx_payfast_itn_nextRetry").on(table.nextRetryAt),
    transactionIdIdx: index("idx_payfast_itn_transactionId").on(table.transactionId),
  })
);

export type PayFastItnRetryQueue = typeof payFastItnRetryQueue.$inferSelect;
export type InsertPayFastItnRetryQueue = typeof payFastItnRetryQueue.$inferInsert;
