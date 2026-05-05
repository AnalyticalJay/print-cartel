import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("SMTP_SKIP_SSL_VERIFY env flag", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("should disable cert verification when SMTP_SKIP_SSL_VERIFY=true", async () => {
    process.env.SMTP_SKIP_SSL_VERIFY = "true";
    process.env.SMTP_HOST = "mail.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "testpass";

    const { getTransporter, resetTransporter } = await import("./mailer");
    resetTransporter();
    const transporter = getTransporter();
    const options = (transporter as any).options;
    expect(options.tls?.rejectUnauthorized).toBe(false);
    resetTransporter();
  });

  it("should enforce cert verification when SMTP_SKIP_SSL_VERIFY is not set", async () => {
    delete process.env.SMTP_SKIP_SSL_VERIFY;
    process.env.SMTP_HOST = "mail.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "testpass";

    const { getTransporter, resetTransporter } = await import("./mailer");
    resetTransporter();
    const transporter = getTransporter();
    const options = (transporter as any).options;
    expect(options.tls?.rejectUnauthorized).toBe(true);
    resetTransporter();
  });

  it("should use secure=true on port 465", async () => {
    process.env.SMTP_PORT = "465";
    process.env.SMTP_HOST = "mail.example.com";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "testpass";

    const { getTransporter, resetTransporter } = await import("./mailer");
    resetTransporter();
    const transporter = getTransporter();
    const options = (transporter as any).options;
    expect(options.secure).toBe(true);
    resetTransporter();
  });

  it("should use secure=false on port 587", async () => {
    process.env.SMTP_PORT = "587";
    process.env.SMTP_HOST = "mail.example.com";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "testpass";

    const { getTransporter, resetTransporter } = await import("./mailer");
    resetTransporter();
    const transporter = getTransporter();
    const options = (transporter as any).options;
    expect(options.secure).toBe(false);
    resetTransporter();
  });
});
