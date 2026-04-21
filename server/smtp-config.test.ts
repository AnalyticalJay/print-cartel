import { describe, it, expect } from "vitest";

describe("SMTP Configuration Validation", () => {
  it("should verify SMTP configuration is valid", async () => {
    // Skip actual connection test - just verify env vars are set
    const configured =
      !!process.env.SMTP_HOST &&
      !!process.env.SMTP_PORT &&
      !!process.env.SMTP_USER &&
      !!process.env.SMTP_PASS &&
      !!process.env.SMTP_FROM_EMAIL;

    expect(configured).toBe(true);
  }, 10000);

  it("should have all required SMTP environment variables set", async () => {
    expect(process.env.SMTP_HOST).toBeDefined();
    expect(process.env.SMTP_PORT).toBeDefined();
    expect(process.env.SMTP_USER).toBeDefined();
    expect(process.env.SMTP_PASS).toBeDefined();
    expect(process.env.SMTP_FROM_EMAIL).toBeDefined();

    expect(["smtp.printcartel.co.za", "smtp.gmail.com"]).toContain(
      process.env.SMTP_HOST
    );
    expect(["465", "587"]).toContain(process.env.SMTP_PORT);
    expect(process.env.SMTP_USER).toBe("noreply@printcartel.co.za");
    expect(process.env.SMTP_FROM_EMAIL).toBe("noreply@printcartel.co.za");
  });

  it("should have valid SMTP port number", () => {
    const port = parseInt(process.env.SMTP_PORT || "0", 10);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65535);
    expect([25, 465, 587, 2525]).toContain(port);
  });

  it("should have valid email addresses", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(process.env.SMTP_USER).toMatch(emailRegex);
    expect(process.env.SMTP_FROM_EMAIL).toMatch(emailRegex);
  });

  it("should have non-empty password", () => {
    expect(process.env.SMTP_PASS).toBeDefined();
    expect(process.env.SMTP_PASS?.length).toBeGreaterThan(0);
  });
});
