import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";

const simulation = vi.hoisted(() => {
  type StoredOrder = Record<string, unknown> & { id: number };

  const state = {
    mode: "checkout" as "checkout" | "callback",
    nextOrderId: 1,
    orders: [] as StoredOrder[],
    prints: [] as Array<Record<string, unknown>>,
    callbackOrder: {
      id: 42,
      totalPriceEstimate: "258.72",
      paymentStatus: "unpaid",
      amountPaid: "0.00",
    } as Record<string, unknown>,
    callbackUpdates: [] as Array<Record<string, unknown>>,
  };

  const callbackDb = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [state.callbackOrder]) })) })) })),
    update: vi.fn(() => ({ set: vi.fn((values: Record<string, unknown>) => ({ where: vi.fn(async () => {
      state.callbackUpdates.push(values);
      Object.assign(state.callbackOrder, values);
    }) })) })),
  };

  return {
    state,
    callbackDb,
    resetCheckout() {
      state.mode = "checkout";
      state.nextOrderId = 1;
      state.orders = [];
      state.prints = [];
    },
    resetCallback() {
      state.mode = "callback";
      state.callbackOrder = { id: 42, totalPriceEstimate: "258.72", paymentStatus: "unpaid", amountPaid: "0.00" };
      state.callbackUpdates = [];
    },
  };
});

const outbound = vi.hoisted(() => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendNewOrderNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => simulation.state.mode === "callback" ? simulation.callbackDb : undefined),
  createOrder: vi.fn(async (orderData: Record<string, unknown>) => {
    const id = simulation.state.nextOrderId++;
    simulation.state.orders.push({ id, ...orderData });
    return id;
  }),
  createOrderPrint: vi.fn(async (printData: Record<string, unknown>) => {
    simulation.state.prints.push(printData);
    return simulation.state.prints.length;
  }),
  getOrderById: vi.fn(),
  getAllOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  getOrderPrints: vi.fn(),
  getOrdersByCustomerEmail: vi.fn(),
  getOrdersForCustomerAccount: vi.fn(),
  getConversationByOrderId: vi.fn(),
  createOrderStatusUpdateMessage: vi.fn(),
  createOrderLineItem: vi.fn(),
  getOrderLineItems: vi.fn(),
  getOrderStatusHistory: vi.fn(),
}));

vi.mock("./pricing", async () => {
  const { calculateDtfEstimate } = await import("../shared/dtfPricing");
  return {
    calculateDtfOrderEstimate: vi.fn(async (input: { quantity: number; printPlacements: Array<{ previewScale?: number }> }) => calculateDtfEstimate({
      basePrice: 120,
      quantity: input.quantity,
      printSelections: input.printPlacements.map((placement) => ({ printSize: "A4", previewScale: placement.previewScale })),
    })),
  };
});

vi.mock("./payfast-service", () => ({
  verifyPayFastSignature: vi.fn(() => true),
  extractOrderIdFromPayment: vi.fn(() => 42),
  isPaymentSuccessful: vi.fn((status: string) => status === "COMPLETE"),
}));

vi.mock("./_core/email", () => ({
  sendOrderConfirmationEmail: outbound.sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(undefined),
  sendNewOrderNotificationEmail: outbound.sendNewOrderNotificationEmail,
  sendOrderMilestoneEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderReadyForCollectionEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./email", () => ({ sendArtworkReUploadedEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./invoice-generator", () => ({ generateAndUploadInvoice: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./invoice-email", () => ({ sendInvoiceEmail: vi.fn().mockResolvedValue(undefined), sendInvoiceNotificationToAdmin: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./invoice-received-email", () => ({ sendInvoiceReceivedEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./payment-confirmation-email", () => ({ sendPaymentConfirmationEmail: vi.fn().mockResolvedValue(undefined) }));

import type { TrpcContext } from "./_core/context";
import { handlePayFastCallback } from "./_core/payfast-callback";
import { ordersRouter } from "./routers/orders";
import { calculateDtfEstimate } from "../shared/dtfPricing";

const CHECKOUT_CONCURRENCY = 200;
const CALLBACK_CONCURRENCY = 400;

type LoadSummary = { completed: number; elapsedMs: number; p50Ms: number; p95Ms: number; maxMs: number };
const loadMetrics: Record<string, LoadSummary> = {};

function reportLoadSummary(label: string, summary: LoadSummary) {
  loadMetrics[label] = summary;
  process.stdout.write(`[load-simulation] ${label}: ${summary.completed} completed; total ${summary.elapsedMs.toFixed(2)} ms; p50 ${summary.p50Ms.toFixed(2)} ms; p95 ${summary.p95Ms.toFixed(2)} ms; max ${summary.maxMs.toFixed(2)} ms\n`);
}

function percentile(samples: number[], percentileValue: number) {
  const ordered = [...samples].sort((first, second) => first - second);
  const index = Math.max(0, Math.ceil((percentileValue / 100) * ordered.length) - 1);
  return ordered[index] ?? 0;
}

async function runConcurrent<T>(count: number, work: (index: number) => Promise<T>): Promise<{ results: T[]; summary: LoadSummary }> {
  const startedAt = performance.now();
  const measured = await Promise.all(Array.from({ length: count }, async (_, index) => {
    const requestStartedAt = performance.now();
    const result = await work(index);
    return { result, durationMs: performance.now() - requestStartedAt };
  }));
  const durations = measured.map((item) => item.durationMs);
  return {
    results: measured.map((item) => item.result),
    summary: {
      completed: measured.length,
      elapsedMs: performance.now() - startedAt,
      p50Ms: percentile(durations, 50),
      p95Ms: percentile(durations, 95),
      maxMs: Math.max(...durations),
    },
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createResponse() {
  const response = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

describe("isolated checkout and payment callback load simulation", () => {
  beforeEach(() => {
    simulation.resetCheckout();
    vi.clearAllMocks();
    process.env.PAYFAST_PASSPHRASE = "load-simulation-passphrase";
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(`completes ${CHECKOUT_CONCURRENCY} concurrent checkout mutations with server-calculated totals`, async () => {
    const caller = ordersRouter.createCaller(createPublicContext());
    const expectedOrderTotal = calculateDtfEstimate({
      basePrice: 120,
      quantity: 2,
      printSelections: [{ printSize: "A4", previewScale: 0.5 }],
    }).total;
    const { results, summary } = await runConcurrent(CHECKOUT_CONCURRENCY, (index) => caller.create({
      productId: 101,
      colorId: 1,
      sizeId: 1,
      quantity: 2,
      customerFirstName: "Load",
      customerLastName: `Checkout-${index}`,
      customerEmail: `load-checkout-${index}@example.test`,
      customerPhone: "0100000001",
      deliveryMethod: "collection",
      prints: [{
        placementId: 1,
        printSizeId: 11,
        uploadedFilePath: `https://example.test/load-checkout-${index}.png`,
        uploadedFileName: `load-checkout-${index}.png`,
        previewScale: 0.5,
      }],
      totalPriceEstimate: 0,
    }));

    expect(summary.completed).toBe(CHECKOUT_CONCURRENCY);
    expect(summary.p95Ms).toBeLessThan(1_000);
    expect(simulation.state.orders).toHaveLength(CHECKOUT_CONCURRENCY);
    expect(simulation.state.prints).toHaveLength(CHECKOUT_CONCURRENCY);
    expect(new Set(results.map((result) => result.orderId)).size).toBe(CHECKOUT_CONCURRENCY);
    expect(simulation.state.orders.every((order) => Number(order.totalPriceEstimate) === expectedOrderTotal)).toBe(true);
    reportLoadSummary("checkout", summary);
  });

  it(`preserves the checkout estimate during ${CALLBACK_CONCURRENCY} concurrent payment callbacks`, async () => {
    simulation.resetCallback();
    const { results, summary } = await runConcurrent(CALLBACK_CONCURRENCY, async () => {
      const response = createResponse();
      await handlePayFastCallback({ body: { m_payment_id: "order-42", pf_payment_id: "pf-42", payment_status: "COMPLETE", amount_gross: "258.72", signature: "valid" } } as never, response as never);
      return response;
    });

    expect(summary.completed).toBe(CALLBACK_CONCURRENCY);
    expect(summary.p95Ms).toBeLessThan(1_000);
    expect(simulation.state.callbackOrder.totalPriceEstimate).toBe("258.72");
    expect(simulation.state.callbackOrder.paymentStatus).toBe("paid");
    expect(simulation.state.callbackUpdates.every((update) => !("totalPriceEstimate" in update))).toBe(true);
    expect(results.every((response) => response.status.mock.calls[0]?.[0] === 200)).toBe(true);
    reportLoadSummary("payment callback", summary);
  });
});

afterAll(() => {
  const metricsPath = process.env.LOAD_SIMULATION_METRICS_PATH;
  if (metricsPath) {
    writeFileSync(metricsPath, `${JSON.stringify(loadMetrics, null, 2)}\n`, "utf8");
  }
});
