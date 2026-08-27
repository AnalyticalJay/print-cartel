import { beforeEach, describe, expect, it, vi } from "vitest";

const callbackStore = vi.hoisted(() => ({
  order: {
    id: 42,
    totalPriceEstimate: "258.72",
    paymentStatus: "unpaid",
    amountPaid: "0.00",
  } as Record<string, unknown>,
  updates: [] as Array<Record<string, unknown>>,
  reset() {
    this.order = { id: 42, totalPriceEstimate: "258.72", paymentStatus: "unpaid", amountPaid: "0.00" };
    this.updates = [];
  },
}));

const db = vi.hoisted(() => ({
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [callbackStore.order]) })) })) })),
  update: vi.fn(() => ({ set: vi.fn((values: Record<string, unknown>) => ({ where: vi.fn(async () => { callbackStore.updates.push(values); }) })) })),
}));

vi.mock("./db", () => ({ getDb: vi.fn(async () => db) }));
vi.mock("./payfast-service", () => ({
  verifyPayFastSignature: vi.fn(() => true),
  extractOrderIdFromPayment: vi.fn(() => 42),
  isPaymentSuccessful: vi.fn((status: string) => status === "COMPLETE"),
}));

import { handlePayFastCallback } from "./_core/payfast-callback";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function createSuccessfulRequest(amountGross: string) {
  return {
    body: {
      m_payment_id: "order-42",
      pf_payment_id: "pf-42",
      payment_status: "COMPLETE",
      amount_gross: amountGross,
      signature: "valid-signature",
    },
  };
}

describe("PayFast checkout-estimate preservation", () => {
  beforeEach(() => {
    callbackStore.reset();
    vi.clearAllMocks();
    process.env.PAYFAST_PASSPHRASE = "test-passphrase";
  });

  it("preserves the checkout estimate and records a matching provider amount as paid", async () => {
    const response = createResponse();
    await handlePayFastCallback(createSuccessfulRequest("258.72") as never, response as never);

    expect(callbackStore.updates).toHaveLength(1);
    expect(callbackStore.updates[0]).toMatchObject({
      status: "approved",
      paymentStatus: "paid",
      amountPaid: "258.72",
      paymentVerificationStatus: "verified",
    });
    expect(callbackStore.updates[0]).not.toHaveProperty("totalPriceEstimate");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ success: true, message: "Payment processed" });
  });

  it("preserves the checkout estimate and flags an amount mismatch for manual review", async () => {
    const response = createResponse();
    await handlePayFastCallback(createSuccessfulRequest("1.00") as never, response as never);

    expect(callbackStore.updates).toHaveLength(1);
    expect(callbackStore.updates[0]).toMatchObject({ paymentVerificationStatus: "pending" });
    expect(callbackStore.updates[0].paymentVerificationNotes).toContain("does not match checkout estimate");
    expect(callbackStore.updates[0]).not.toHaveProperty("totalPriceEstimate");
    expect(callbackStore.updates[0]).not.toHaveProperty("status");
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: "Payment amount requires review" });
  });
});
