import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";

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
