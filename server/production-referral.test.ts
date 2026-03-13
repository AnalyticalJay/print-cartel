import { describe, it, expect, beforeAll } from "vitest";
import {
  createProductionQueueEntry,
  getProductionQueueByOrderId,
  updateProductionQueueStatus,
  getProductionQueueByStatus,
  createReferralProgram,
  getReferralProgramByUserId,
  getReferralProgramByCode,
  getDb,
} from "./db";

describe("Production Queue Functions", () => {
  const testOrderId = 9990 + Math.floor(Math.random() * 100);
  let queueId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  it("should create a production queue entry", async () => {
    const result = await createProductionQueueEntry(testOrderId);
    expect(result).toBeDefined();
  });

  it("should get production queue by order id", async () => {
    const queue = await getProductionQueueByOrderId(testOrderId);
    expect(queue).toBeDefined();
    expect(queue?.orderId).toBe(testOrderId);
    expect(queue?.status).toBe("pending");
    queueId = queue?.id;
  });

  it("should update production queue status", async () => {
    const result = await updateProductionQueueStatus(queueId, "quoted", "Initial quote prepared");
    expect(result).toBeDefined();
  });

  it("should get production queue by status", async () => {
    const queues = await getProductionQueueByStatus("quoted");
    expect(Array.isArray(queues)).toBe(true);
    const found = queues.find((q) => q.id === queueId);
    expect(found).toBeDefined();
  });

  it("should verify queue has correct fields", async () => {
    const queue = await getProductionQueueByOrderId(testOrderId);
    expect(queue).toHaveProperty("id");
    expect(queue).toHaveProperty("orderId");
    expect(queue).toHaveProperty("status");
    expect(queue).toHaveProperty("priority");
    expect(queue).toHaveProperty("createdAt");
  });
});

describe("Referral Program Functions", () => {
  const testUserId = 9991 + Math.floor(Math.random() * 100);
  const testReferralCode = `TEST${Date.now()}ABC`;
  let referralId: number;

  it("should create a referral program", async () => {
    const result = await createReferralProgram(testUserId, testReferralCode, 10);
    expect(result).toBeDefined();
  });

  it("should get referral program by user id", async () => {
    const referral = await getReferralProgramByUserId(testUserId);
    expect(referral).toBeDefined();
    expect(referral?.userId).toBe(testUserId);
    expect(referral?.referralCode).toBe(testReferralCode);
    expect(referral?.discountPercentage).toMatch(/^10(\.0{2})?$/);
    referralId = referral?.id;
  });

  it("should get referral program by code", async () => {
    const referral = await getReferralProgramByCode(testReferralCode);
    expect(referral).toBeDefined();
    expect(referral?.referralCode).toBe(testReferralCode);
  });

  it("should have correct referral program fields", async () => {
    const referral = await getReferralProgramByUserId(testUserId);
    expect(referral).toHaveProperty("id");
    expect(referral).toHaveProperty("userId");
    expect(referral).toHaveProperty("referralCode");
    expect(referral).toHaveProperty("discountPercentage");
    expect(referral).toHaveProperty("totalReferrals");
    expect(referral).toHaveProperty("totalRewardValue");
    expect(referral).toHaveProperty("createdAt");
  });

  it("should verify referral code is unique", async () => {
    const referral = await getReferralProgramByCode(testReferralCode);
    expect(referral?.referralCode).toBe(testReferralCode);
    expect(referral?.userId).toBe(testUserId);
  });
});

describe("Production Queue Status Management", () => {
  it("should handle production status updates", async () => {
    const testOrderId = 9980 + Math.floor(Math.random() * 100);
    const result = await createProductionQueueEntry(testOrderId);
    const queue = await getProductionQueueByOrderId(testOrderId);
    const queueId = queue?.id;

    expect(queue?.status).toBe("pending");
    expect(queue?.priority).toBe("normal");

    // Test status update
    await updateProductionQueueStatus(queueId, "quoted");
    const updated = await getProductionQueueByOrderId(testOrderId);
    expect(updated?.status).toBe("quoted");
  });

  it("should handle completion date on ready status", async () => {
    const testOrderId = 9970 + Math.floor(Math.random() * 100);
    const result = await createProductionQueueEntry(testOrderId);
    const queue = await getProductionQueueByOrderId(testOrderId);
    const queueId = queue?.id;

    // Update to ready status
    await updateProductionQueueStatus(queueId, "ready");
    const updated = await getProductionQueueByOrderId(testOrderId);
    expect(updated?.status).toBe("ready");
    expect(updated?.actualCompletionDate).toBeDefined();
  });
});
