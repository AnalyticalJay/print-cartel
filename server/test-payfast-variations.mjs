#!/usr/bin/env node

/**
 * Test PayFast Signature Variations
 * 
 * PayFast might be sensitive to:
 * 1. Query parameters in URLs (like ?orderId=12345)
 * 2. Special characters in URLs
 * 3. Trailing slashes
 * 4. Parameter order
 */

import crypto from "crypto";

const MERCHANT_ID = "19428362";
const MERCHANT_KEY = "x9mjrsxlwirog";
const PASSPHRASE = "-,Redemption_2026";

function generateSignature(data, passphrase) {
  let queryString = "";
  Object.keys(data)
    .sort()
    .forEach((key) => {
      if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
        queryString += `${key}=${String(data[key])}&`;
      }
    });
  queryString = queryString.slice(0, -1);
  if (passphrase) {
    queryString += `&passphrase=${passphrase}`;
  }
  return crypto.createHash("md5").update(queryString).digest("hex");
}

console.log("🔍 Testing PayFast Signature Variations\n");

// Test 1: With query parameters in return_url
console.log("Test 1: return_url WITH query parameters");
const data1 = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "https://printcartel.co.za/payment-success?orderId=12345",
  cancel_url: "https://printcartel.co.za/payment?orderId=12345",
  notify_url: "https://printcartel.co.za/api/payfast/callback",
  name_first: "Test",
  name_last: "Customer",
  email_address: "test@example.com",
  m_payment_id: "order_12345",
  amount: "1500.00",
  item_name: "Print Cartel Order #12345",
  item_description: "Order #12345",
};
const sig1 = generateSignature(data1, PASSPHRASE);
console.log(`Signature: ${sig1}\n`);

// Test 2: Without query parameters in return_url
console.log("Test 2: return_url WITHOUT query parameters");
const data2 = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "https://printcartel.co.za/payment-success",
  cancel_url: "https://printcartel.co.za/payment",
  notify_url: "https://printcartel.co.za/api/payfast/callback",
  name_first: "Test",
  name_last: "Customer",
  email_address: "test@example.com",
  m_payment_id: "order_12345",
  amount: "1500.00",
  item_name: "Print Cartel Order #12345",
  item_description: "Order #12345",
};
const sig2 = generateSignature(data2, PASSPHRASE);
console.log(`Signature: ${sig2}\n`);

// Test 3: With different m_payment_id format
console.log("Test 3: m_payment_id format: 12345 (without 'order_' prefix)");
const data3 = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "https://printcartel.co.za/payment-success?orderId=12345",
  cancel_url: "https://printcartel.co.za/payment?orderId=12345",
  notify_url: "https://printcartel.co.za/api/payfast/callback",
  name_first: "Test",
  name_last: "Customer",
  email_address: "test@example.com",
  m_payment_id: "12345",
  amount: "1500.00",
  item_name: "Print Cartel Order #12345",
  item_description: "Order #12345",
};
const sig3 = generateSignature(data3, PASSPHRASE);
console.log(`Signature: ${sig3}\n`);

// Test 4: Check if PayFast expects specific field order
console.log("Test 4: Minimal fields (only required ones)");
const data4 = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "https://printcartel.co.za/payment-success?orderId=12345",
  cancel_url: "https://printcartel.co.za/payment?orderId=12345",
  notify_url: "https://printcartel.co.za/api/payfast/callback",
  m_payment_id: "order_12345",
  amount: "1500.00",
};
const sig4 = generateSignature(data4, PASSPHRASE);
console.log(`Signature: ${sig4}\n`);

// Test 5: Check with custom fields
console.log("Test 5: With custom fields (custom_int1, custom_str1)");
const data5 = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: "https://printcartel.co.za/payment-success?orderId=12345",
  cancel_url: "https://printcartel.co.za/payment?orderId=12345",
  notify_url: "https://printcartel.co.za/api/payfast/callback",
  name_first: "Test",
  name_last: "Customer",
  email_address: "test@example.com",
  m_payment_id: "order_12345",
  amount: "1500.00",
  item_name: "Print Cartel Order #12345",
  item_description: "Order #12345",
  custom_int1: "12345",
  custom_str1: "test@example.com",
};
const sig5 = generateSignature(data5, PASSPHRASE);
console.log(`Signature: ${sig5}\n`);

console.log("💡 Recommendations:");
console.log("1. Try without query parameters in return_url/cancel_url");
console.log("2. Try with just the m_payment_id (12345) instead of (order_12345)");
console.log("3. Try with minimal required fields");
console.log("4. Check PayFast merchant dashboard for any field restrictions");
