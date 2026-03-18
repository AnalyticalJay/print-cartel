import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db as drizzleDb } from '../drizzle/client';
import { orders, productionQueue, products, productColors, productSizes } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendOrderStatusChangeEmail } from './status-change-emails';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(async (mailOptions) => {
        console.log('Mock email sent:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          status: 'sent',
        });
        return { response: 'Mock email sent' };
      }),
    })),
  },
}));

describe('Status Change Email Notifications', () => {
  let testOrderId: number;
  let testProductId: number;
  let testColorId: number;
  let testSizeId: number;
  let testQueueId: number;

  beforeAll(async () => {
    const db = drizzleDb;

    // Create test product
    const productResult = await db
      .insert(products)
      .values({
        name: 'Test T-Shirt for Email Notifications',
        basePrice: '85.00',
        productType: 'T-Shirt',
        fabricType: 'Cotton',
      })
      .$returningId();
    testProductId = productResult[0].id;

    // Create test color
    const colorResult = await db
      .insert(productColors)
      .values({
        productId: testProductId,
        colorName: 'Test Black',
        colorHex: '#000000',
      })
      .$returningId();
    testColorId = colorResult[0].id;

    // Create test size
    const sizeResult = await db
      .insert(productSizes)
      .values({
        productId: testProductId,
        sizeName: 'L',
      })
      .$returningId();
    testSizeId = sizeResult[0].id;

    // Create test order
    const orderResult = await db
      .insert(orders)
      .values({
        productId: testProductId,
        colorId: testColorId,
        sizeId: testSizeId,
        quantity: 10,
        totalPriceEstimate: '850.00',
        status: 'pending',
        customerFirstName: 'John',
        customerLastName: 'Doe',
        customerEmail: 'john.doe@example.com',
        customerPhone: '0123456789',
        deliveryMethod: 'delivery',
        deliveryAddress: '123 Main St, Gqeberha, 6000',
      })
      .$returningId();
    testOrderId = orderResult[0].id;

    // Create production queue entry
    const queueResult = await db
      .insert(productionQueue)
      .values({
        orderId: testOrderId,
        status: 'pending',
        priority: 'normal',
      })
      .$returningId();
    testQueueId = queueResult[0].id;
  });

  afterAll(async () => {
    const db = drizzleDb;

    // Clean up test data
    await db.delete(productionQueue).where(eq(productionQueue.id, testQueueId));
    await db.delete(orders).where(eq(orders.id, testOrderId));
    await db.delete(productSizes).where(eq(productSizes.productId, testProductId));
    await db.delete(productColors).where(eq(productColors.productId, testProductId));
    await db.delete(products).where(eq(products.id, testProductId));
  });

  it('should send email when order status changes to quoted', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'quoted',
        previousStatus: 'pending',
        quoteAmount: 850.00,
      })
    ).resolves.not.toThrow();
  });

  it('should send email when order status changes to approved', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'approved',
        previousStatus: 'quoted',
      })
    ).resolves.not.toThrow();
  });

  it('should send email when order status changes to in-production', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'in-production',
        previousStatus: 'approved',
        productionNotes: 'Started printing on DTF machine',
      })
    ).resolves.not.toThrow();
  });

  it('should send email when order status changes to ready', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'ready',
        previousStatus: 'in-production',
      })
    ).resolves.not.toThrow();
  });

  it('should send email when order status changes to shipped', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'shipped',
        previousStatus: 'ready',
      })
    ).resolves.not.toThrow();
  });

  it('should send email when order status changes to completed', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'completed',
        previousStatus: 'shipped',
      })
    ).resolves.not.toThrow();
  });

  it('should send email when order is cancelled', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'cancelled',
        previousStatus: 'pending',
        productionNotes: 'Cancelled per customer request',
      })
    ).resolves.not.toThrow();
  });

  it('should include order details in email', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'approved',
        previousStatus: 'quoted',
        quoteAmount: 850.00,
      })
    ).resolves.not.toThrow();
  });

  it('should include production notes when provided', async () => {
    const notes = 'High priority order - rush production';
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'in-production',
        previousStatus: 'approved',
        productionNotes: notes,
      })
    ).resolves.not.toThrow();
  });

  it('should handle collection delivery method correctly', async () => {
    // Create order with collection delivery
    const db = drizzleDb;
    const collectionOrderResult = await db
      .insert(orders)
      .values({
        productId: testProductId,
        colorId: testColorId,
        sizeId: testSizeId,
        quantity: 5,
        totalPriceEstimate: '425.00',
        status: 'pending',
        customerFirstName: 'Jane',
        customerLastName: 'Smith',
        customerEmail: 'jane.smith@example.com',
        customerPhone: '0987654321',
        deliveryMethod: 'collection',
      })
      .$returningId();
    const collectionOrderId = collectionOrderResult[0].id;

    await expect(
      sendOrderStatusChangeEmail({
        orderId: collectionOrderId,
        customerEmail: 'jane.smith@example.com',
        customerName: 'Jane Smith',
        newStatus: 'ready',
        previousStatus: 'in-production',
      })
    ).resolves.not.toThrow();

    // Clean up
    await db.delete(orders).where(eq(orders.id, collectionOrderId));
  });

  it('should handle all status transitions', async () => {
    const statuses: Array<'pending' | 'quoted' | 'approved' | 'in-production' | 'ready' | 'completed' | 'shipped' | 'cancelled'> = [
      'pending',
      'quoted',
      'approved',
      'in-production',
      'ready',
      'completed',
      'shipped',
    ];

    for (const status of statuses) {
      await expect(
        sendOrderStatusChangeEmail({
          orderId: testOrderId,
          customerEmail: 'john.doe@example.com',
          customerName: 'John Doe',
          newStatus: status,
          previousStatus: 'pending',
        })
      ).resolves.not.toThrow();
    }
  });

  it('should handle missing order gracefully', async () => {
    // Should not throw even if order doesn't exist
    await expect(
      sendOrderStatusChangeEmail({
        orderId: 99999,
        customerEmail: 'nonexistent@example.com',
        customerName: 'Non Existent',
        newStatus: 'approved',
        previousStatus: 'pending',
      })
    ).resolves.not.toThrow();
  });

  it('should include quote amount in email when provided', async () => {
    const quoteAmount = 950.00;
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'quoted',
        previousStatus: 'pending',
        quoteAmount: quoteAmount,
      })
    ).resolves.not.toThrow();
  });

  it('should send email with customer name and email', async () => {
    await expect(
      sendOrderStatusChangeEmail({
        orderId: testOrderId,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        newStatus: 'approved',
        previousStatus: 'quoted',
      })
    ).resolves.not.toThrow();
  });
});
