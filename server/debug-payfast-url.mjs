#!/usr/bin/env node

/**
 * Debug PayFast URL Generation
 * This script logs the exact URL and signature being generated
 */

import crypto from "crypto";

const MERCHANT_ID = "19428362";
const MERCHANT_KEY = "x9mjrsxlwirog";
const PASSPHRASE = "-,Redemption_2026";

function generatePayFastSignature(data, passphrase) {
  // Convert data to query string format WITHOUT encoding (PayFast requirement)
  let queryString = "";
  Object.keys(data)
    .sort()
    .forEach((key) => {
      if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
        queryString += `${key}=${String(data[key])}&`;
      }
    });

  // Remove trailing ampersand
  queryString = queryString.slice(0, -1);

  // Add passphrase (NOT encoded)
  if (passphrase) {
    queryString += `&passphrase=${passphrase}`;
  }

  console.log("\n📋 Query String for Signature (UNENCODED):");
  console.log(queryString);

  // Generate MD5 hash
  const signature = crypto.createHash("md5").update(queryString).digest("hex");
  console.log("\n✅ Generated Signature:");
  console.log(signature);

  return signature;
}

function buildPayFastPaymentUrl(config, paymentData) {
  const baseUrl = config.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

  // Build payment data object
  const data = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: paymentData.returnUrl,
    cancel_url: paymentData.cancelUrl,
    notify_url: paymentData.notifyUrl,
    name_first: paymentData.customerName.split(" ")[0],
    name_last: paymentData.customerName.split(" ").slice(1).join(" ") || "",
    email_address: paymentData.customerEmail,
    m_payment_id: `order_${paymentData.orderId}`,
    amount: paymentData.amount.toFixed(2),
    item_name: paymentData.description,
    item_description: `Order #${paymentData.orderId}`,
  };

  console.log("\n📦 Payment Data Object:");
  console.log(JSON.stringify(data, null, 2));

  // Generate signature
  const signature = generatePayFastSignature(data, config.passphrase);
  data.signature = signature;

  // Build query string with proper encoding
  const queryString = Object.keys(data)
    .map((key) => `${key}=${encodeURIComponent(String(data[key]))}`)
    .join("&");

  console.log("\n🔗 Final Payment URL (with URL encoding):");
  const url = `${baseUrl}?${queryString}`;
  console.log(url);

  return url;
}

console.log("🧪 PayFast URL Generation Debug\n");
console.log("Configuration:");
console.log(`  Merchant ID: ${MERCHANT_ID}`);
console.log(`  Merchant Key: ${MERCHANT_KEY}`);
console.log(`  Passphrase: ${PASSPHRASE}`);
console.log(`  Mode: LIVE PRODUCTION`);

const url = buildPayFastPaymentUrl(
  {
    merchantId: MERCHANT_ID,
    merchantKey: MERCHANT_KEY,
    passphrase: PASSPHRASE,
    sandbox: false,
  },
  {
    orderId: 12345,
    amount: 1500.0,
    customerEmail: "test@example.com",
    customerName: "Test Customer",
    description: "Print Cartel Order #12345",
    returnUrl: "https://printcartel.co.za/payment-success?orderId=12345",
    cancelUrl: "https://printcartel.co.za/payment?orderId=12345",
    notifyUrl: "https://printcartel.co.za/api/payfast/callback",
  }
);

console.log("\n✨ Payment URL is ready to be sent to PayFast");
console.log("\nTo test:");
console.log("1. Copy the URL above");
console.log("2. Paste it in your browser");
console.log("3. If signature is correct, you'll see PayFast payment page");
console.log("4. If signature is wrong, you'll see 400 Bad Request");
