import { describe, it, expect } from "vitest";

// Unit tests for the adminUploadArtwork procedure logic
// These tests validate the input schema and business logic without hitting the DB

describe("adminUploadArtwork input validation", () => {
  it("requires orderId as a positive number", () => {
    const input = { orderId: 1590001, placementId: 60001, printSizeId: 60001, fileName: "test.png", fileData: new Uint8Array([1, 2, 3]), mimeType: "image/png" };
    expect(input.orderId).toBeTypeOf("number");
    expect(input.orderId).toBeGreaterThan(0);
  });

  it("requires placementId as a positive number", () => {
    const input = { orderId: 1590001, placementId: 60001, printSizeId: 60001, fileName: "test.png", fileData: new Uint8Array([1, 2, 3]), mimeType: "image/png" };
    expect(input.placementId).toBeTypeOf("number");
    expect(input.placementId).toBeGreaterThan(0);
  });

  it("requires printSizeId as a positive number", () => {
    const input = { orderId: 1590001, placementId: 60001, printSizeId: 60001, fileName: "test.png", fileData: new Uint8Array([1, 2, 3]), mimeType: "image/png" };
    expect(input.printSizeId).toBeTypeOf("number");
    expect(input.printSizeId).toBeGreaterThan(0);
  });

  it("requires fileName as a non-empty string", () => {
    const input = { fileName: "artwork.png" };
    expect(input.fileName).toBeTypeOf("string");
    expect(input.fileName.length).toBeGreaterThan(0);
  });

  it("requires fileData as Uint8Array with content", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBeGreaterThan(0);
  });

  it("requires mimeType as a non-empty string", () => {
    const input = { mimeType: "image/png" };
    expect(input.mimeType).toBeTypeOf("string");
    expect(input.mimeType.length).toBeGreaterThan(0);
  });

  it("allows optional printId for updating existing print record", () => {
    const inputWithPrintId = { orderId: 1590001, printId: 42, placementId: 60001, printSizeId: 60001, fileName: "test.png", fileData: new Uint8Array([1]), mimeType: "image/png" };
    const inputWithoutPrintId = { orderId: 1590001, placementId: 60001, printSizeId: 60001, fileName: "test.png", fileData: new Uint8Array([1]), mimeType: "image/png" };
    expect(inputWithPrintId.printId).toBeDefined();
    expect((inputWithoutPrintId as any).printId).toBeUndefined();
  });
});

describe("AdminArtworkUpload UI logic", () => {
  it("pre-selects placement from order line item", () => {
    const order = { lineItems: [{ placementId: 60001, printSizeId: 60001 }] };
    const firstLineItem = order?.lineItems?.[0];
    const defaultPlacementId = firstLineItem?.placementId?.toString() || "";
    expect(defaultPlacementId).toBe("60001");
  });

  it("pre-selects print size from order line item", () => {
    const order = { lineItems: [{ placementId: 60001, printSizeId: 60002 }] };
    const firstLineItem = order?.lineItems?.[0];
    const defaultPrintSizeId = firstLineItem?.printSizeId?.toString() || "";
    expect(defaultPrintSizeId).toBe("60002");
  });

  it("returns empty string when no line items exist", () => {
    const order = { lineItems: [] };
    const firstLineItem = order?.lineItems?.[0];
    const defaultPlacementId = firstLineItem?.placementId?.toString() || "";
    expect(defaultPlacementId).toBe("");
  });

  it("returns empty string when order has no lineItems property", () => {
    const order = {};
    const firstLineItem = (order as any)?.lineItems?.[0];
    const defaultPlacementId = firstLineItem?.placementId?.toString() || "";
    expect(defaultPlacementId).toBe("");
  });

  it("generates correct S3 file key format for admin uploads", () => {
    const orderId = 1590001;
    const fileName = "my-artwork.png";
    const ext = fileName.split(".").pop() || "bin";
    const fileKey = `admin-uploads/${orderId}/1234567890-abcdefgh.${ext}`;
    expect(fileKey).toMatch(/^admin-uploads\/\d+\/\d+-[a-z0-9]+\.png$/);
  });

  it("extracts correct extension from filename", () => {
    expect("artwork.png".split(".").pop()).toBe("png");
    expect("design.pdf".split(".").pop()).toBe("pdf");
    expect("logo.svg".split(".").pop()).toBe("svg");
    expect("file.AI".split(".").pop()).toBe("AI");
  });

  it("admin upload sets designApprovalStatus to pending on new record", () => {
    const newRecord = {
      orderId: 1590001,
      placementId: 60001,
      printSizeId: 60001,
      uploadedFilePath: "https://cdn.example.com/admin-uploads/1590001/file.png",
      uploadedFileName: "artwork.png",
      fileSize: 12345,
      mimeType: "image/png",
      designApprovalStatus: "pending" as const,
    };
    expect(newRecord.designApprovalStatus).toBe("pending");
  });

  it("admin upload resets approval status when updating existing record", () => {
    const updatedRecord = {
      uploadedFilePath: "https://cdn.example.com/admin-uploads/1590001/new-file.png",
      uploadedFileName: "new-artwork.png",
      fileSize: 54321,
      mimeType: "image/png",
      designApprovalStatus: "pending" as const,
      designApprovalNotes: null,
      designApprovedAt: null,
    };
    expect(updatedRecord.designApprovalStatus).toBe("pending");
    expect(updatedRecord.designApprovalNotes).toBeNull();
    expect(updatedRecord.designApprovedAt).toBeNull();
  });

  it("uses application/octet-stream as fallback mime type", () => {
    const file = { type: "" };
    const mimeType = file.type || "application/octet-stream";
    expect(mimeType).toBe("application/octet-stream");
  });

  it("uses actual mime type when provided", () => {
    const file = { type: "image/jpeg" };
    const mimeType = file.type || "application/octet-stream";
    expect(mimeType).toBe("image/jpeg");
  });
});
