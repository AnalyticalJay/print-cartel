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

  it("accepts files with any MIME type", async () => {
    const textBuffer = Buffer.from("any content");

    const result = await caller.files.upload({
      fileName: "test.txt",
      fileData: textBuffer,
      mimeType: "text/plain",
    });

    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
  });

  it("rejects files exceeding 50MB size limit", async () => {
    const oversizedBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB

    await expect(
      caller.files.upload({
        fileName: "large.png",
        fileData: oversizedBuffer,
        mimeType: "image/png",
      })
    ).rejects.toThrow("exceeds 50MB limit");
  });

  it("accepts any file format including PNG", async () => {
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

  it("accepts any file format including JPG", async () => {
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

  it("accepts any file format including PDF", async () => {
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

  it("accepts files of any size up to 50MB", async () => {
    const largeBuffer = Buffer.alloc(25 * 1024 * 1024); // 25MB

    const result = await caller.files.validateFile({
      fileData: largeBuffer,
      fileName: "test.png",
      mimeType: "image/png",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts any file format", async () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(100000).fill(0)]);

    const result = await caller.files.validateFile({
      fileData: buffer,
      fileName: "test.jpg",
      mimeType: "image/jpeg",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });



  it("rejects oversized files exceeding 50MB", async () => {
    const oversizedBuffer = Buffer.alloc(51 * 1024 * 1024);

    const result = await caller.files.validateFile({
      fileData: oversizedBuffer,
      fileName: "large.png",
      mimeType: "image/png",
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("exceeds 50MB");
  });

  it("rejects empty files", async () => {
    const emptyBuffer = Buffer.alloc(0);

    const result = await caller.files.validateFile({
      fileData: emptyBuffer,
      fileName: "empty.png",
      mimeType: "image/png",
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("empty");
  });


});
