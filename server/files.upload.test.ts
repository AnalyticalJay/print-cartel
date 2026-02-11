import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("files.upload", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createPublicContext();
    caller = appRouter.createCaller(ctx);
  });

  it("rejects files with invalid MIME type", async () => {
    const invalidBuffer = Buffer.from("invalid content");

    await expect(
      caller.files.upload({
        fileName: "test.txt",
        fileData: invalidBuffer,
        mimeType: "text/plain",
      })
    ).rejects.toThrow("Invalid file type");
  });

  it("rejects files exceeding 25MB size limit", async () => {
    const oversizedBuffer = Buffer.alloc(26 * 1024 * 1024); // 26MB

    await expect(
      caller.files.upload({
        fileName: "large.png",
        fileData: oversizedBuffer,
        mimeType: "image/png",
      })
    ).rejects.toThrow("exceeds 25MB limit");
  });

  it("accepts valid PNG files", async () => {
    // Create a minimal valid PNG buffer
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      ...Array(1000).fill(0), // Additional data
    ]);

    const result = await caller.files.upload({
      fileName: "test.png",
      fileData: pngBuffer,
      mimeType: "image/png",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("fileKey");
    expect(result.fileName).toBe("test.png");
    expect(result.fileSize).toBe(pngBuffer.length);
  });

  it("accepts valid JPG files", async () => {
    const jpgBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, // JPG signature
      ...Array(1000).fill(0),
    ]);

    const result = await caller.files.upload({
      fileName: "test.jpg",
      fileData: jpgBuffer,
      mimeType: "image/jpeg",
    });

    expect(result).toHaveProperty("success", true);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("accepts valid PDF files", async () => {
    const pdfBuffer = Buffer.from([
      0x25, 0x50, 0x44, 0x46, // %PDF
      ...Array(1000).fill(0),
    ]);

    const result = await caller.files.upload({
      fileName: "test.pdf",
      fileData: pdfBuffer,
      mimeType: "application/pdf",
    });

    expect(result).toHaveProperty("success", true);
    expect(result.mimeType).toBe("application/pdf");
  });

  it("generates unique file keys with random suffixes", async () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(1000).fill(0)]);

    const result1 = await caller.files.upload({
      fileName: "test.png",
      fileData: buffer,
      mimeType: "image/png",
    });

    const result2 = await caller.files.upload({
      fileName: "test.png",
      fileData: buffer,
      mimeType: "image/png",
    });

    expect(result1.fileKey).not.toBe(result2.fileKey);
    expect(result1.fileKey).toMatch(/uploads\/\d+-[a-zA-Z0-9_-]{8}\.png/);
    expect(result2.fileKey).toMatch(/uploads\/\d+-[a-zA-Z0-9_-]{8}\.png/);
  });

  it("preserves original file extension", async () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(1000).fill(0)]);

    const result = await caller.files.upload({
      fileName: "my-design.png",
      fileData: buffer,
      mimeType: "image/png",
    });

    expect(result.fileKey).toMatch(/\.png$/);
  });
});

describe("files.validateFile", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createPublicContext();
    caller = appRouter.createCaller(ctx);
  });

  it("validates PNG files successfully", async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(100000).fill(0)]);

    const result = await caller.files.validateFile({
      fileData: pngBuffer,
      fileName: "test.png",
      mimeType: "image/png",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("warns about small image files", async () => {
    const smallBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(1000).fill(0)]);

    const result = await caller.files.validateFile({
      fileData: smallBuffer,
      fileName: "small.png",
      mimeType: "image/png",
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("too small");
  });

  it("warns about JPG format", async () => {
    const jpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(100000).fill(0)]);

    const result = await caller.files.validateFile({
      fileData: jpgBuffer,
      fileName: "test.jpg",
      mimeType: "image/jpeg",
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("PNG format");
  });

  it("rejects invalid file types", async () => {
    const buffer = Buffer.from("invalid");

    const result = await caller.files.validateFile({
      fileData: buffer,
      fileName: "test.txt",
      mimeType: "text/plain",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects oversized files", async () => {
    const oversizedBuffer = Buffer.alloc(26 * 1024 * 1024);

    const result = await caller.files.validateFile({
      fileData: oversizedBuffer,
      fileName: "large.png",
      mimeType: "image/png",
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("exceeds 25MB");
  });
});
