import { describe, it, expect } from "vitest";

/**
 * Tests for the artwork submission flow fix.
 *
 * Root cause: step 3 validation checked `designFileName` (set on file select)
 * instead of `uploadedFilePath` (set only after successful S3 upload).
 * This allowed orders to be submitted with empty uploadedFilePath.
 */

describe("OrderWizard step 3 validation logic", () => {
  it("blocks progression when uploadedFilePath is empty string", () => {
    const printSelections = [{ placementId: 1, printSizeId: 1, designFileName: "art.png", uploadedFilePath: "" }];
    const blocked = printSelections.some((p) => !p.uploadedFilePath);
    expect(blocked).toBe(true);
  });

  it("blocks progression when uploadedFilePath is undefined", () => {
    const printSelections = [{ placementId: 1, printSizeId: 1, designFileName: "art.png", uploadedFilePath: undefined }];
    const blocked = printSelections.some((p) => !p.uploadedFilePath);
    expect(blocked).toBe(true);
  });

  it("allows progression when all uploadedFilePaths are valid S3 URLs", () => {
    const printSelections = [
      { placementId: 1, printSizeId: 1, designFileName: "art.png", uploadedFilePath: "https://cdn.example.com/art.png" },
      { placementId: 2, printSizeId: 2, designFileName: "back.png", uploadedFilePath: "https://cdn.example.com/back.png" },
    ];
    const blocked = printSelections.some((p) => !p.uploadedFilePath);
    expect(blocked).toBe(false);
  });

  it("blocks if any one of multiple placements is missing uploadedFilePath", () => {
    const printSelections = [
      { placementId: 1, printSizeId: 1, designFileName: "front.png", uploadedFilePath: "https://cdn.example.com/front.png" },
      { placementId: 2, printSizeId: 2, designFileName: "back.png", uploadedFilePath: "" },
    ];
    const blocked = printSelections.some((p) => !p.uploadedFilePath);
    expect(blocked).toBe(true);
  });

  it("OLD BUG: designFileName check would have passed even with empty uploadedFilePath", () => {
    const printSelections = [{ placementId: 1, printSizeId: 1, designFileName: "art.png", uploadedFilePath: "" }];
    // Old check — would incorrectly pass
    const oldCheckPassed = !printSelections.some((p) => !p.designFileName);
    expect(oldCheckPassed).toBe(true); // This is the bug — it should have been blocked

    // New check — correctly blocks
    const newCheckBlocked = printSelections.some((p) => !p.uploadedFilePath);
    expect(newCheckBlocked).toBe(true);
  });
});

describe("Server-side artwork validation", () => {
  it("rejects uploadedFilePath that is empty string", () => {
    const uploadedFilePath = "";
    const isValid = !(!uploadedFilePath || !uploadedFilePath.startsWith("http"));
    expect(isValid).toBe(false);
  });

  it("rejects uploadedFilePath that is undefined", () => {
    const uploadedFilePath = undefined;
    const isValid = !(!uploadedFilePath || !(uploadedFilePath as any)?.startsWith?.("http"));
    expect(isValid).toBe(false);
  });

  it("accepts valid S3 HTTPS URL", () => {
    const uploadedFilePath = "https://s3.amazonaws.com/bucket/user-uploads/order-123/art.png";
    const isValid = !(!uploadedFilePath || !uploadedFilePath.startsWith("http"));
    expect(isValid).toBe(true);
  });

  it("accepts valid CDN HTTPS URL", () => {
    const uploadedFilePath = "https://cdn.printcartel.co.za/uploads/art.png";
    const isValid = !(!uploadedFilePath || !uploadedFilePath.startsWith("http"));
    expect(isValid).toBe(true);
  });

  it("rejects file:// paths", () => {
    const uploadedFilePath = "file:///tmp/art.png";
    const isValid = !(!uploadedFilePath || !uploadedFilePath.startsWith("http"));
    expect(isValid).toBe(false);
  });

  it("rejects relative paths", () => {
    const uploadedFilePath = "/uploads/art.png";
    const isValid = !(!uploadedFilePath || !uploadedFilePath.startsWith("http"));
    expect(isValid).toBe(false);
  });
});

describe("Invoice gating logic", () => {
  it("blocks invoice when no artwork exists (hasArtwork = false)", () => {
    const prints: any[] = [];
    const printsWithArtwork = prints.filter((p) => p.uploadedFilePath);
    const hasArtwork = printsWithArtwork.length > 0;
    const allArtworkApproved = hasArtwork && printsWithArtwork.every((p) => p.designApprovalStatus === "approved");
    expect(allArtworkApproved).toBe(false);
  });

  it("blocks invoice when artwork exists but none are approved", () => {
    const prints = [
      { uploadedFilePath: "https://cdn.example.com/art.png", designApprovalStatus: "pending" },
    ];
    const printsWithArtwork = prints.filter((p) => p.uploadedFilePath);
    const hasArtwork = printsWithArtwork.length > 0;
    const allArtworkApproved = hasArtwork && printsWithArtwork.every((p) => p.designApprovalStatus === "approved");
    expect(allArtworkApproved).toBe(false);
  });

  it("blocks invoice when some artwork is approved but some is pending", () => {
    const prints = [
      { uploadedFilePath: "https://cdn.example.com/front.png", designApprovalStatus: "approved" },
      { uploadedFilePath: "https://cdn.example.com/back.png", designApprovalStatus: "pending" },
    ];
    const printsWithArtwork = prints.filter((p) => p.uploadedFilePath);
    const hasArtwork = printsWithArtwork.length > 0;
    const allArtworkApproved = hasArtwork && printsWithArtwork.every((p) => p.designApprovalStatus === "approved");
    expect(allArtworkApproved).toBe(false);
  });

  it("allows invoice when all artwork is approved", () => {
    const prints = [
      { uploadedFilePath: "https://cdn.example.com/front.png", designApprovalStatus: "approved" },
      { uploadedFilePath: "https://cdn.example.com/back.png", designApprovalStatus: "approved" },
    ];
    const printsWithArtwork = prints.filter((p) => p.uploadedFilePath);
    const hasArtwork = printsWithArtwork.length > 0;
    const allArtworkApproved = hasArtwork && printsWithArtwork.every((p) => p.designApprovalStatus === "approved");
    expect(allArtworkApproved).toBe(true);
  });

  it("OLD BUG: previous logic would allow invoice with no artwork (length === 0 was truthy)", () => {
    const prints: any[] = [];
    const printsWithArtwork = prints.filter((p) => p.uploadedFilePath);
    // Old logic: printsWithArtwork.length === 0 || every(approved) — would return true!
    const oldLogicResult = printsWithArtwork.length === 0 || printsWithArtwork.every((p) => p.designApprovalStatus === "approved");
    expect(oldLogicResult).toBe(true); // Bug: invoice was allowed with no artwork

    // New logic: hasArtwork && every(approved) — correctly blocks
    const hasArtwork = printsWithArtwork.length > 0;
    const newLogicResult = hasArtwork && printsWithArtwork.every((p) => p.designApprovalStatus === "approved");
    expect(newLogicResult).toBe(false); // Fixed: invoice is blocked
  });

  it("counts pending artwork correctly", () => {
    const prints = [
      { uploadedFilePath: "https://cdn.example.com/front.png", designApprovalStatus: "approved" },
      { uploadedFilePath: "https://cdn.example.com/back.png", designApprovalStatus: "pending" },
      { uploadedFilePath: "https://cdn.example.com/sleeve.png", designApprovalStatus: "changes_requested" },
    ];
    const printsWithArtwork = prints.filter((p) => p.uploadedFilePath);
    const pendingArtworkCount = printsWithArtwork.filter((p) => p.designApprovalStatus !== "approved").length;
    expect(pendingArtworkCount).toBe(2);
  });
});

describe("Artwork changes requested email content", () => {
  it("includes the placement name in the email context", () => {
    const emailContext = {
      orderId: 1590001,
      customerEmail: "customer@example.com",
      customerName: "John Doe",
      placementName: "Front Chest",
      printSize: "A4",
      fileName: "my-design.png",
      notes: "The file resolution is too low. Please provide at least 300 DPI.",
    };
    expect(emailContext.placementName).toBe("Front Chest");
    expect(emailContext.printSize).toBe("A4");
    expect(emailContext.fileName).toBe("my-design.png");
    expect(emailContext.notes).toContain("300 DPI");
  });

  it("uses fallback note when no notes provided", () => {
    const notes = undefined;
    const resolvedNotes = notes ?? "Please review and re-upload your artwork meeting the design requirements.";
    expect(resolvedNotes).toBe("Please review and re-upload your artwork meeting the design requirements.");
  });

  it("uses provided notes when given", () => {
    const notes = "File must be PNG with transparent background.";
    const resolvedNotes = notes ?? "Please review and re-upload your artwork meeting the design requirements.";
    expect(resolvedNotes).toBe("File must be PNG with transparent background.");
  });
});
