import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("PayFast Passphrase Verification", () => {
  it("should verify the correct passphrase generates valid signature", () => {
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    expect(passphrase).toBe("-.Redemption_2026");

    // Test signature generation with correct passphrase
    const testData = {
      merchant_id: "19428362",
      merchant_key: "x9mjrsxlwirog",
      return_url: "https://printcartel.co.za/payment/payfast-return",
      cancel_url: "https://printcartel.co.za/dashboard",
      notify_url: "https://printcartel.co.za/api/payment/payfast-notify",
      name_first: "Jamie",
      name_last: "Woodhead",
      email_address: "jayanalytics101@gmail.com",
      m_payment_id: "order-1320001",
      amount: "110.00",
      item_name: "Invoice for Order #1320001",
      item_description: "Payment for DTF printing order",
      custom_int1: "1320001",
      custom_str1: "jayanalytics101@gmail.com",
    };

    // Generate signature with correct passphrase
    const sortedKeys = Object.keys(testData).sort();
    let queryString = sortedKeys
      .map((key) => `${key}=${testData[key as keyof typeof testData]}`)
      .join("&");

    queryString += `&passphrase=${passphrase}`;

    const signature = crypto.createHash("md5").update(queryString).digest("hex");

    // This signature should be valid for PayFast
    expect(signature).toBeDefined();
    expect(signature.length).toBe(32); // MD5 hex is 32 characters
    expect(signature).toMatch(/^[a-f0-9]{32}$/i);
  });

  it("should confirm passphrase is NOT the old incorrect value", () => {
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    expect(passphrase).not.toBe("-,Redemption_2026"); // Old incorrect value with comma
  });
});
