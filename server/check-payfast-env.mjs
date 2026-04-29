console.log("=== PayFast Environment Variables ===\n");
console.log(`PAYFAST_MERCHANT_ID: ${process.env.PAYFAST_MERCHANT_ID}`);
console.log(`PAYFAST_MERCHANT_KEY: ${process.env.PAYFAST_MERCHANT_KEY}`);
console.log(`PAYFAST_PASSPHRASE: ${process.env.PAYFAST_PASSPHRASE}`);
console.log(`PAYFAST_SANDBOX: ${process.env.PAYFAST_SANDBOX}`);
console.log("\n=== Expected Values ===");
console.log(`Merchant ID should be: 19428362`);
console.log(`Merchant Key should be: x9mjrsxlwirog`);
console.log(`Passphrase should be: -.Redemption_2026 (with period, not comma)`);
console.log(`Sandbox should be: false (for live)`);
console.log("\n=== Verification ===");
const passphrase = process.env.PAYFAST_PASSPHRASE;
if (passphrase === "-.Redemption_2026") {
  console.log("✓ Passphrase is CORRECT");
} else if (passphrase === "-,Redemption_2026") {
  console.log("✗ Passphrase is WRONG - still has comma instead of period");
} else {
  console.log(`✗ Passphrase is unexpected: ${passphrase}`);
}
