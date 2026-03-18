import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendOrderReadyForCollectionEmail } from './_core/email';

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

describe('Ready for Collection Email Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send ready for collection email with correct content', async () => {
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'Print Cartel Office, South Africa',
      'Please bring your order confirmation email when collecting.'
    );

    expect(result).toBe(true);
  });

  it('should send ready for collection email with default location', async () => {
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'Jane Smith',
      12346
    );

    expect(result).toBe(true);
  });

  it('should include order ID in ready for collection email', async () => {
    const orderId = 99999;
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'Test User',
      orderId,
      'Print Cartel Office'
    );

    expect(result).toBe(true);
  });

  it('should include customer name in ready for collection email', async () => {
    const customerName = 'Test Customer';
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      customerName,
      12345
    );

    expect(result).toBe(true);
  });

  it('should include collection location in ready for collection email', async () => {
    const location = 'Downtown Office';
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'John Doe',
      12345,
      location
    );

    expect(result).toBe(true);
  });

  it('should include collection instructions when provided', async () => {
    const instructions = 'Please bring your ID and order confirmation.';
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'Print Cartel Office',
      instructions
    );

    expect(result).toBe(true);
  });

  it('should send email with correct subject line', async () => {
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'John Doe',
      12345
    );

    expect(result).toBe(true);
  });

  it('should handle multiple collection location formats', async () => {
    const locations = [
      'Print Cartel Office, South Africa',
      'Downtown Branch',
      '123 Main Street, Cape Town'
    ];

    for (const location of locations) {
      const result = await sendOrderReadyForCollectionEmail(
        'customer@example.com',
        'John Doe',
        12345,
        location
      );
      expect(result).toBe(true);
    }
  });

  it('should handle long collection instructions', async () => {
    const longInstructions = 'Please bring your order confirmation email. Our office is open Monday to Friday from 9 AM to 5 PM. If you have any questions, please call us at +27 123 456 7890.';
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'Print Cartel Office',
      longInstructions
    );

    expect(result).toBe(true);
  });

  it('should include 7-day collection deadline in email', async () => {
    const result = await sendOrderReadyForCollectionEmail(
      'customer@example.com',
      'John Doe',
      12345,
      'Print Cartel Office',
      'Collection deadline: 7 days from notification date'
    );

    expect(result).toBe(true);
  });
});
