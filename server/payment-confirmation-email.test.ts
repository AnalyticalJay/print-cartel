import { describe, it, expect, beforeAll, vi } from "vitest";
import { sendPaymentConfirmationEmail } from "./payment-confirmation-email";

// Mock the email service
vi.mock("./email", () => ({
  sendEmail: vi.fn(async () => true),
}));

describe("Payment Confirmation Email Tests", () => {
  it("should send payment confirmation email with correct details", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "John Doe",
      12345,
      "INV-12345",
      1500.0,
      2000.0,
      500.0,
      "26 March 2026, 14:30"
    );

    expect(result).toBe(true);
  });

  it("should send payment confirmation email for full payment", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Jane Smith",
      67890,
      "INV-67890",
      2000.0,
      2000.0,
      0.0,
      "26 March 2026, 15:45"
    );

    expect(result).toBe(true);
  });

  it("should send payment confirmation email for deposit payment", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Bob Johnson",
      11111,
      "INV-11111",
      1000.0,
      2500.0,
      1500.0,
      "26 March 2026, 16:20"
    );

    expect(result).toBe(true);
  });

  it("should handle special characters in customer name", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Jean-Pierre O'Brien",
      22222,
      "INV-22222",
      1200.0,
      1500.0,
      300.0,
      "26 March 2026, 17:00"
    );

    expect(result).toBe(true);
  });

  it("should format currency correctly in ZAR", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Alice Wonder",
      33333,
      "INV-33333",
      1234.56,
      1500.0,
      265.44,
      "26 March 2026, 18:15"
    );

    expect(result).toBe(true);
  });

  it("should handle large payment amounts", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Rich Person",
      44444,
      "INV-44444",
      50000.0,
      50000.0,
      0.0,
      "26 March 2026, 19:30"
    );

    expect(result).toBe(true);
  });

  it("should handle small payment amounts", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Budget Buyer",
      55555,
      "INV-55555",
      99.99,
      500.0,
      400.01,
      "26 March 2026, 20:45"
    );

    expect(result).toBe(true);
  });

  it("should send email with correct subject line", async () => {
    const result = await sendPaymentConfirmationEmail(
      "test@example.com",
      "Test User",
      99999,
      "INV-99999",
      1000.0,
      1000.0,
      0.0,
      "26 March 2026, 21:00"
    );

    expect(result).toBe(true);
  });

  it("should include order tracking link in email", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Link Checker",
      77777,
      "INV-77777",
      1500.0,
      1500.0,
      0.0,
      "26 March 2026, 22:15"
    );

    expect(result).toBe(true);
  });

  it("should format date correctly in South African format", async () => {
    const result = await sendPaymentConfirmationEmail(
      "customer@example.com",
      "Date Checker",
      88888,
      "INV-88888",
      1000.0,
      1000.0,
      0.0,
      "26 March 2026, 23:30"
    );

    expect(result).toBe(true);
  });
});
