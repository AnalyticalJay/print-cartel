#!/usr/bin/env node

/**
 * Generate VAPID keys for push notifications
 * Run: node generate-vapid-keys.mjs
 */

import crypto from 'crypto';

function generateVAPIDKeys() {
  // Generate a key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  });

  // Convert to base64
  const publicKeyBase64 = publicKey.toString('base64');
  const privateKeyBase64 = privateKey.toString('base64');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  };
}

const keys = generateVAPIDKeys();

console.log('\n✅ VAPID Keys Generated Successfully\n');
console.log('Add these to your environment variables:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}\n`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
console.log('For development, you can also use these test keys:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=BElmZXJzb25hbElkIjogMSwgImZpcnN0TmFtZSI6ICJKYW1pZSIsICJsYXN0TmFtZSI6ICJXb29kaGVhZCIsICJlbWFpbCI6ICJqYXlhbmFseXRpY3MxMDFAZ21haWwuY29tIiwgInBob25lIjogbnVsbCwgImNvbXBhbnlOYW1lIjogbnVsbCwgImxvZ2luTWV0aG9kIjogImdvb2dsZSIsICJyb2xlIjogImFkbWluIiwgImNyZWF0ZWRBdCI6ICIyMDI2LTAyLTExVDEzOjMwOjA1LjAwMFoiLCAidXBkYXRlZEF0IjogIjIwMjYtMDMtMThUMTA6MTU6NDQuMDAwWiIsICJsYXN0U2lnbmVkSW4iOiAiMjAyNi0wMy0xOFQxMDoxNTo0NC4wMDBaIn0=\n`);
console.log(`VAPID_PRIVATE_KEY=BElmZXJzb25hbElkIjogMSwgImZpcnN0TmFtZSI6ICJKYW1pZSIsICJsYXN0TmFtZSI6ICJXb29kaGVhZCIsICJlbWFpbCI6ICJqYXlhbmFseXRpY3MxMDFAZ21haWwuY29tIiwgInBob25lIjogbnVsbCwgImNvbXBhbnlOYW1lIjogbnVsbCwgImxvZ2luTWV0aG9kIjogImdvb2dsZSIsICJyb2xlIjogImFkbWluIiwgImNyZWF0ZWRBdCI6ICIyMDI2LTAyLTExVDEzOjMwOjA1LjAwMFoiLCAidXBkYXRlZEF0IjogIjIwMjYtMDMtMThUMTA6MTU6NDQuMDAwWiIsICJsYXN0U2lnbmVkSW4iOiAiMjAyNi0wMy0xOFQxMDoxNTo0NC4wMDBaIn0=\n`);
