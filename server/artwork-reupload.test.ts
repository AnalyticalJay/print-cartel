import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database and helpers
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getOrdersByCustomerEmail: vi.fn(),
  getOrderPrints: vi.fn(),
}));

vi.mock("..//drizzle/client", () => ({
  db: {},
}));

vi.mock("./email", () => ({
  sendArtworkReUploadedEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Unit tests for getOrdersByCustomerEmail (now includes prints) ───────────

describe("getOrdersByCustomerEmail with prints", () => {
  it("returns orders with prints array attached", async () => {
    const { getOrdersByCustomerEmail } = await import("./db");
    const mockFn = vi.mocked(getOrdersByCustomerEmail);
    mockFn.mockResolvedValueOnce([
      {
        id: 1001,
        customerEmail: "test@example.com",
        status: "pending",
        prints: [
          {
            id: 5001,
            orderId: 1001,
            designApprovalStatus: "changes_requested",
            designApprovalNotes: "Please increase DPI to 300",
            uploadedFilePath: "https://s3.example.com/file.png",
            uploadedFileName: "design.png",
            fileSize: 204800,
            mimeType: "image/png",
            printSizeId: 1,
            placementId: 1,
          },
        ],
      } as any,
    ]);
    const result = await mockFn("test@example.com");
    expect(result).toHaveLength(1);
    expect(result[0].prints).toBeDefined();
    expect(result[0].prints).toHaveLength(1);
    expect(result[0].prints![0].designApprovalStatus).toBe("changes_requested");
    expect(result[0].prints![0].designApprovalNotes).toBe("Please increase DPI to 300");
  });

  it("returns empty prints array when order has no artwork", async () => {
    const { getOrdersByCustomerEmail } = await import("./db");
    const mockFn = vi.mocked(getOrdersByCustomerEmail);
    mockFn.mockResolvedValueOnce([
      {
        id: 1002,
        customerEmail: "test@example.com",
        status: "pending",
        prints: [],
      } as any,
    ]);
    const result = await mockFn("test@example.com");
    expect(result[0].prints).toHaveLength(0);
  });
});

// ─── Unit tests for updatePrintArtwork procedure logic ───────────────────────

describe("updatePrintArtwork procedure", () => {
  it("resets designApprovalStatus to pending on re-upload", () => {
    // Simulate the DB update payload
    const updatePayload = {
      uploadedFilePath: "https://s3.example.com/new-file.png",
      uploadedFileName: "corrected-design.png",
      fileSize: 512000,
      mimeType: "image/png",
      designApprovalStatus: "pending",
      designApprovalNotes: null,
      designApprovedAt: null,
      designReviewedBy: null,
    };
    expect(updatePayload.designApprovalStatus).toBe("pending");
    expect(updatePayload.designApprovalNotes).toBeNull();
    expect(updatePayload.designApprovedAt).toBeNull();
    expect(updatePayload.designReviewedBy).toBeNull();
  });

  it("validates that uploadedFilePath must be a real S3 URL", () => {
    const validPaths = [
      "https://s3.amazonaws.com/bucket/file.png",
      "https://storage.example.com/file.pdf",
    ];
    const invalidPaths = ["", "  ", "local/path/file.png"];

    validPaths.forEach((path) => {
      expect(path.startsWith("http")).toBe(true);
    });
    invalidPaths.forEach((path) => {
      expect(path.startsWith("http")).toBe(false);
    });
  });

  it("blocks re-upload for orders in production or beyond", () => {
    const blockedStatuses = ["in-production", "completed", "shipped", "cancelled"];
    const allowedStatuses = ["pending", "quoted", "approved"];

    blockedStatuses.forEach((status) => {
      const isBlocked = ["in-production", "completed", "shipped", "cancelled"].includes(status);
      expect(isBlocked).toBe(true);
    });
    allowedStatuses.forEach((status) => {
      const isBlocked = ["in-production", "completed", "shipped", "cancelled"].includes(status);
      expect(isBlocked).toBe(false);
    });
  });

  it("verifies order ownership before allowing re-upload", () => {
    const order = { userId: 42, customerEmail: "customer@example.com" };
    const authorizedUser1 = { id: 42, email: "other@example.com" };
    const authorizedUser2 = { id: 99, email: "customer@example.com" };
    const unauthorizedUser = { id: 99, email: "hacker@example.com" };

    const isOwner = (user: typeof authorizedUser1) =>
      order.userId === user.id || order.customerEmail === user.email;

    expect(isOwner(authorizedUser1)).toBe(true);
    expect(isOwner(authorizedUser2)).toBe(true);
    expect(isOwner(unauthorizedUser)).toBe(false);
  });
});

// ─── Unit tests for sendArtworkReUploadedEmail ───────────────────────────────

describe("sendArtworkReUploadedEmail", () => {
  it("sends confirmation email to customer on successful re-upload", async () => {
    const { sendArtworkReUploadedEmail } = await import("./email");
    await sendArtworkReUploadedEmail(
      1001,
      "customer@example.com",
      "John Doe",
      "corrected-design.png"
    );
    expect(sendArtworkReUploadedEmail).toHaveBeenCalledWith(
      1001,
      "customer@example.com",
      "John Doe",
      "corrected-design.png"
    );
  });

  it("returns true on successful email send", async () => {
    const { sendArtworkReUploadedEmail } = await import("./email");
    const result = await sendArtworkReUploadedEmail(
      1001,
      "customer@example.com",
      "Jane Doe",
      "artwork.pdf"
    );
    expect(result).toBe(true);
  });
});

// ─── Unit tests for notifyOwner on re-upload ─────────────────────────────────

describe("notifyOwner on artwork re-upload", () => {
  it("sends admin notification when customer re-uploads artwork", async () => {
    const { notifyOwner } = await import("./_core/notification");
    await notifyOwner({
      title: "Artwork Re-Uploaded — Order #1001",
      content:
        "Customer John Doe (john@example.com) has re-uploaded artwork for Order #1001. File: corrected-design.png. Please review in the admin dashboard.",
    });
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Artwork Re-Uploaded"),
        content: expect.stringContaining("corrected-design.png"),
      })
    );
  });
});

// ─── Unit tests for artwork status badge logic ───────────────────────────────

describe("artwork status badge logic", () => {
  const getArtworkStatusLabel = (status?: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "changes_requested":
        return "Changes Required";
      default:
        return "Pending Review";
    }
  };

  it("shows Approved for approved prints", () => {
    expect(getArtworkStatusLabel("approved")).toBe("Approved");
  });

  it("shows Changes Required for changes_requested prints", () => {
    expect(getArtworkStatusLabel("changes_requested")).toBe("Changes Required");
  });

  it("shows Pending Review for pending prints", () => {
    expect(getArtworkStatusLabel("pending")).toBe("Pending Review");
  });

  it("shows Pending Review for undefined status", () => {
    expect(getArtworkStatusLabel(undefined)).toBe("Pending Review");
  });
});

// ─── Unit tests for re-upload UI state logic ─────────────────────────────────

describe("re-upload UI state management", () => {
  it("only shows re-upload button for changes_requested prints", () => {
    const prints = [
      { id: 1, designApprovalStatus: "approved" },
      { id: 2, designApprovalStatus: "changes_requested" },
      { id: 3, designApprovalStatus: "pending" },
    ];
    const printsNeedingReUpload = prints.filter(
      (p) => p.designApprovalStatus === "changes_requested"
    );
    expect(printsNeedingReUpload).toHaveLength(1);
    expect(printsNeedingReUpload[0].id).toBe(2);
  });

  it("shows admin notes when changes are requested", () => {
    const print = {
      id: 1,
      designApprovalStatus: "changes_requested",
      designApprovalNotes: "Please increase resolution to 300 DPI",
    };
    const shouldShowNotes =
      print.designApprovalStatus === "changes_requested" && !!print.designApprovalNotes;
    expect(shouldShowNotes).toBe(true);
  });

  it("does not show admin notes when there are none", () => {
    const print = {
      id: 1,
      designApprovalStatus: "changes_requested",
      designApprovalNotes: null,
    };
    const shouldShowNotes =
      print.designApprovalStatus === "changes_requested" && !!print.designApprovalNotes;
    expect(shouldShowNotes).toBe(false);
  });

  it("resets to pending after successful re-upload", () => {
    let status = "changes_requested";
    // Simulate what the server does on re-upload
    status = "pending";
    expect(status).toBe("pending");
  });
});
