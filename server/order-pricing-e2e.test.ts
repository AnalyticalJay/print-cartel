import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutStore = vi.hoisted(() => {
  type StoredOrder = Record<string, unknown> & { id: number };
  type StoredLineItem = Record<string, unknown> & { id: number };
  type StoredPrint = Record<string, unknown> & { id: number };

  const state = {
    nextOrderId: 1,
    nextLineItemId: 1,
    nextPrintId: 1,
    orders: [] as StoredOrder[],
    lineItems: [] as StoredLineItem[],
    prints: [] as StoredPrint[],
    paymentRecords: [] as Array<Record<string, unknown>>,
  };

  return {
    state,
    reset() {
      state.nextOrderId = 1;
      state.nextLineItemId = 1;
      state.nextPrintId = 1;
      state.orders = [];
      state.lineItems = [];
      state.prints = [];
      state.paymentRecords = [];
    },
  };
});

const outbound = vi.hoisted(() => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendNewOrderNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(undefined),
  createOrder: vi.fn(async (orderData: Record<string, unknown>) => {
    const id = checkoutStore.state.nextOrderId++;
    checkoutStore.state.orders.push({ id, ...orderData });
    return id;
  }),
  getOrderById: vi.fn(),
  getAllOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  createOrderPrint: vi.fn(async (printData: Record<string, unknown>) => {
    const id = checkoutStore.state.nextPrintId++;
    checkoutStore.state.prints.push({ id, ...printData });
    return id;
  }),
  getOrderPrints: vi.fn(async (orderId: number) => checkoutStore.state.prints.filter((print) => print.orderId === orderId)),
  getOrdersByCustomerEmail: vi.fn(),
  getOrdersForCustomerAccount: vi.fn(),
  getConversationByOrderId: vi.fn(),
  createOrderStatusUpdateMessage: vi.fn(),
  createOrderLineItem: vi.fn(async (lineItem: Record<string, unknown>) => {
    const id = checkoutStore.state.nextLineItemId++;
    checkoutStore.state.lineItems.push({ id, ...lineItem });
    return id;
  }),
  getOrderLineItems: vi.fn(async (orderId: number) => checkoutStore.state.lineItems.filter((lineItem) => lineItem.orderId === orderId)),
  getOrderStatusHistory: vi.fn(),
}));

const pricingService = vi.hoisted(() => ({ calculateDtfOrderEstimate: vi.fn() }));

vi.mock("./pricing", async () => {
  const { calculateDtfEstimate } = await import("../shared/dtfPricing");
  const productPrices: Record<number, number> = { 101: 120, 202: 200 };
  const printSizes: Record<number, string> = { 11: "A4", 22: "A5" };

  return {
    calculateDtfOrderEstimate: pricingService.calculateDtfOrderEstimate.mockImplementation(async (input: {
      productId: number;
      quantity: number;
      printPlacements: Array<{ printSizeId: number; previewScale?: number }>;
    }) => calculateDtfEstimate({
      basePrice: productPrices[input.productId],
      quantity: input.quantity,
      printSelections: input.printPlacements.map((placement) => ({
        printSize: printSizes[placement.printSizeId],
        previewScale: placement.previewScale,
      })),
    })),
  };
});

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

import { calculateDtfEstimate, UnsupportedPrintSizeError } from "../shared/dtfPricing";
import type { TrpcContext } from "./_core/context";
import { ordersRouter } from "./routers/orders";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("checkout price verification", () => {
  let caller: ReturnType<typeof ordersRouter.createCaller>;

  beforeEach(() => {
    checkoutStore.reset();
    vi.clearAllMocks();
    caller = ordersRouter.createCaller(createPublicContext());
  });

  it("persists a single-item checkout total from DTF proof area instead of the submitted browser price", async () => {
    const expected = calculateDtfEstimate({
      basePrice: 120,
      quantity: 2,
      printSelections: [{ printSize: "A4", previewScale: 0.5 }],
    });

    const result = await caller.create({
      productId: 101,
      colorId: 1,
      sizeId: 1,
      quantity: 2,
      customerFirstName: "E2E",
      customerLastName: "Single",
      customerEmail: "e2e-single@example.com",
      customerPhone: "0100000001",
      deliveryMethod: "collection",
      prints: [{
        layerId: "e2e-single-layer",
        placementId: 1,
        printSizeId: 11,
        uploadedFilePath: "https://example.test/e2e-single.png",
        uploadedFileName: "e2e-single.png",
        previewScale: 0.5,
        previewX: 0,
        previewY: 0,
        previewRotation: 0,
        previewLayerOrder: 0,
      }],
      totalPriceEstimate: 0,
    });

    expect(result.status).toBe("pending");
    expect(checkoutStore.state.orders).toHaveLength(1);
    expect(Number(checkoutStore.state.orders[0].totalPriceEstimate)).toBe(expected.total);
    expect(checkoutStore.state.prints).toHaveLength(1);
    expect(checkoutStore.state.prints[0].previewPosition).toMatchObject({ scale: 0.5, layerId: "e2e-single-layer" });
    expect(checkoutStore.state.paymentRecords).toHaveLength(0);
    expect(outbound.sendOrderConfirmationEmail).toHaveBeenCalledOnce();
  });

  it("persists a multi-item checkout and each line item using the shared DTF estimate", async () => {
    const firstExpected = calculateDtfEstimate({
      basePrice: 120,
      quantity: 2,
      printSelections: [{ printSize: "A4", previewScale: 1 }],
    });
    const secondExpected = calculateDtfEstimate({
      basePrice: 200,
      quantity: 10,
      printSelections: [
        { printSize: "A5", previewScale: 0.5 },
        { printSize: "A4", previewScale: 0.75 },
      ],
    });

    const result = await caller.createMultiItem({
      cartItems: [
        {
          productId: 101,
          colorId: 1,
          sizeId: 1,
          quantity: 2,
          subtotal: 1,
          printSelections: [{
            layerId: "e2e-cart-a",
            placementId: 1,
            printSizeId: 11,
            uploadedFilePath: "https://example.test/e2e-cart-a.png",
            uploadedFileName: "e2e-cart-a.png",
            previewScale: 1,
            previewLayerOrder: 0,
          }],
        },
        {
          productId: 202,
          colorId: 2,
          sizeId: 2,
          quantity: 10,
          subtotal: 1,
          printSelections: [
            {
              layerId: "e2e-cart-b-front",
              placementId: 1,
              printSizeId: 22,
              uploadedFilePath: "https://example.test/e2e-cart-b-front.png",
              uploadedFileName: "e2e-cart-b-front.png",
              previewScale: 0.5,
              previewLayerOrder: 0,
            },
            {
              layerId: "e2e-cart-b-back",
              placementId: 2,
              printSizeId: 11,
              uploadedFilePath: "https://example.test/e2e-cart-b-back.png",
              uploadedFileName: "e2e-cart-b-back.png",
              previewScale: 0.75,
              previewLayerOrder: 1,
            },
          ],
        },
      ],
      customerFirstName: "E2E",
      customerLastName: "Cart",
      customerEmail: "e2e-cart@example.com",
      customerPhone: "0100000002",
      deliveryMethod: "collection",
      totalPriceEstimate: 0,
    });

    expect(result.status).toBe("pending");
    expect(Number(checkoutStore.state.orders[0].totalPriceEstimate)).toBe(firstExpected.total + secondExpected.total);
    expect(checkoutStore.state.lineItems).toHaveLength(2);

    const firstLine = checkoutStore.state.lineItems.find((lineItem) => lineItem.productId === 101);
    const secondLine = checkoutStore.state.lineItems.find((lineItem) => lineItem.productId === 202);
    expect(Number(firstLine?.subtotal)).toBe(firstExpected.total);
    expect(Number(firstLine?.unitPrice)).toBe(firstExpected.totalPerGarment);
    expect(Number(secondLine?.subtotal)).toBe(secondExpected.total);
    expect(Number(secondLine?.unitPrice)).toBe(secondExpected.totalPerGarment);
    expect(checkoutStore.state.prints).toHaveLength(3);
    expect(checkoutStore.state.paymentRecords).toHaveLength(0);
    expect(outbound.sendOrderConfirmationEmail).toHaveBeenCalledOnce();
  });

  it("returns a customer-safe validation error and creates no order for an unsupported print size", async () => {
    pricingService.calculateDtfOrderEstimate.mockRejectedValueOnce(new UnsupportedPrintSizeError("Oversized custom 45 cm"));

    await expect(caller.create({
      productId: 101,
      colorId: 1,
      sizeId: 1,
      quantity: 1,
      customerFirstName: "E2E",
      customerLastName: "Invalid size",
      customerEmail: "e2e-invalid-size@example.com",
      customerPhone: "0100000003",
      deliveryMethod: "collection",
      prints: [{
        placementId: 1,
        printSizeId: 999,
        uploadedFilePath: "https://example.test/e2e-invalid-size.png",
        uploadedFileName: "e2e-invalid-size.png",
      }],
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Unsupported print size") });

    expect(checkoutStore.state.orders).toHaveLength(0);
    expect(checkoutStore.state.prints).toHaveLength(0);
    expect(checkoutStore.state.paymentRecords).toHaveLength(0);
  });
});
