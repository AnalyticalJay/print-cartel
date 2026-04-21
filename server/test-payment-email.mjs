#!/usr/bin/env node

/**
 * Test Payment Email Script
 * 
 * This script simulates a successful PayFast payment and triggers the
 * payment receipt email to verify the email system is working correctly.
 * 
 * Usage: node server/test-payment-email.mjs
 */

import { sendPaymentReceiptEmailWithRetry } from "./send-payment-receipt.ts";

async function testPaymentEmail() {
  console.log("🧪 Testing Payment Receipt Email System...\n");

  // Test data simulating a real payment
  const testPaymentData = {
    orderId: 99999,
    invoiceNumber: "INV-99999",
    customerName: "Test Customer",
    customerEmail: "noreply@printcartel.co.za", // Send to your own email for testing
    paymentDate: new Date().toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    paymentMethod: "payfast",
    amountPaid: 500.0,
    totalOrderAmount: 1000.0,
    remainingBalance: 500.0,
    garmentType: "T-Shirt",
    quantity: 50,
    color: "Black",
    size: "Medium",
    deliveryMethod: "delivery",
    deliveryAddress: "123 Main Street, Johannesburg, 2000",
    estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-ZA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ),
    printSpecifications: {
      placement: "Front Center",
      size: "A4",
      colors: 3,
    },
    orderNotes: "Test payment - please verify receipt email was received",
  };

  console.log("📧 Sending test payment receipt email...");
  console.log(`   To: ${testPaymentData.customerEmail}`);
  console.log(`   Order: #${testPaymentData.orderId}`);
  console.log(`   Amount: R${testPaymentData.amountPaid.toFixed(2)}\n`);

  try {
    const result = await sendPaymentReceiptEmailWithRetry(
      testPaymentData.customerEmail,
      testPaymentData,
      3, // maxRetries
      1000 // initialDelayMs
    );

    if (result.success) {
      console.log("✅ SUCCESS: Payment receipt email sent successfully!");
      console.log(`   Attempts: ${result.attempts}`);
      console.log(`   Status: ${result.status}`);
      console.log("\n📋 Email Details:");
      console.log(`   Invoice: ${testPaymentData.invoiceNumber}`);
      console.log(`   Customer: ${testPaymentData.customerName}`);
      console.log(`   Amount Paid: R${testPaymentData.amountPaid.toFixed(2)}`);
      console.log(`   Remaining Balance: R${testPaymentData.remainingBalance.toFixed(2)}`);
      console.log(`   Delivery: ${testPaymentData.deliveryAddress}`);
      console.log(`   Estimated Delivery: ${testPaymentData.estimatedDeliveryDate}`);
      console.log("\n✨ Please check your inbox for the payment receipt email!");
      process.exit(0);
    } else {
      console.error("❌ FAILED: Could not send payment receipt email");
      console.error(`   Error: ${result.error}`);
      console.error(`   Attempts: ${result.attempts}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ ERROR: Unexpected error while sending email:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testPaymentEmail();
