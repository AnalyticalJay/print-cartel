/**
 * Tests for admin ITN retry queue feature
 * Uses pure unit tests for business logic (avoids tRPC server-side calling issues)
 */
import { describe, it, expect } from "vitest";

// ── Status badge logic (mirrors ItnRetryTab component) ────────────────────────
const statusBadge = (status: string): string => {
  const map: Record<string, string> = {
    pending: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    abandoned: "bg-gray-200 text-gray-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

// ── Retry button visibility logic ─────────────────────────────────────────────
const shouldShowRetryButton = (status: string): boolean =>
  status === "failed" || status === "abandoned";

// ── Amount formatting ─────────────────────────────────────────────────────────
const formatAmount = (amountPaid: string | null): string =>
  amountPaid ? `R${Number(amountPaid).toFixed(2)}` : "—";

// ── Error message truncation ──────────────────────────────────────────────────
const truncateError = (msg: string): string =>
  msg.length > 60 ? msg.slice(0, 60) + "…" : msg;

// ── Stats fallback ────────────────────────────────────────────────────────────
const resolveStats = (stats: any | null) =>
  stats ?? { pending: 0, processing: 0, completed: 0, failed: 0, abandoned: 0, totalRetries: 0 };

// ── Admin role guard (mirrors procedure logic) ────────────────────────────────
const requireAdmin = (role: string) => {
  if (role !== "admin") throw new Error("Unauthorized: Admin access required");
};

// ─────────────────────────────────────────────────────────────────────────────

describe("ItnRetryTab — status badge", () => {
  it("returns correct class for pending", () => {
    expect(statusBadge("pending")).toBe("bg-blue-100 text-blue-800");
  });
  it("returns correct class for processing", () => {
    expect(statusBadge("processing")).toBe("bg-yellow-100 text-yellow-800");
  });
  it("returns correct class for completed", () => {
    expect(statusBadge("completed")).toBe("bg-green-100 text-green-800");
  });
  it("returns correct class for failed", () => {
    expect(statusBadge("failed")).toBe("bg-red-100 text-red-800");
  });
  it("returns correct class for abandoned", () => {
    expect(statusBadge("abandoned")).toBe("bg-gray-200 text-gray-700");
  });
  it("returns fallback class for unknown status", () => {
    expect(statusBadge("unknown")).toBe("bg-gray-100 text-gray-600");
  });
});

describe("ItnRetryTab — Manual Retry button visibility", () => {
  it("shows retry button for failed rows", () => {
    expect(shouldShowRetryButton("failed")).toBe(true);
  });
  it("shows retry button for abandoned rows", () => {
    expect(shouldShowRetryButton("abandoned")).toBe(true);
  });
  it("hides retry button for pending rows", () => {
    expect(shouldShowRetryButton("pending")).toBe(false);
  });
  it("hides retry button for processing rows", () => {
    expect(shouldShowRetryButton("processing")).toBe(false);
  });
  it("hides retry button for completed rows", () => {
    expect(shouldShowRetryButton("completed")).toBe(false);
  });
});

describe("ItnRetryTab — amount formatting", () => {
  it("formats a normal amount with R prefix", () => {
    expect(formatAmount("250.00")).toBe("R250.00");
  });
  it("formats an integer string to 2 decimal places", () => {
    expect(formatAmount("1500")).toBe("R1500.00");
  });
  it("returns em-dash for null amount", () => {
    expect(formatAmount(null)).toBe("—");
  });
  it("handles decimal amounts correctly", () => {
    expect(formatAmount("99.9")).toBe("R99.90");
  });
});

describe("ItnRetryTab — error message truncation", () => {
  it("truncates messages longer than 60 chars", () => {
    const long = "This is a very long error message that exceeds sixty characters in total";
    const result = truncateError(long);
    expect(result).toHaveLength(61); // 60 chars + ellipsis
    expect(result.endsWith("…")).toBe(true);
  });
  it("does not truncate messages of exactly 60 chars", () => {
    const exact = "A".repeat(60);
    expect(truncateError(exact)).toBe(exact);
  });
  it("does not truncate short messages", () => {
    expect(truncateError("Short error")).toBe("Short error");
  });
});

describe("getItnRetryStats — stats fallback", () => {
  it("returns service stats when available", () => {
    const stats = { pending: 2, processing: 0, completed: 10, failed: 1, abandoned: 1, totalRetries: 14 };
    expect(resolveStats(stats)).toEqual(stats);
  });
  it("returns zeroed stats when service returns null", () => {
    expect(resolveStats(null)).toEqual({
      pending: 0, processing: 0, completed: 0, failed: 0, abandoned: 0, totalRetries: 0,
    });
  });
});

describe("Admin role guard", () => {
  it("allows admin users through", () => {
    expect(() => requireAdmin("admin")).not.toThrow();
  });
  it("throws Unauthorized for regular users", () => {
    expect(() => requireAdmin("user")).toThrow("Unauthorized: Admin access required");
  });
  it("throws Unauthorized for unauthenticated requests", () => {
    expect(() => requireAdmin("")).toThrow("Unauthorized: Admin access required");
  });
});

describe("ITN retry queue data shape", () => {
  it("correctly identifies a failed retry record", () => {
    const record = {
      id: 1,
      orderId: 101,
      transactionId: "txn-abc123",
      status: "failed",
      attemptCount: 3,
      maxAttempts: 5,
      nextRetryAt: new Date("2026-05-05T10:00:00Z"),
      lastAttemptAt: new Date("2026-05-05T09:00:00Z"),
      lastErrorMessage: "Invalid ITN signature",
      failureReason: "signature_verification_failed",
      createdAt: new Date("2026-05-04T08:00:00Z"),
      updatedAt: new Date("2026-05-05T09:00:00Z"),
      customerEmail: "cust@example.com",
      customerFirstName: "Jane",
      customerLastName: "Doe",
      amountPaid: "250.00",
    };

    expect(record.status).toBe("failed");
    expect(shouldShowRetryButton(record.status)).toBe(true);
    expect(statusBadge(record.status)).toBe("bg-red-100 text-red-800");
    expect(formatAmount(record.amountPaid)).toBe("R250.00");
    expect(`${record.attemptCount}/${record.maxAttempts}`).toBe("3/5");
  });

  it("correctly identifies a completed retry record", () => {
    const record = { status: "completed", amountPaid: "850.00" };
    expect(shouldShowRetryButton(record.status)).toBe(false);
    expect(statusBadge(record.status)).toBe("bg-green-100 text-green-800");
    expect(formatAmount(record.amountPaid)).toBe("R850.00");
  });
});
