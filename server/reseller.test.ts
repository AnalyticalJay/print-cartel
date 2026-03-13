import { describe, it, expect, beforeAll } from "vitest";
import {
  createResellerInquiry,
  getResellerInquiry,
  getAllResellerInquiries,
  updateResellerInquiryStatus,
  getBulkPricingTiers,
  getAllBulkPricingTiers,
} from "./db";

describe("Reseller functionality", () => {
  let inquiryId: number;

  it("should create a reseller inquiry", async () => {
    const result = await createResellerInquiry({
      companyName: "Test Print Shop",
      contactName: "John Doe",
      email: "john@printshop.com",
      phone: "+1-555-0123",
      businessType: "Print Shop",
      estimatedMonthlyVolume: "100-500",
      message: "Interested in bulk DTF printing",
      status: "new",
    });

    expect(result).toBeGreaterThan(0);
    inquiryId = result;
  });

  it("should retrieve a reseller inquiry", async () => {
    const inquiry = await getResellerInquiry(inquiryId);

    expect(inquiry).toBeDefined();
    expect(inquiry?.companyName).toBe("Test Print Shop");
    expect(inquiry?.contactName).toBe("John Doe");
    expect(inquiry?.email).toBe("john@printshop.com");
    expect(inquiry?.status).toBe("new");
  });

  it("should update reseller inquiry status", async () => {
    await updateResellerInquiryStatus(inquiryId, "contacted");

    const inquiry = await getResellerInquiry(inquiryId);
    expect(inquiry?.status).toBe("contacted");
  });

  it("should get all reseller inquiries", async () => {
    const inquiries = await getAllResellerInquiries();

    expect(Array.isArray(inquiries)).toBe(true);
    expect(inquiries.length).toBeGreaterThan(0);
    expect(inquiries.some((i: any) => i.id === inquiryId)).toBe(true);
  });

  it("should create multiple reseller inquiries", async () => {
    const id1 = await createResellerInquiry({
      companyName: "Event Company A",
      contactName: "Jane Smith",
      email: "jane@events.com",
      phone: "+1-555-0124",
      businessType: "Event Company",
      estimatedMonthlyVolume: "50-100",
      message: null,
      status: "new",
    });

    const id2 = await createResellerInquiry({
      companyName: "Clothing Brand B",
      contactName: "Bob Johnson",
      email: "bob@clothing.com",
      phone: "+1-555-0125",
      businessType: "Clothing Brand",
      estimatedMonthlyVolume: "500+",
      message: "Looking for wholesale pricing",
      status: "new",
    });

    expect(id1).toBeGreaterThan(0);
    expect(id2).toBeGreaterThan(0);
    expect(id1).not.toBe(id2);
  });

  it("should have proper inquiry timestamps", async () => {
    const inquiry = await getResellerInquiry(inquiryId);

    expect(inquiry?.createdAt).toBeDefined();
    expect(inquiry?.updatedAt).toBeDefined();
  });

  it("should handle different business types", async () => {
    const businessTypes = [
      "Print Shop",
      "Clothing Brand",
      "Event Company",
      "E-commerce Store",
      "Corporate Gifts",
    ];

    for (const businessType of businessTypes) {
      const id = await createResellerInquiry({
        companyName: `Test Company - ${businessType}`,
        contactName: "Test Contact",
        email: `test-${businessType}@example.com`,
        phone: "+1-555-0126",
        businessType,
        estimatedMonthlyVolume: "100-500",
        message: null,
        status: "new",
      });

      expect(id).toBeGreaterThan(0);

      const inquiry = await getResellerInquiry(id);
      expect(inquiry?.businessType).toBe(businessType);
    }
  });

  it("should handle different volume ranges", async () => {
    const volumes = ["10-50", "51-100", "101-500", "500+"];

    for (const volume of volumes) {
      const id = await createResellerInquiry({
        companyName: `Test Company - ${volume}`,
        contactName: "Test Contact",
        email: `test-${volume}@example.com`,
        phone: "+1-555-0127",
        businessType: "Print Shop",
        estimatedMonthlyVolume: volume,
        message: null,
        status: "new",
      });

      expect(id).toBeGreaterThan(0);

      const inquiry = await getResellerInquiry(id);
      expect(inquiry?.estimatedMonthlyVolume).toBe(volume);
    }
  });

  it("should update inquiry through different statuses", async () => {
    const id = await createResellerInquiry({
      companyName: "Status Test Company",
      contactName: "Test Contact",
      email: "status-test@example.com",
      phone: "+1-555-0128",
      businessType: "Print Shop",
      estimatedMonthlyVolume: "100-500",
      message: null,
      status: "new",
    });

    const statuses: Array<"new" | "contacted" | "qualified" | "rejected"> = [
      "new",
      "contacted",
      "qualified",
    ];

    for (const status of statuses) {
      await updateResellerInquiryStatus(id, status);
      const inquiry = await getResellerInquiry(id);
      expect(inquiry?.status).toBe(status);
    }
  });

  it("should get bulk pricing tiers for a product", async () => {
    const tiers = await getBulkPricingTiers(60001);
    expect(Array.isArray(tiers)).toBe(true);
  });

  it("should get all bulk pricing tiers", async () => {
    const allTiers = await getAllBulkPricingTiers();
    expect(Array.isArray(allTiers)).toBe(true);
  });
});
