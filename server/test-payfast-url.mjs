#!/usr/bin/env node

/**
 * PayFast Payment URL Test
 * 
 * This script generates a PayFast payment URL with your live credentials
 * to verify the signature is correct and the URL is properly formatted.
 */

import crypto from "crypto";

const MERCHANT_ID = "19428362";
const MERCHANT_KEY = "x9mjrsxlwirog";
const PASSPHRASE = "-,Redemption_2026";
const IS_SANDBOX = false;

function generateSignature(data) {
  // Sort data alphabetically
  const sortedKeys = Object.keys(data).sort();
  
  // Create query string WITHOUT URL encoding
  let queryString = sortedKeys
    .filter(key => data[key])
    .map(key => `${key}=${data[key]}`)
    .join("&");

  // Add passphrase (NOT encoded)
  queryString += `&passphrase=${PASSPHRASE}`;

  console.log("📋 Query String for Signature:");
  console.log(queryString);
  console.log("");

  // Generate MD5 hash
  const signature = crypto.createHash("md5").update(queryString).digest("hex");
  return signature;
}

function generatePaymentUrl(orderId, amount, customerEmail, customerName) {
  const baseUrl = IS_SANDBOX 
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

  const paymentData = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: "https://printcartel.co.za/order/success",
    cancel_url: "https://printcartel.co.za/order/cancel",
    notify_url: "https://printcartel.co.za/api/payfast/notify",
    name_first: customerName.split(" ")[0],
    name_last: customerName.split(" ").slice(1).join(" "),
    email_address: customerEmail,
    m_payment_id: `order-${orderId}`,
    amount: amount.toFixed(2),
    item_name: `Invoice for Order #${orderId}`,
    item_description: `Payment for DTF printing order`,
    custom_int1: orderId.toString(),
    custom_str1: customerEmail,
  };

  const signature = generateSignature(paymentData);

  // Build URL with encoded parameters
  const params = new URLSearchParams();
  Object.entries(paymentData).forEach(([key, value]) => {
    params.append(key, value);
  });
  params.append("signature", signature);

  const paymentUrl = `${baseUrl}?${params.toString()}`;

  return {
    url: paymentUrl,
    signature,
    data: paymentData,
  };
}

console.log("🧪 Testing PayFast Payment URL Generation\n");

// Test data
const orderId = 12345;
const amount = 1500.00;
const customerEmail = "customer@example.com";
const customerName = "John Doe";

console.log(`📦 Order Details:`);
console.log(`   Order ID: ${orderId}`);
console.log(`   Amount: R${amount.toFixed(2)}`);
console.log(`   Customer: ${customerName}`);
console.log(`   Email: ${customerEmail}`);
console.log(`   Mode: ${IS_SANDBOX ? "SANDBOX" : "LIVE PRODUCTION"}`);
console.log("");

const result = generatePaymentUrl(orderId, amount, customerEmail, customerName);

console.log("✅ Generated Signature:");
console.log(result.signature);
console.log("");

console.log("🔗 Payment URL:");
console.log(result.url);
console.log("");

console.log("💡 To test this payment URL:");
console.log("1. Copy the URL above");
console.log("2. Paste it in your browser");
console.log("3. You should be redirected to PayFast payment page");
console.log("4. If you see 'Bad Gateway' or 'Signature Mismatch', the credentials are incorrect");
console.log("");

console.log("✨ If the URL loads successfully, PayFast payment is working!");
