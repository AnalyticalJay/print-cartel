import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db as drizzleDb } from '../../drizzle/client';
import { orders, productionQueue, products, productColors, productSizes } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  getProductionQueueByStatus,
  updateProductionQueueStatus,
  assignProductionQueueToAdmin,
  updateProductionQueuePriority,
} from '../db';

describe('Production Queue Functions', () => {
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
        name: 'Test Product for Production',
        basePrice: '100.00',
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
        colorName: 'Test Color',
        colorHex: '#FF0000',
      })
      .$returningId();
    testColorId = colorResult[0].id;

    // Create test size
    const sizeResult = await db
      .insert(productSizes)
      .values({
        productId: testProductId,
        sizeName: 'M',
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
        quantity: 5,
        totalPriceEstimate: '500.00',
        status: 'pending',
        customerFirstName: 'Test',
        customerLastName: 'Customer',
        customerEmail: 'test@example.com',
        customerPhone: '0123456789',
        deliveryMethod: 'collection',
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

  it('should retrieve production queue by status with order and product details', async () => {
    const result = await getProductionQueueByStatus('pending');
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    const testEntry = result.find(item => item.orderId === testOrderId);
    expect(testEntry).toBeDefined();
    
    if (testEntry) {
      expect(testEntry.id).toBe(testQueueId);
      expect(testEntry.orderId).toBe(testOrderId);
      expect(testEntry.status).toBe('pending');
      expect(testEntry.priority).toBe('normal');
      expect(testEntry.customerFirstName).toBe('Test');
      expect(testEntry.customerLastName).toBe('Customer');
      expect(testEntry.customerEmail).toBe('test@example.com');
      expect(testEntry.quantity).toBe(5);
      expect(testEntry.productName).toBe('Test Product for Production');
      expect(testEntry.productId).toBe(testProductId);
    }
  });

  it('should update production queue status', async () => {
    await updateProductionQueueStatus(testQueueId, 'approved', 'Test notes');
    
    const db = drizzleDb;
    const result = await db
      .select()
      .from(productionQueue)
      .where(eq(productionQueue.id, testQueueId))
      .limit(1);
    
    expect(result[0].status).toBe('approved');
    expect(result[0].productionNotes).toBe('Test notes');
  });

  it('should assign production queue to admin', async () => {
    const adminId = 999;
    await assignProductionQueueToAdmin(testQueueId, adminId);
    
    const db = drizzleDb;
    const result = await db
      .select()
      .from(productionQueue)
      .where(eq(productionQueue.id, testQueueId))
      .limit(1);
    
    expect(result[0].assignedToAdminId).toBe(adminId);
  });

  it('should update production queue priority', async () => {
    await updateProductionQueuePriority(testQueueId, 'high');
    
    const db = drizzleDb;
    const result = await db
      .select()
      .from(productionQueue)
      .where(eq(productionQueue.id, testQueueId))
      .limit(1);
    
    expect(result[0].priority).toBe('high');
  });

  it('should return empty array for non-existent status', async () => {
    const result = await getProductionQueueByStatus('non-existent-status' as any);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should retrieve all statuses correctly', async () => {
    const statuses = ['pending', 'quoted', 'approved', 'in-production', 'ready', 'completed'];
    
    for (const status of statuses) {
      const result = await getProductionQueueByStatus(status);
      expect(Array.isArray(result)).toBe(true);
    }
  });
});
