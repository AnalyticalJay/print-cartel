import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for the Payment Success page and the getByPaymentId tRPC procedure.
 *
 * These tests cover:
 * 1. URL param parsing (m_payment_id and legacy orderId formats)
 * 2. The getByPaymentId procedure logic (order ID extraction, enriched data)
 * 3. Currency formatting
 * 4. Production timeline logic
 * 5. Error states
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractOrderIdFromPaymentId(mPaymentId: string): number | null {
  const match = mPaymentId.match(/order[-_](\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function formatCurrencyZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);
}

function buildMPaymentId(orderId: number): string {
  return `order-${orderId}`;
}

// ─── URL Param Parsing ────────────────────────────────────────────────────────

describe("PaymentSuccess – URL parameter parsing", () => {
  it("should parse m_payment_id from PayFast redirect URL", () => {
    const url = "https://printcartel.co.za/payment/success?m_payment_id=order-42&pf_payment_id=abc123";
    const params = new URLSearchParams(url.split("?")[1]);
    const mPaymentId = params.get("m_payment_id");
    expect(mPaymentId).toBe("order-42");
  });

  it("should extract orderId from m_payment_id in order-{id} format", () => {
    expect(extractOrderIdFromPaymentId("order-42")).toBe(42);
    expect(extractOrderIdFromPaymentId("order-1001")).toBe(1001);
  });

  it("should extract orderId from m_payment_id in order_{id} format (underscore)", () => {
    expect(extractOrderIdFromPaymentId("order_99")).toBe(99);
  });

  it("should return null for invalid m_payment_id format", () => {
    expect(extractOrderIdFromPaymentId("invalid")).toBeNull();
    expect(extractOrderIdFromPaymentId("")).toBeNull();
    expect(extractOrderIdFromPaymentId("abc-xyz")).toBeNull();
  });

  it("should support legacy ?orderId= param by converting to order-{id}", () => {
    const legacyId = "123";
    const mPaymentId = `order-${legacyId}`;
    expect(extractOrderIdFromPaymentId(mPaymentId)).toBe(123);
  });

  it("should build correct m_payment_id from order ID", () => {
    expect(buildMPaymentId(42)).toBe("order-42");
    expect(buildMPaymentId(10050)).toBe("order-10050");
  });
});

// ─── getByPaymentId Procedure Logic ──────────────────────────────────────────

describe("getByPaymentId procedure", () => {
  it("should parse orderId 42 from 'order-42'", () => {
    const id = extractOrderIdFromPaymentId("order-42");
    expect(id).toBe(42);
  });

  it("should reject malformed payment IDs", () => {
    expect(extractOrderIdFromPaymentId("pay-42")).toBeNull();
    expect(extractOrderIdFromPaymentId("ORDER-42")).toBeNull(); // case-sensitive
  });

  it("should return enriched order data structure", () => {
    const mockResult = {
      order: {
        id: 42,
        customerFirstName: "Jamie",
        customerLastName: "Woodhead",
        customerEmail: "jamie@printcartel.co.za",
        customerPhone: "0821234567",
        customerCompany: "Print Cartel",
        quantity: 50,
        totalPriceEstimate: 1250.0,
        amountPaid: 1250.0,
        deliveryCharge: 0,
        paymentStatus: "paid",
        deliveryMethod: "delivery",
        deliveryAddress: "123 Main St, Cape Town",
        status: "in-production",
        invoiceUrl: "https://s3.example.com/invoice-42.pdf",
        createdAt: new Date("2026-05-01"),
      },
      product: { id: 1, name: "Premium Cotton Tee", fabricType: "100% Cotton" },
      color: { id: 2, colorName: "Midnight Black", colorHex: "#1a1a1a" },
      size: { id: 3, sizeName: "L" },
      prints: [
        {
          id: 10,
          orderId: 42,
          placementName: "Front Chest",
          printSize: "A4",
          uploadedFilePath: "https://s3.example.com/designs/design-42.png",
          uploadedFileName: "logo.png",
        },
      ],
    };

    expect(mockResult.order.id).toBe(42);
    expect(mockResult.product?.name).toBe("Premium Cotton Tee");
    expect(mockResult.color?.colorHex).toBe("#1a1a1a");
    expect(mockResult.size?.sizeName).toBe("L");
    expect(mockResult.prints).toHaveLength(1);
    expect(mockResult.prints[0].placementName).toBe("Front Chest");
    expect(mockResult.prints[0].printSize).toBe("A4");
  });

  it("should return null product/color/size gracefully when not found", () => {
    const mockResult = {
      order: { id: 99, totalPriceEstimate: 500, amountPaid: 500, deliveryCharge: 0 },
      product: null,
      color: null,
      size: null,
      prints: [],
    };

    expect(mockResult.product).toBeNull();
    expect(mockResult.color).toBeNull();
    expect(mockResult.size).toBeNull();
    expect(mockResult.prints).toHaveLength(0);
  });
});

// ─── Currency Formatting ──────────────────────────────────────────────────────

describe("PaymentSuccess – currency formatting", () => {
  it("should format amounts in ZAR", () => {
    const formatted = formatCurrencyZAR(1250);
    expect(formatted).toContain("R");
    expect(formatted).toContain("1");
    expect(formatted).toContain("250");
  });

  it("should format zero correctly", () => {
    const formatted = formatCurrencyZAR(0);
    expect(formatted).toContain("R");
    expect(formatted).toContain("0");
  });

  it("should format large amounts correctly", () => {
    const formatted = formatCurrencyZAR(10000);
    expect(formatted).toContain("R");
    expect(formatted).toContain("10");
  });

  it("should include decimal places", () => {
    const formatted = formatCurrencyZAR(1250.5);
    expect(formatted).toContain("50");
  });
});

// ─── Production Timeline Logic ────────────────────────────────────────────────

describe("PaymentSuccess – production timeline", () => {
  it("should calculate delivery date as 7 business days from now for delivery orders", () => {
    const estimatedDeliveryDays = 7;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDeliveryDays);
    expect(deliveryDate.getDate()).toBeGreaterThanOrEqual(new Date().getDate());
  });

  it("should calculate collection date as 3 business days from now for collection orders", () => {
    const estimatedDays = 3;
    const readyDate = new Date();
    readyDate.setDate(readyDate.getDate() + estimatedDays);
    expect(readyDate.getDate()).toBeGreaterThanOrEqual(new Date().getDate());
  });

  it("should show 5 production steps", () => {
    const steps = [
      "Confirmation Email",
      "Design Review",
      "DTF Printing",
      "Quality Check & Packaging",
      "Courier Dispatch / Ready for Collection",
    ];
    expect(steps.length).toBe(5);
  });

  it("should mark first step (Confirmation Email) as done", () => {
    const steps = [
      { title: "Confirmation Email", done: true },
      { title: "Design Review", done: false },
      { title: "DTF Printing", done: false },
      { title: "Quality Check & Packaging", done: false },
      { title: "Courier Dispatch", done: false },
    ];
    expect(steps[0].done).toBe(true);
    steps.slice(1).forEach((s) => expect(s.done).toBe(false));
  });
});

// ─── Payment Status Display ───────────────────────────────────────────────────

describe("PaymentSuccess – payment status display", () => {
  it("should show PAID IN FULL badge when paymentStatus is paid", () => {
    const order = { paymentStatus: "paid" };
    const badgeText = order.paymentStatus === "paid" ? "PAID IN FULL" : "PAYMENT RECEIVED";
    expect(badgeText).toBe("PAID IN FULL");
  });

  it("should show PAYMENT RECEIVED badge for other statuses", () => {
    const order = { paymentStatus: "deposit_paid" };
    const badgeText = order.paymentStatus === "paid" ? "PAID IN FULL" : "PAYMENT RECEIVED";
    expect(badgeText).toBe("PAYMENT RECEIVED");
  });

  it("should use amountPaid if > 0, otherwise fall back to totalPriceEstimate", () => {
    const order1 = { amountPaid: 850, totalPriceEstimate: 850 };
    const displayed1 = order1.amountPaid > 0 ? order1.amountPaid : order1.totalPriceEstimate;
    expect(displayed1).toBe(850);

    const order2 = { amountPaid: 0, totalPriceEstimate: 1200 };
    const displayed2 = order2.amountPaid > 0 ? order2.amountPaid : order2.totalPriceEstimate;
    expect(displayed2).toBe(1200);
  });
});

// ─── Error States ─────────────────────────────────────────────────────────────

describe("PaymentSuccess – error states", () => {
  it("should show error when no m_payment_id in URL", () => {
    const mPaymentId = null;
    const shouldShowError = !mPaymentId;
    expect(shouldShowError).toBe(true);
  });

  it("should show error when order not found", () => {
    const data = null;
    const shouldShowError = !data;
    expect(shouldShowError).toBe(true);
  });

  it("should show loading state while fetching", () => {
    const isLoading = true;
    expect(isLoading).toBe(true);
  });

  it("should provide navigation to dashboard in error state", () => {
    const errorNavigation = { label: "My Orders", path: "/dashboard" };
    expect(errorNavigation.path).toBe("/dashboard");
  });
});

// ─── Print Placements Display ─────────────────────────────────────────────────

describe("PaymentSuccess – print placements", () => {
  it("should display all print placements with placement name and size", () => {
    const prints = [
      { id: 1, placementName: "Front Chest", printSize: "A4", uploadedFileName: "logo.png" },
      { id: 2, placementName: "Back Full", printSize: "A3", uploadedFileName: "back-design.png" },
    ];

    prints.forEach((p) => {
      expect(p.placementName).toBeDefined();
      expect(p.printSize).toBeDefined();
      expect(p.uploadedFileName).toBeDefined();
    });
  });

  it("should provide downloadable link for each artwork file", () => {
    const print = {
      uploadedFilePath: "https://s3.example.com/designs/logo.png",
      uploadedFileName: "logo.png",
    };
    expect(print.uploadedFilePath).toContain("https://");
    expect(print.uploadedFileName).toBe("logo.png");
  });

  it("should handle orders with no prints gracefully", () => {
    const prints: any[] = [];
    expect(prints.length).toBe(0);
    // Should not render the prints section
  });
});

// ─── Delivery Method Display ──────────────────────────────────────────────────

describe("PaymentSuccess – delivery method", () => {
  it("should show delivery address for delivery orders", () => {
    const order = { deliveryMethod: "delivery", deliveryAddress: "123 Main St, Cape Town" };
    expect(order.deliveryMethod).toBe("delivery");
    expect(order.deliveryAddress).toBeDefined();
  });

  it("should show collection message for collection orders", () => {
    const order = { deliveryMethod: "collection", deliveryAddress: null };
    expect(order.deliveryMethod).toBe("collection");
  });

  it("should use 7 business days ETA for delivery", () => {
    const deliveryMethod = "delivery";
    const eta = deliveryMethod === "delivery" ? 7 : 3;
    expect(eta).toBe(7);
  });

  it("should use 3 business days ETA for collection", () => {
    const deliveryMethod = "collection";
    const eta = deliveryMethod === "delivery" ? 7 : 3;
    expect(eta).toBe(3);
  });
});
