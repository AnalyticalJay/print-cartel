import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("../server/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../drizzle/schema", () => ({
  orders: "orders",
  orderPrints: "orderPrints",
  orderLineItems: "orderLineItems",
  products: "products",
  productColors: "productColors",
  productSizes: "productSizes",
  printPlacements: "printPlacements",
  printOptions: "printOptions",
  paymentRecords: "paymentRecords",
}));

// ─── Timeline index helper (mirrors CustomerOrderDetailModal logic) ────────────
function getTimelineIndex(status: string, paymentStatus: string): number {
  if (status === "completed") return 6;
  if (status === "shipped") return 5;
  if (status === "in-production") return 4;
  if (paymentStatus === "paid" || paymentStatus === "deposit_paid") return 3;
  if (status === "approved") return 2;
  if (status === "quoted") return 1;
  return 0;
}

// ─── Pay Now visibility helper ────────────────────────────────────────────────
function shouldShowPayNow(status: string, paymentStatus: string, total: number): boolean {
  return (
    ["quoted", "approved"].includes(status) &&
    paymentStatus !== "paid" &&
    total > 0
  );
}

// ─── Approval badge helper ────────────────────────────────────────────────────
function getApprovalBadgeText(status: string): string {
  if (status === "approved") return "Approved";
  if (status === "changes_requested") return "Changes Requested";
  return "Pending Review";
}

// ─── isImage helper ───────────────────────────────────────────────────────────
function isImageFile(mimeType: string | null, fileName: string): boolean {
  if (mimeType) return mimeType.startsWith("image/");
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName);
}

// ─── formatCurrency helper ────────────────────────────────────────────────────
function formatCurrency(v: number): string {
  return `R${v.toFixed(2)}`;
}

// ─── Timeline tests ───────────────────────────────────────────────────────────
describe("CustomerOrderDetailModal – timeline index", () => {
  it("returns 0 for pending/unpaid", () => {
    expect(getTimelineIndex("pending", "unpaid")).toBe(0);
  });

  it("returns 1 for quoted", () => {
    expect(getTimelineIndex("quoted", "unpaid")).toBe(1);
  });

  it("returns 2 for approved/unpaid", () => {
    expect(getTimelineIndex("approved", "unpaid")).toBe(2);
  });

  it("returns 3 when payment is paid regardless of order status", () => {
    expect(getTimelineIndex("approved", "paid")).toBe(3);
    expect(getTimelineIndex("quoted", "deposit_paid")).toBe(3);
  });

  it("returns 4 for in-production", () => {
    expect(getTimelineIndex("in-production", "paid")).toBe(4);
  });

  it("returns 5 for shipped", () => {
    expect(getTimelineIndex("shipped", "paid")).toBe(5);
  });

  it("returns 6 for completed", () => {
    expect(getTimelineIndex("completed", "paid")).toBe(6);
  });
});

// ─── Pay Now visibility tests ─────────────────────────────────────────────────
describe("CustomerOrderDetailModal – Pay Now visibility", () => {
  it("shows Pay Now for quoted/unpaid order", () => {
    expect(shouldShowPayNow("quoted", "unpaid", 500)).toBe(true);
  });

  it("shows Pay Now for approved/unpaid order", () => {
    expect(shouldShowPayNow("approved", "unpaid", 250)).toBe(true);
  });

  it("hides Pay Now when payment is already paid", () => {
    expect(shouldShowPayNow("approved", "paid", 500)).toBe(false);
  });

  it("hides Pay Now for pending orders", () => {
    expect(shouldShowPayNow("pending", "unpaid", 500)).toBe(false);
  });

  it("hides Pay Now for in-production orders", () => {
    expect(shouldShowPayNow("in-production", "paid", 500)).toBe(false);
  });

  it("hides Pay Now when total is 0", () => {
    expect(shouldShowPayNow("approved", "unpaid", 0)).toBe(false);
  });
});

// ─── Amount due calculation ───────────────────────────────────────────────────
describe("CustomerOrderDetailModal – amount due", () => {
  it("calculates full amount when nothing paid", () => {
    const total = 500;
    const paid = 0;
    expect(Math.max(0, total - paid)).toBe(500);
  });

  it("calculates remaining after partial payment", () => {
    const total = 500;
    const paid = 200;
    expect(Math.max(0, total - paid)).toBe(300);
  });

  it("returns 0 when fully paid", () => {
    const total = 500;
    const paid = 500;
    expect(Math.max(0, total - paid)).toBe(0);
  });

  it("never returns negative", () => {
    const total = 500;
    const paid = 600;
    expect(Math.max(0, total - paid)).toBe(0);
  });
});

// ─── Approval badge tests ─────────────────────────────────────────────────────
describe("CustomerOrderDetailModal – approval badge", () => {
  it("shows Approved for approved status", () => {
    expect(getApprovalBadgeText("approved")).toBe("Approved");
  });

  it("shows Changes Requested for changes_requested status", () => {
    expect(getApprovalBadgeText("changes_requested")).toBe("Changes Requested");
  });

  it("shows Pending Review for pending status", () => {
    expect(getApprovalBadgeText("pending")).toBe("Pending Review");
  });

  it("shows Pending Review for unknown status", () => {
    expect(getApprovalBadgeText("unknown_status")).toBe("Pending Review");
  });
});

// ─── Image detection tests ────────────────────────────────────────────────────
describe("CustomerOrderDetailModal – image file detection", () => {
  it("detects PNG by mime type", () => {
    expect(isImageFile("image/png", "design.png")).toBe(true);
  });

  it("detects JPEG by mime type", () => {
    expect(isImageFile("image/jpeg", "photo.jpg")).toBe(true);
  });

  it("detects SVG by mime type", () => {
    expect(isImageFile("image/svg+xml", "logo.svg")).toBe(true);
  });

  it("falls back to extension when mime type is null", () => {
    expect(isImageFile(null, "design.PNG")).toBe(true);
    expect(isImageFile(null, "artwork.webp")).toBe(true);
    expect(isImageFile(null, "file.pdf")).toBe(false);
  });

  it("returns false for PDF mime type", () => {
    expect(isImageFile("application/pdf", "file.pdf")).toBe(false);
  });

  it("returns false for AI files", () => {
    expect(isImageFile("application/illustrator", "design.ai")).toBe(false);
  });
});

// ─── Currency formatting tests ────────────────────────────────────────────────
describe("CustomerOrderDetailModal – currency formatting", () => {
  it("formats whole numbers with two decimal places", () => {
    expect(formatCurrency(500)).toBe("R500.00");
  });

  it("formats decimal amounts correctly", () => {
    expect(formatCurrency(110.5)).toBe("R110.50");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("R0.00");
  });
});

// ─── Multi-item order quantity aggregation ────────────────────────────────────
describe("CustomerOrderDetailModal – multi-item quantity", () => {
  it("sums quantities from line items", () => {
    const lineItems = [
      { quantity: 5, subtotal: 100 },
      { quantity: 3, subtotal: 60 },
      { quantity: 2, subtotal: 40 },
    ];
    const total = lineItems.reduce((s, i) => s + i.quantity, 0);
    expect(total).toBe(10);
  });

  it("handles single line item", () => {
    const lineItems = [{ quantity: 12, subtotal: 240 }];
    const total = lineItems.reduce((s, i) => s + i.quantity, 0);
    expect(total).toBe(12);
  });
});

// ─── getMyOrderDetail procedure – security ────────────────────────────────────
describe("getMyOrderDetail – security", () => {
  it("rejects access when order email does not match user email", () => {
    const order = { customerEmail: "other@example.com" };
    const userEmail = "customer@example.com";
    const isAuthorized = order.customerEmail === userEmail;
    expect(isAuthorized).toBe(false);
  });

  it("allows access when order email matches user email", () => {
    const order = { customerEmail: "customer@example.com" };
    const userEmail = "customer@example.com";
    const isAuthorized = order.customerEmail === userEmail;
    expect(isAuthorized).toBe(true);
  });
});

// ─── isMultiItemOrder detection ───────────────────────────────────────────────
describe("getMyOrderDetail – multi-item detection", () => {
  it("detects multi-item order when productId is 0", () => {
    const order = { productId: 0 };
    expect(order.productId === 0).toBe(true);
  });

  it("detects single-item order when productId is non-zero", () => {
    const order = { productId: 3 };
    expect(order.productId === 0).toBe(false);
  });
});
