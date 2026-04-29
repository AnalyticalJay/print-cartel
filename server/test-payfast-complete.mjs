import crypto from "crypto";

// Test data matching your actual order
const merchantId = "19428362";
const merchantKey = "x9mjrsxlwirog";
const passphrase = "-.Redemption_2026"; // CORRECT passphrase with period
const orderId = 1320001;
const amount = "110.00";

// Payment data
const paymentData = {
  merchant_id: merchantId,
  merchant_key: merchantKey,
  return_url: "https://printcartel.co.za/payment/payfast-return",
  cancel_url: "https://printcartel.co.za/dashboard",
  notify_url: "https://printcartel.co.za/api/payment/payfast-notify",
  name_first: "Jamie",
  name_last: "Woodhead",
  email_address: "jayanalytics101@gmail.com",
  m_payment_id: `order-${orderId}`,
  amount: amount,
  item_name: `Invoice for Order #${orderId}`,
  item_description: "Payment for DTF printing order",
  custom_int1: orderId.toString(),
  custom_str1: "jayanalytics101@gmail.com",
};

// Generate signature exactly as PayFast expects
const sortedKeys = Object.keys(paymentData).sort();
let queryString = sortedKeys
  .map((key) => `${key}=${paymentData[key]}`)
  .join("&");

// Add passphrase
queryString += `&passphrase=${passphrase}`;

console.log("=== PayFast Payment Test ===\n");
console.log("Query String for Signature:");
console.log(queryString);
console.log("\n");

// Generate MD5 signature
const signature = crypto.createHash("md5").update(queryString).digest("hex");
console.log(`Generated Signature: ${signature}`);
console.log(`Signature Length: ${signature.length} (should be 32)`);
console.log(`Signature Format: ${/^[a-f0-9]{32}$/i.test(signature) ? "✓ Valid" : "✗ Invalid"}`);
console.log("\n");

// Build the payment URL with proper encoding
const urlParams = Object.entries(paymentData)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join("&");

const paymentUrl = `https://www.payfast.co.za/eng/process?${urlParams}&signature=${encodeURIComponent(signature)}`;

console.log("=== Payment URL ===");
console.log(paymentUrl);
console.log("\n");

// Verify the signature calculation
console.log("=== Verification ===");
console.log(`✓ Merchant ID: ${merchantId}`);
console.log(`✓ Merchant Key: ${merchantKey}`);
console.log(`✓ Passphrase: ${passphrase}`);
console.log(`✓ Amount: R${amount}`);
console.log(`✓ Order ID: ${orderId}`);
console.log(`✓ Mode: LIVE (not sandbox)`);
console.log("\n");

console.log("=== Expected Result ===");
console.log("When you click 'Pay with PayFast', you should be redirected to:");
console.log("https://www.payfast.co.za/eng/process?...");
console.log("\nIf you still get a 400 error, PayFast will show:");
console.log('"Generated signature does not match submitted signature"');
console.log("\nIf the signature is correct, you'll see the PayFast payment form.");
