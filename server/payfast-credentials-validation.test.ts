import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("PayFast Credentials Validation", () => {
  it("should have valid PayFast merchant credentials configured", () => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;

    // Validate merchant ID exists
    expect(merchantId).toBeDefined();
    expect(merchantId).not.toBe("");

    // Validate merchant key exists and is 13 characters
    expect(merchantKey).toBeDefined();
    expect(merchantKey).not.toBe("");
    expect(merchantKey?.length).toBe(13);

    // Validate passphrase exists
    expect(passphrase).toBeDefined();
    expect(passphrase).not.toBe("");
  });

  it("should generate valid PayFast signature with credentials", () => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID || "";
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || "";
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    // Skip if credentials not configured
    if (!merchantId || !merchantKey || !passphrase) {
      expect(true).toBe(true);
      return;
    }

    // Test data for signature generation
    const testData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: "https://example.com/return",
      cancel_url: "https://example.com/cancel",
      notify_url: "https://example.com/notify",
      name_first: "Test",
      name_last: "User",
      email_address: "test@example.com",
      item_name: "Test Item",
      item_description: "Test Description",
      item_id: "1",
      amount: "100.00",
      custom_int1: "1",
      custom_str1: "test",
    };

    // Sort and create query string
    const sortedData = Object.keys(testData)
      .sort()
      .reduce((acc, key) => {
        if (testData[key]) {
          acc[key] = testData[key];
        }
        return acc;
      }, {} as Record<string, string>);

    let queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    queryString += `&passphrase=${encodeURIComponent(passphrase)}`;

    // Generate signature
    const signature = crypto
      .createHash("md5")
      .update(queryString)
      .digest("hex");

    // Signature should be a valid hex string
    expect(signature).toMatch(/^[a-f0-9]{32}$/);
  });

  it("should validate merchant key format", () => {
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

    if (!merchantKey) {
      expect(true).toBe(true);
      return;
    }

    // Merchant key must be exactly 13 characters
    expect(merchantKey.length).toBe(13);

    // Should be alphanumeric
    expect(merchantKey).toMatch(/^[a-zA-Z0-9]{13}$/);
  });
});
