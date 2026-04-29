#!/usr/bin/env node

/**
 * Verify the signature from the actual payment URL
 */

import crypto from "crypto";

const MERCHANT_ID = "19428362";
const MERCHANT_KEY = "x9mjrsxlwirog";
const PASSPHRASE = "-,Redemption_2026";

// Data from the actual URL
const actualData = {
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

const actualSignature = "1c1f33f4d319e1a68fca6ab99fac5412";

console.log("🔍 Analyzing the actual payment URL\n");
console.log("Actual Signature from URL:", actualSignature);
console.log("\nData sent to PayFast:");
console.log(JSON.stringify(actualData, null, 2));

// Test 1: Calculate signature with ALL fields
console.log("\n\n=== Test 1: Signature with ALL fields ===");
let queryString = "";
Object.keys(actualData)
  .sort()
  .forEach((key) => {
    if (actualData[key]) {
      queryString += `${key}=${String(actualData[key])}&`;
    }
  });
queryString = queryString.slice(0, -1);
queryString += `&passphrase=${PASSPHRASE}`;

console.log("Query String:");
console.log(queryString);

const sig1 = crypto.createHash("md5").update(queryString).digest("hex");
console.log("Calculated Signature:", sig1);
console.log("Match?", sig1 === actualSignature ? "✅ YES" : "❌ NO");

// Test 2: Calculate signature with ONLY required fields
console.log("\n\n=== Test 2: Signature with ONLY required fields ===");
const requiredFields = {
  merchant_id: actualData.merchant_id,
  merchant_key: actualData.merchant_key,
  return_url: actualData.return_url,
  cancel_url: actualData.cancel_url,
  notify_url: actualData.notify_url,
  m_payment_id: actualData.m_payment_id,
  amount: actualData.amount,
};

queryString = "";
Object.keys(requiredFields)
  .sort()
  .forEach((key) => {
    if (requiredFields[key]) {
      queryString += `${key}=${String(requiredFields[key])}&`;
    }
  });
queryString = queryString.slice(0, -1);
queryString += `&passphrase=${PASSPHRASE}`;

console.log("Query String:");
console.log(queryString);

const sig2 = crypto.createHash("md5").update(queryString).digest("hex");
console.log("Calculated Signature:", sig2);
console.log("Match?", sig2 === actualSignature ? "✅ YES" : "❌ NO");

// Test 3: Try with different m_payment_id format
console.log("\n\n=== Test 3: m_payment_id without 'order-' prefix ===");
const requiredFields3 = {
  merchant_id: actualData.merchant_id,
  merchant_key: actualData.merchant_key,
  return_url: actualData.return_url,
  cancel_url: actualData.cancel_url,
  notify_url: actualData.notify_url,
  m_payment_id: "1320001",  // Just the number
  amount: actualData.amount,
};

queryString = "";
Object.keys(requiredFields3)
  .sort()
  .forEach((key) => {
    if (requiredFields3[key]) {
      queryString += `${key}=${String(requiredFields3[key])}&`;
    }
  });
queryString = queryString.slice(0, -1);
queryString += `&passphrase=${PASSPHRASE}`;

console.log("Query String:");
console.log(queryString);

const sig3 = crypto.createHash("md5").update(queryString).digest("hex");
console.log("Calculated Signature:", sig3);
console.log("Match?", sig3 === actualSignature ? "✅ YES" : "❌ NO");

// Test 4: Check if PayFast expects the signature to be calculated AFTER encoding
console.log("\n\n=== Test 4: With URL-encoded values ===");
const requiredFields4 = {
  merchant_id: actualData.merchant_id,
  merchant_key: actualData.merchant_key,
  return_url: encodeURIComponent(actualData.return_url),
  cancel_url: encodeURIComponent(actualData.cancel_url),
  notify_url: encodeURIComponent(actualData.notify_url),
  m_payment_id: actualData.m_payment_id,
  amount: actualData.amount,
};

queryString = "";
Object.keys(requiredFields4)
  .sort()
  .forEach((key) => {
    if (requiredFields4[key]) {
      queryString += `${key}=${String(requiredFields4[key])}&`;
    }
  });
queryString = queryString.slice(0, -1);
queryString += `&passphrase=${PASSPHRASE}`;

console.log("Query String:");
console.log(queryString);

const sig4 = crypto.createHash("md5").update(queryString).digest("hex");
console.log("Calculated Signature:", sig4);
console.log("Match?", sig4 === actualSignature ? "✅ YES" : "❌ NO");

console.log("\n\n=== Summary ===");
console.log("If none of the above match, the issue might be:");
console.log("1. Passphrase is incorrect");
console.log("2. Merchant ID or Key is incorrect");
console.log("3. PayFast expects a different field order or subset");
console.log("4. PayFast is using a different hashing algorithm");
