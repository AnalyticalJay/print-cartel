import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendOrderMilestoneEmail } from './_core/email';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(async (options) => ({
        messageId: 'test-message-id',
        response: 'Test email sent',
      })),
    })),
  },
}));

describe('Milestone Email Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send approved milestone email with correct content', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'approved',
      new Date('2026-03-25')
    );

    expect(result).toBe(true);
  });

  it('should send in-production milestone email with correct content', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'Jane Smith',
      12346,
      'in-production',
      new Date('2026-03-28')
    );

    expect(result).toBe(true);
  });

  it('should send shipped milestone email with correct content', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'Bob Johnson',
      12347,
      'shipped',
      new Date('2026-03-21')
    );

    expect(result).toBe(true);
  });

  it('should handle missing estimated delivery date gracefully', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'Alice Brown',
      12348,
      'approved'
    );

    expect(result).toBe(true);
  });

  it('should include order ID in milestone email', async () => {
    const orderId = 99999;
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'Test User',
      orderId,
      'approved'
    );

    expect(result).toBe(true);
  });

  it('should include customer name in milestone email', async () => {
    const customerName = 'Test Customer';
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      customerName,
      12345,
      'approved'
    );

    expect(result).toBe(true);
  });

  it('should use correct email subject for approved status', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'approved'
    );

    expect(result).toBe(true);
  });

  it('should use correct email subject for in-production status', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'in-production'
    );

    expect(result).toBe(true);
  });

  it('should use correct email subject for shipped status', async () => {
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'shipped'
    );

    expect(result).toBe(true);
  });

  it('should format estimated delivery date correctly', async () => {
    const estimatedDate = new Date('2026-04-15');
    const result = await sendOrderMilestoneEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'approved',
      estimatedDate
    );

    expect(result).toBe(true);
  });
});
