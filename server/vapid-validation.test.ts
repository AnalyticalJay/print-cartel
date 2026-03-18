import { describe, it, expect } from "vitest";

describe("VAPID Keys Configuration", () => {
  it("should have VAPID_PRIVATE_KEY in environment", () => {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    expect(privateKey).toBeDefined();
    expect(privateKey).toContain("MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0");
  });

  it("should have VITE_VAPID_PUBLIC_KEY in environment", () => {
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    expect(publicKey).toBeDefined();
    expect(publicKey).toContain("MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAERdQ5");
  });

  it("should have valid VAPID key format", () => {
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;

    // VAPID private key should be a valid base64 encoded EC private key
    expect(privateKey).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(privateKey?.length).toBeGreaterThan(100);

    // VAPID public key should be a valid base64 encoded EC public key
    expect(publicKey).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(publicKey?.length).toBeGreaterThan(50);
  });

  it("should be able to convert public key to Uint8Array", () => {
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    expect(publicKey).toBeDefined();

    // Test conversion from base64 to Uint8Array
    const binaryString = atob(publicKey!);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBeDefined();
  });
});
