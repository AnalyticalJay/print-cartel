import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  printSize: varchar("printSize", { length: 10 }).notNull(), // A6, A5, A4, A3
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
  status: mysqlEnum("status", ["pending", "quoted", "approved"]).default("pending").notNull(),
  customerFirstName: varchar("customerFirstName", { length: 255 }).notNull(),
  customerLastName: varchar("customerLastName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  customerCompany: varchar("customerCompany", { length: 255 }),
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Order prints table (for multiple placements per order)
export const orderPrints = mysqlTable("orderPrints", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  printSizeId: int("printSizeId").notNull(),
  placementId: int("placementId").notNull(),
  uploadedFilePath: varchar("uploadedFilePath", { length: 500 }).notNull(),
  uploadedFileName: varchar("uploadedFileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
});

export type OrderPrint = typeof orderPrints.$inferSelect;
export type InsertOrderPrint = typeof orderPrints.$inferInsert;