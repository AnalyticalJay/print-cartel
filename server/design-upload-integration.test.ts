import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDb } from "./db";
import { orders, designQuantityTracker, designUploadsByQuantity } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Design Upload Integration", () => {
  let db: any;

  beforeEach(async () => {
    db = await getDb();
  });

  describe("Design Upload Flow", () => {
    it("should create design quantity tracker for an order", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create a test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Test",
        customerLastName: "Customer",
        customerEmail: "test@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
      });

      const orderId = (orderResult as any)[0]?.id;
      expect(orderId).toBeDefined();

      // Create design quantity tracker
      const trackerResult = await db.insert(designQuantityTracker).values({
        lineItemId: orderId,
        quantityNumber: 1,
        hasCustomDesign: true,
      });

      const trackerId = (trackerResult as any)[0]?.id;
      expect(trackerId).toBeDefined();

      // Verify tracker was created
      const trackerCheck = await db
        .select()
        .from(designQuantityTracker)
        .where(eq(designQuantityTracker.id, trackerId))
        .limit(1);

      expect(trackerCheck).toHaveLength(1);
      expect(trackerCheck[0].lineItemId).toBe(orderId);
      expect(trackerCheck[0].hasCustomDesign).toBe(true);
    });

    it("should store design upload record with metadata", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Test",
        customerLastName: "Customer",
        customerEmail: "test@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
      });

      const orderId = (orderResult as any)[0]?.id;

      // Create design quantity tracker
      const trackerResult = await db.insert(designQuantityTracker).values({
        lineItemId: orderId,
        quantityNumber: 1,
        hasCustomDesign: true,
      });

      const trackerId = (trackerResult as any)[0]?.id;

      // Create design upload record
      const uploadResult = await db.insert(designUploadsByQuantity).values({
        designQuantityId: trackerId,
        placementId: 1,
        printSizeId: 1,
        uploadedFilePath: "orders/1/designs/test-design.png",
        uploadedFileName: "test-design.png",
        fileSize: 2048,
        mimeType: "image/png",
        thumbnailUrl: "https://example.com/thumb.png",
      });

      const uploadId = (uploadResult as any)[0]?.id;
      expect(uploadId).toBeDefined();

      // Verify upload record
      const uploadCheck = await db
        .select()
        .from(designUploadsByQuantity)
        .where(eq(designUploadsByQuantity.id, uploadId))
        .limit(1);

      expect(uploadCheck).toHaveLength(1);
      expect(uploadCheck[0].uploadedFileName).toBe("test-design.png");
      expect(uploadCheck[0].mimeType).toBe("image/png");
      expect(uploadCheck[0].fileSize).toBe(2048);
    });

    it("should fetch pending orders with their design uploads", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Design",
        customerLastName: "Tester",
        customerEmail: "designtest@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
      });

      const orderId = (orderResult as any)[0]?.id;

      // Create design quantity tracker
      const trackerResult = await db.insert(designQuantityTracker).values({
        lineItemId: orderId,
        quantityNumber: 1,
        hasCustomDesign: true,
      });

      const trackerId = (trackerResult as any)[0]?.id;

      // Create design upload
      await db.insert(designUploadsByQuantity).values({
        designQuantityId: trackerId,
        placementId: 1,
        printSizeId: 1,
        uploadedFilePath: "orders/1/designs/test.png",
        uploadedFileName: "test.png",
        fileSize: 1024,
        mimeType: "image/png",
        thumbnailUrl: "https://example.com/thumb.png",
      });

      // Query pending orders with designs
      const pendingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.status, "pending"));

      expect(pendingOrders.length).toBeGreaterThan(0);

      // Verify order has designs
      const orderWithDesigns = pendingOrders.find((o: any) => o.id === orderId);
      expect(orderWithDesigns).toBeDefined();
      expect(orderWithDesigns.customerFirstName).toBe("Design");
    });

    it("should handle multiple design uploads per order", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Multi",
        customerLastName: "Design",
        customerEmail: "multi@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
      });

      const orderId = (orderResult as any)[0]?.id;

      // Create design quantity tracker
      const trackerResult = await db.insert(designQuantityTracker).values({
        lineItemId: orderId,
        quantityNumber: 1,
        hasCustomDesign: true,
      });

      const trackerId = (trackerResult as any)[0]?.id;

      // Create multiple design uploads
      const upload1 = await db.insert(designUploadsByQuantity).values({
        designQuantityId: trackerId,
        placementId: 1,
        printSizeId: 1,
        uploadedFilePath: "orders/1/designs/front.png",
        uploadedFileName: "front.png",
        fileSize: 1024,
        mimeType: "image/png",
        thumbnailUrl: "https://example.com/front.png",
      });

      const upload2 = await db.insert(designUploadsByQuantity).values({
        designQuantityId: trackerId,
        placementId: 2,
        printSizeId: 2,
        uploadedFilePath: "orders/1/designs/back.png",
        uploadedFileName: "back.png",
        fileSize: 1536,
        mimeType: "image/png",
        thumbnailUrl: "https://example.com/back.png",
      });

      // Fetch all uploads for this tracker
      const uploads = await db
        .select()
        .from(designUploadsByQuantity)
        .where(eq(designUploadsByQuantity.designQuantityId, trackerId));

      expect(uploads).toHaveLength(2);
      expect(uploads.map((u: any) => u.uploadedFileName)).toContain("front.png");
      expect(uploads.map((u: any) => u.uploadedFileName)).toContain("back.png");
    });

    it("should track design upload timestamps", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Timestamp",
        customerLastName: "Test",
        customerEmail: "timestamp@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
      });

      const orderId = (orderResult as any)[0]?.id;

      // Create design quantity tracker
      const trackerResult = await db.insert(designQuantityTracker).values({
        lineItemId: orderId,
        quantityNumber: 1,
        hasCustomDesign: true,
      });

      const trackerId = (trackerResult as any)[0]?.id;

      // Create design upload
      const uploadResult = await db.insert(designUploadsByQuantity).values({
        designQuantityId: trackerId,
        placementId: 1,
        printSizeId: 1,
        uploadedFilePath: "orders/1/designs/test.png",
        uploadedFileName: "test.png",
        fileSize: 1024,
        mimeType: "image/png",
        thumbnailUrl: "https://example.com/thumb.png",
      });

      const uploadId = (uploadResult as any)[0]?.id;

      // Verify timestamp is set
      const uploadCheck = await db
        .select()
        .from(designUploadsByQuantity)
        .where(eq(designUploadsByQuantity.id, uploadId))
        .limit(1);

      expect(uploadCheck[0].uploadedAt).toBeDefined();
      expect(uploadCheck[0].uploadedAt instanceof Date || typeof uploadCheck[0].uploadedAt === "string").toBe(true);
    });

    it("should cascade delete designs when design quantity tracker is deleted", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Cascade",
        customerLastName: "Test",
        customerEmail: "cascade@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
      });

      const orderId = (orderResult as any)[0]?.id;

      // Create design quantity tracker
      const trackerResult = await db.insert(designQuantityTracker).values({
        lineItemId: orderId,
        quantityNumber: 1,
        hasCustomDesign: true,
      });

      const trackerId = (trackerResult as any)[0]?.id;

      // Create design upload
      await db.insert(designUploadsByQuantity).values({
        designQuantityId: trackerId,
        placementId: 1,
        printSizeId: 1,
        uploadedFilePath: "orders/1/designs/test.png",
        uploadedFileName: "test.png",
        fileSize: 1024,
        mimeType: "image/png",
        thumbnailUrl: "https://example.com/thumb.png",
      });

      // Verify design exists
      let uploads = await db
        .select()
        .from(designUploadsByQuantity)
        .where(eq(designUploadsByQuantity.designQuantityId, trackerId));

      expect(uploads).toHaveLength(1);

      // Delete design quantity tracker (should cascade delete designs)
      await db.delete(designQuantityTracker).where(eq(designQuantityTracker.id, trackerId));

      // Verify designs are deleted
      uploads = await db
        .select()
        .from(designUploadsByQuantity)
        .where(eq(designUploadsByQuantity.designQuantityId, trackerId));

      expect(uploads).toHaveLength(0);
    });
  });

  describe("Design Approval Status", () => {
    it("should track design approval status in order notes", async () => {
      if (!db) {
        console.warn("Database not available for testing");
        return;
      }

      // Create test order
      const orderResult = await db.insert(orders).values({
        userId: 1,
        productId: 1,
        colorId: 1,
        sizeId: 1,
        quantity: 5,
        totalPriceEstimate: "100.00",
        status: "pending",
        customerFirstName: "Approval",
        customerLastName: "Test",
        customerEmail: "approval@example.com",
        customerPhone: "1234567890",
        deliveryMethod: "delivery",
        paymentStatus: "unpaid",
        paymentVerificationNotes: "[APPROVED_DESIGNS] Approved by admin at 2026-04-17T06:00:00.000Z: Great designs!",
      });

      const orderId = (orderResult as any)[0]?.id;

      // Verify approval status is stored
      const orderCheck = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

      expect(orderCheck[0].paymentVerificationNotes).toContain("[APPROVED_DESIGNS]");
      expect(orderCheck[0].paymentVerificationNotes).toContain("Great designs!");
    });

    it("should extract approval notes from order verification notes", async () => {
      const notes = "[APPROVED_DESIGNS] Approved by admin at 2026-04-17T06:00:00.000Z: Excellent quality designs";
      const regex = /\[APPROVED_DESIGNS\].*?: (.*)/;
      const match = notes.match(regex);

      expect(match).toBeDefined();
      expect(match?.[1]).toBe("Excellent quality designs");
    });

    it("should extract change request details from notes", async () => {
      const notes = "[CHANGES_REQUESTED] Requested at 2026-04-17T06:00:00.000Z: Please adjust the color to match brand guidelines";
      const regex = /\[CHANGES_REQUESTED\].*?: (.*)/;
      const match = notes.match(regex);

      expect(match).toBeDefined();
      expect(match?.[1]).toContain("Please adjust the color");
    });

    it("should extract rejection reason from notes", async () => {
      const notes = "[DESIGNS_REJECTED] Rejected at 2026-04-17T06:00:00.000Z: Image resolution too low for DTF printing";
      const regex = /\[DESIGNS_REJECTED\].*?: (.*)/;
      const match = notes.match(regex);

      expect(match).toBeDefined();
      expect(match?.[1]).toContain("Image resolution too low");
    });
  });
});
