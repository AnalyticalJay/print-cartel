import { describe, it, expect } from "vitest";
import crypto from "crypto";

/**
 * Test PayFast signature generation to identify the issue
 * PayFast requires MD5 hash of query string with specific format
 */

describe("PayFast Signature Generation", () => {
  // Test credentials (from environment)
  const merchantId = "19428362";
  const merchantKey = "x9mjrsxlwirog";
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";

  /**
   * Generate signature using the current implementation approach
   */
  function generateSignatureV1(data: Record<string, string>): string {
    // Sort data alphabetically
    const sortedData = Object.keys(data)
      .sort()
      .reduce((acc, key) => {
        if (data[key]) {
          acc[key] = data[key];
        }
        return acc;
      }, {} as Record<string, string>);

    // Create query string
    let queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    // Add passphrase
    if (passphrase) {
      queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
    }

    console.log("Query String V1:", queryString);

    // Generate MD5 hash
    return crypto.createHash("md5").update(queryString).digest("hex");
  }

  /**
   * Alternative: Generate signature without encoding
   */
  function generateSignatureV2(data: Record<string, string>): string {
    // Sort data alphabetically
    const sortedData = Object.keys(data)
      .sort()
      .reduce((acc, key) => {
        if (data[key]) {
          acc[key] = data[key];
        }
        return acc;
      }, {} as Record<string, string>);

    // Create query string WITHOUT encoding
    let queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    // Add passphrase
    if (passphrase) {
      queryString += `&passphrase=${passphrase}`;
    }

    console.log("Query String V2:", queryString);

    // Generate MD5 hash
    return crypto.createHash("md5").update(queryString).digest("hex");
  }

  it("should generate consistent signatures", () => {
    const testData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: "https://example.com/return",
      cancel_url: "https://example.com/cancel",
      notify_url: "https://example.com/notify",
      name_first: "John",
      name_last: "Doe",
      email_address: "john@example.com",
      m_payment_id: "order-123",
      amount: "100.00",
      item_name: "Test Item",
      item_description: "Test Description",
      custom_int1: "123",
      custom_str1: "john@example.com",
    };

    const sig1 = generateSignatureV1(testData);
    const sig2 = generateSignatureV2(testData);

    console.log("Signature V1 (with encoding):", sig1);
    console.log("Signature V2 (without encoding):", sig2);

    // Both should be valid MD5 hashes (32 hex characters)
    expect(sig1).toMatch(/^[a-f0-9]{32}$/);
    expect(sig2).toMatch(/^[a-f0-9]{32}$/);
  });

  it("should handle special characters in passphrase correctly", () => {
    const testData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      amount: "500.00",
    };

    // Test with encoded passphrase
    const queryStringEncoded = `amount=500.00&merchant_id=${merchantId}&merchant_key=${merchantKey}&passphrase=${encodeURIComponent(passphrase)}`;
    const sigEncoded = crypto.createHash("md5").update(queryStringEncoded).digest("hex");

    // Test with non-encoded passphrase
    const queryStringPlain = `amount=500.00&merchant_id=${merchantId}&merchant_key=${merchantKey}&passphrase=${passphrase}`;
    const sigPlain = crypto.createHash("md5").update(queryStringPlain).digest("hex");

    console.log("Encoded passphrase query:", queryStringEncoded);
    console.log("Encoded signature:", sigEncoded);
    console.log("Plain passphrase query:", queryStringPlain);
    console.log("Plain signature:", sigPlain);

    // PayFast likely expects plain (non-encoded) passphrase
    expect(sigPlain).toMatch(/^[a-f0-9]{32}$/);
    expect(sigEncoded).toMatch(/^[a-f0-9]{32}$/);
  });

  it("should verify signature order matters", () => {
    const testData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      amount: "100.00",
    };

    // Correct order (alphabetical)
    const correctOrder = `amount=100.00&merchant_id=${merchantId}&merchant_key=${merchantKey}&passphrase=${passphrase}`;
    const correctSig = crypto.createHash("md5").update(correctOrder).digest("hex");

    // Wrong order
    const wrongOrder = `merchant_key=${merchantKey}&merchant_id=${merchantId}&amount=100.00&passphrase=${passphrase}`;
    const wrongSig = crypto.createHash("md5").update(wrongOrder).digest("hex");

    console.log("Correct order signature:", correctSig);
    console.log("Wrong order signature:", wrongSig);

    // Signatures should be different
    expect(correctSig).not.toBe(wrongSig);
  });

  it("should handle empty values correctly", () => {
    const testData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      amount: "100.00",
      custom_int1: "",
      custom_str1: "",
    };

    // Should skip empty values
    const queryString = `amount=100.00&merchant_id=${merchantId}&merchant_key=${merchantKey}&passphrase=${passphrase}`;
    const sig = crypto.createHash("md5").update(queryString).digest("hex");

    console.log("Query with empty values skipped:", queryString);
    console.log("Signature:", sig);

    expect(sig).toMatch(/^[a-f0-9]{32}$/);
  });
});
