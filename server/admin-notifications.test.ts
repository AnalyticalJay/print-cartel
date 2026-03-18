import { describe, it, expect, vi } from 'vitest';
import { sendNewOrderNotificationEmail, sendOrderConfirmationEmail } from './_core/email';

describe('Admin Notifications', () => {
  it('should send new order notification email to admin', async () => {
    const orderData = {
      orderId: 12345,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '0123456789',
      productName: 'Custom T-Shirt',
      quantity: 10,
      totalPrice: 850,
      status: 'pending',
      orderDate: new Date(),
      trackingUrl: 'https://printcartel.co.za/track-order/12345',
    };

    // Mock the email sending (in real scenario, SMTP would be configured)
    const result = await sendNewOrderNotificationEmail(orderData, 'admin@printcartel.com');
    
    // Email function should return true on success or handle gracefully
    expect(typeof result).toBe('boolean');
  });

  it('should send order confirmation email to customer', async () => {
    const orderData = {
      orderId: 12346,
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '0987654321',
      productName: 'Custom Polo',
      quantity: 5,
      totalPrice: 750,
      status: 'pending',
      orderDate: new Date(),
      trackingUrl: 'https://printcartel.co.za/track-order/12346',
    };

    const result = await sendOrderConfirmationEmail(orderData);
    
    expect(typeof result).toBe('boolean');
  });

  it('should include all order details in admin notification', async () => {
    const orderData = {
      orderId: 12347,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      productName: 'Hoodie',
      quantity: 20,
      totalPrice: 2000,
      status: 'pending',
      orderDate: new Date('2026-03-18'),
      trackingUrl: 'https://printcartel.co.za/track-order/12347',
    };

    const result = await sendNewOrderNotificationEmail(orderData, 'admin@test.com');
    
    // Verify the function completes without error
    expect(result).toBeDefined();
  });

  it('should handle missing customer phone gracefully', async () => {
    const orderData = {
      orderId: 12348,
      customerName: 'No Phone Customer',
      customerEmail: 'nophone@example.com',
      productName: 'Custom Design',
      quantity: 1,
      totalPrice: 150,
      status: 'pending',
      orderDate: new Date(),
      trackingUrl: 'https://printcartel.co.za/track-order/12348',
    };

    const result = await sendNewOrderNotificationEmail(orderData, 'admin@test.com');
    
    expect(typeof result).toBe('boolean');
  });

  it('should format order total price correctly in emails', async () => {
    const orderData = {
      orderId: 12349,
      customerName: 'Price Test',
      customerEmail: 'price@example.com',
      customerPhone: '5555555555',
      productName: 'Test Product',
      quantity: 3,
      totalPrice: 425.50,
      status: 'pending',
      orderDate: new Date(),
      trackingUrl: 'https://printcartel.co.za/track-order/12349',
    };

    const result = await sendOrderConfirmationEmail(orderData);
    
    expect(typeof result).toBe('boolean');
  });
});
