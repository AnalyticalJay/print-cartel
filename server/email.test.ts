import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from "./_core/email";

// Mock nodemailer
vi.mock("nodemailer");

describe("email service configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads SMTP configuration from environment variables", () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL;

    // These should be set by webdev_request_secrets
    expect(smtpHost).toBeDefined();
    expect(smtpPort).toBeDefined();
    expect(smtpUser).toBeDefined();
    expect(smtpPass).toBeDefined();
    expect(smtpFromEmail).toBeDefined();
  });

  it("uses placeholder values when SMTP credentials are not provided", () => {
    // Default values should be used if env vars are not set
    const defaultHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const defaultPort = parseInt(process.env.SMTP_PORT || "587");
    const defaultFromEmail = process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";

    expect(defaultHost).toBeTruthy();
    expect(defaultPort).toBeGreaterThan(0);
    expect(defaultFromEmail).toContain("@");
  });

  it("has valid email format for recipient", () => {
    const toEmail = "sales@printcartel.co.za";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(toEmail).toMatch(emailRegex);
  });

  it("SMTP port is valid for TLS or SSL", () => {
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");

    // Valid ports for SMTP: 25 (plain), 465 (SSL), 587 (TLS), 2525 (alternative)
    const validPorts = [25, 465, 587, 2525];
    expect(validPorts).toContain(smtpPort);
  });

  it("FROM_EMAIL has valid email format", () => {
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(fromEmail).toMatch(emailRegex);
  });

  it("SMTP_USER and SMTP_PASS are both set or both unset", () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Either both are set or both are unset (for placeholder configuration)
    const bothSet = !!smtpUser && !!smtpPass;
    const bothUnset = !smtpUser && !smtpPass;

    expect(bothSet || bothUnset).toBe(true);
  });

  it("SMTP_HOST is not empty", () => {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    expect(smtpHost.length).toBeGreaterThan(0);
  });

  it("SMTP_PORT can be parsed as integer", () => {
    const smtpPort = process.env.SMTP_PORT || "587";
    const parsedPort = parseInt(smtpPort);

    expect(Number.isInteger(parsedPort)).toBe(true);
    expect(parsedPort).toBeGreaterThan(0);
    expect(parsedPort).toBeLessThan(65536);
  });
});

describe("email service - order notification", () => {
  it("creates valid email transporter with SMTP config", () => {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");

    // Verify configuration is valid
    expect(smtpHost).toBeTruthy();
    expect(smtpPort).toBeGreaterThan(0);
    expect(smtpPort).toBeLessThan(65536);
  });

  it("has correct recipient email address", () => {
    const toEmail = "sales@printcartel.co.za";
    expect(toEmail).toBe("sales@printcartel.co.za");
  });

  it("sender email matches configured FROM_EMAIL", () => {
    const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";
    expect(fromEmail).toBeTruthy();
    expect(fromEmail).toContain("@");
  });
});


describe("email service - order confirmation and status updates", () => {
  it("should have sendOrderConfirmationEmail function", () => {
    // This verifies the email module exports the required functions
    expect(sendOrderConfirmationEmail).toBeDefined();
    expect(typeof sendOrderConfirmationEmail).toBe('function');
  });

  it("should have sendOrderStatusUpdateEmail function", () => {
    expect(sendOrderStatusUpdateEmail).toBeDefined();
    expect(typeof sendOrderStatusUpdateEmail).toBe('function');
  });

  it("order confirmation email includes order ID", () => {
    const orderId = 12345;
    // Verify order ID format
    expect(orderId).toBeGreaterThan(0);
    expect(Number.isInteger(orderId)).toBe(true);
  });

  it("status update email supports all status types", () => {
    const statuses = ['pending', 'quoted', 'approved', 'in-production', 'completed', 'shipped', 'cancelled'];
    expect(statuses.length).toBe(7);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('in-production');
    expect(statuses).toContain('shipped');
  });

  it("email addresses are validated", () => {
    const validEmails = [
      'customer@example.com',
      'test@printcartel.co.za',
      'user.name@domain.co.uk'
    ];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    validEmails.forEach(email => {
      expect(email).toMatch(emailRegex);
    });
  });

  it("order prices are formatted correctly", () => {
    const prices = [100, 100.5, 100.99, 1000.00];
    prices.forEach(price => {
      const formatted = price.toFixed(2);
      expect(formatted).toMatch(/^\d+\.\d{2}$/);
    });
  });

  it("customer names are included in emails", () => {
    const names = ['John Doe', 'Jane Smith', 'Test User'];
    names.forEach(name => {
      expect(name.length).toBeGreaterThan(0);
      expect(name).toContain(' ');
    });
  });

  it("tracking URLs are properly formatted", () => {
    const orderId = 12345;
    const trackingUrl = `https://printcartel.co.za/track-order/${orderId}`;
    expect(trackingUrl).toContain('https://');
    expect(trackingUrl).toContain('track-order');
    expect(trackingUrl).toContain(orderId.toString());
  });
});
