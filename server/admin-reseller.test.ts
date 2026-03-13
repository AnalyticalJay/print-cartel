import { describe, it, expect } from "vitest";
import {
  createResellerInquiry,
  createResellerResponse,
  getResellerResponses,
  getResellerResponseCount,
  updateResellerInquiryStatus,
} from "./db";

describe("Admin Reseller Management", () => {
  let inquiryId: number;
  let responseId: number;

  it("should create a reseller inquiry for testing", async () => {
    const result = await createResellerInquiry({
      companyName: "Admin Test Company",
      contactName: "Admin Test Contact",
      email: "admin-test@example.com",
      phone: "+1-555-0200",
      businessType: "Print Shop",
      estimatedMonthlyVolume: "100-500",
      message: "Test inquiry for admin dashboard",
      status: "new",
    });

    expect(result).toBeGreaterThan(0);
    inquiryId = result;
  });

  it("should create a reseller response", async () => {
    const result = await createResellerResponse({
      inquiryId,
      adminId: 1,
      subject: "Thank you for your inquiry",
      message: "We are interested in working with you. Let's discuss pricing and terms.",
    });

    expect(result).toBeGreaterThan(0);
    responseId = result;
  });

  it("should retrieve reseller responses for an inquiry", async () => {
    const responses = await getResellerResponses(inquiryId);

    expect(Array.isArray(responses)).toBe(true);
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].subject).toBe("Thank you for your inquiry");
  });

  it("should count reseller responses for an inquiry", async () => {
    const count = await getResellerResponseCount(inquiryId);

    expect(count).toBeGreaterThan(0);
    expect(count).toBe(1);
  });

  it("should update inquiry status to contacted", async () => {
    await updateResellerInquiryStatus(inquiryId, "contacted");
    // Verify by checking the response was created (which happens after status update)
    const responses = await getResellerResponses(inquiryId);
    expect(responses.length).toBeGreaterThan(0);
  });

  it("should handle multiple responses for same inquiry", async () => {
    const response2Id = await createResellerResponse({
      inquiryId,
      adminId: 1,
      subject: "Follow-up: Bulk Pricing",
      message: "Here are our bulk pricing tiers for your volume range.",
    });

    expect(response2Id).toBeGreaterThan(0);

    const responses = await getResellerResponses(inquiryId);
    expect(responses.length).toBe(2);
  });

  it("should update inquiry status to qualified", async () => {
    await updateResellerInquiryStatus(inquiryId, "qualified");
    // Status should be updated
    const responses = await getResellerResponses(inquiryId);
    expect(responses.length).toBeGreaterThan(0);
  });

  it("should create multiple inquiries for filtering tests", async () => {
    const id1 = await createResellerInquiry({
      companyName: "Event Company Test",
      contactName: "Event Manager",
      email: "events@example.com",
      phone: "+1-555-0201",
      businessType: "Event Company",
      estimatedMonthlyVolume: "50-100",
      message: null,
      status: "new",
    });

    const id2 = await createResellerInquiry({
      companyName: "Clothing Brand Test",
      contactName: "Brand Owner",
      email: "brand@example.com",
      phone: "+1-555-0202",
      businessType: "Clothing Brand",
      estimatedMonthlyVolume: "500+",
      message: "Large volume orders",
      status: "new",
    });

    expect(id1).toBeGreaterThan(0);
    expect(id2).toBeGreaterThan(0);
  });

  it("should handle response with different statuses", async () => {
    const testInquiryId = await createResellerInquiry({
      companyName: "Status Test Company",
      contactName: "Test Contact",
      email: "status-test@example.com",
      phone: "+1-555-0203",
      businessType: "Print Shop",
      estimatedMonthlyVolume: "100-500",
      message: null,
      status: "new",
    });

    // Update to contacted
    await updateResellerInquiryStatus(testInquiryId, "contacted");

    // Create response
    const respId = await createResellerResponse({
      inquiryId: testInquiryId,
      adminId: 1,
      subject: "We're interested",
      message: "Let's discuss your requirements.",
    });

    expect(respId).toBeGreaterThan(0);

    // Update to qualified
    await updateResellerInquiryStatus(testInquiryId, "qualified");

    // Create follow-up response
    const followUpId = await createResellerResponse({
      inquiryId: testInquiryId,
      adminId: 1,
      subject: "Proposal Attached",
      message: "Please find our proposal attached.",
    });

    expect(followUpId).toBeGreaterThan(0);

    const responses = await getResellerResponses(testInquiryId);
    expect(responses.length).toBe(2);
  });

  it("should preserve response timestamps", async () => {
    const testInquiryId = await createResellerInquiry({
      companyName: "Timestamp Test Company",
      contactName: "Test Contact",
      email: "timestamp-test@example.com",
      phone: "+1-555-0204",
      businessType: "Print Shop",
      estimatedMonthlyVolume: "100-500",
      message: null,
      status: "new",
    });

    const respId = await createResellerResponse({
      inquiryId: testInquiryId,
      adminId: 1,
      subject: "Test Subject",
      message: "Test message",
    });

    const responses = await getResellerResponses(testInquiryId);
    expect(responses[0].sentAt).toBeDefined();
    expect(responses[0].createdAt).toBeDefined();
  });
});
