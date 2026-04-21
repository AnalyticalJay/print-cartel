import { describe, it, expect } from "vitest";
import {
  generateSalesNotificationHTML,
  SalesNotificationData,
} from "./sales-notification-email";
import {
  generateAdminNotificationHTML,
  AdminNotificationData,
} from "./admin-notification-email";

describe("Sales Notification Email", () => {
  const mockSalesData: SalesNotificationData = {
    orderId: 12345,
    customerName: "John Smith",
    customerEmail: "john@example.com",
    garmentType: "T-Shirt",
    color: "Navy Blue",
    size: "Large",
    quantity: 50,
    totalPrice: 2500,
    designFileName: "logo-design.png",
    designFileUrl: "https://example.com/designs/logo.png",
    mockupUrl: "https://example.com/mockups/tshirt-mockup.png",
    orderDate: new Date("2026-04-21"),
  };

  it("should generate valid HTML email template", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("should include customer information in email", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("John Smith");
    expect(html).toContain("john@example.com");
  });

  it("should include order details in email", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("T-Shirt");
    expect(html).toContain("Navy Blue");
    expect(html).toContain("Large");
    expect(html).toContain("50");
    expect(html).toContain("2500");
  });

  it("should include design file link in email", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("logo-design.png");
    expect(html).toContain("https://example.com/designs/logo.png");
  });

  it("should include mockup preview in email", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("Garment Mockup Preview");
    expect(html).toContain("https://example.com/mockups/tshirt-mockup.png");
  });

  it("should include order ID in subject line", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("Order #12345");
  });

  it("should include admin dashboard link", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("https://printcartel.co.za/admin/orders/12345");
  });

  it("should format price in ZAR currency", () => {
    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("R2500.00");
  });

  it("should handle missing design file gracefully", () => {
    const dataWithoutDesign = { ...mockSalesData, designFileUrl: undefined };
    const html = generateSalesNotificationHTML(dataWithoutDesign);
    expect(html).not.toContain("Download Design File");
  });

  it("should handle missing mockup gracefully", () => {
    const dataWithoutMockup = { ...mockSalesData, mockupUrl: undefined };
    const html = generateSalesNotificationHTML(dataWithoutMockup);
    expect(html).not.toContain("Garment Mockup Preview");
  });
});

describe("Admin Notification Email", () => {
  const mockAdminData: AdminNotificationData = {
    orderId: 12345,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    quantity: 100,
    totalPrice: 5000,
    designFiles: [
      {
        name: "design-front.png",
        url: "https://example.com/designs/front.png",
        uploadedAt: new Date("2026-04-21T10:00:00Z"),
      },
      {
        name: "design-back.png",
        url: "https://example.com/designs/back.png",
        uploadedAt: new Date("2026-04-21T10:15:00Z"),
      },
    ],
    orderDate: new Date("2026-04-21"),
  };

  it("should generate valid HTML email template", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("should include customer information", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("Jane Doe");
    expect(html).toContain("jane@example.com");
  });

  it("should include order details", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("100");
    expect(html).toContain("5000");
  });

  it("should include all design files with download links", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("design-front.png");
    expect(html).toContain("design-back.png");
    expect(html).toContain("https://example.com/designs/front.png");
    expect(html).toContain("https://example.com/designs/back.png");
  });

  it("should include upload timestamps for each design file", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("Uploaded");
  });

  it("should include admin dashboard link", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("https://printcartel.co.za/admin/orders/12345");
  });

  it("should include action items", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("Review design files");
    expect(html).toContain("Approve designs");
    expect(html).toContain("Request changes");
  });

  it("should format price correctly", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("R5000.00");
  });

  it("should handle empty design files array", () => {
    const dataWithoutDesigns = { ...mockAdminData, designFiles: [] };
    const html = generateAdminNotificationHTML(dataWithoutDesigns);
    expect(html).toContain("Design Files for Review");
  });

  it("should display design file count in header", () => {
    const html = generateAdminNotificationHTML(mockAdminData);
    expect(html).toContain("Design File 1");
    expect(html).toContain("Design File 2");
  });
});

describe("Email Integration", () => {
  it("should have consistent styling between sales and admin emails", () => {
    const mockSalesData: SalesNotificationData = {
      orderId: 1,
      customerName: "Test",
      customerEmail: "test@example.com",
      garmentType: "Shirt",
      color: "Red",
      size: "M",
      quantity: 10,
      totalPrice: 500,
      orderDate: new Date(),
    };

    const mockAdminData: AdminNotificationData = {
      orderId: 1,
      customerName: "Test",
      customerEmail: "test@example.com",
      quantity: 10,
      totalPrice: 500,
      designFiles: [],
      orderDate: new Date(),
    };

    const salesHtml = generateSalesNotificationHTML(mockSalesData);
    const adminHtml = generateAdminNotificationHTML(mockAdminData);

    // Both should have similar structure
    expect(salesHtml).toContain("<!DOCTYPE html>");
    expect(adminHtml).toContain("<!DOCTYPE html>");

    // Both should have gradient styling
    expect(salesHtml).toContain("linear-gradient");
    expect(adminHtml).toContain("linear-gradient");

    // Both should reference the same domain
    expect(salesHtml).toContain("printcartel.co.za");
    expect(adminHtml).toContain("printcartel.co.za");
  });

  it("should include proper email headers and footers", () => {
    const mockSalesData: SalesNotificationData = {
      orderId: 1,
      customerName: "Test",
      customerEmail: "test@example.com",
      garmentType: "Shirt",
      color: "Red",
      size: "M",
      quantity: 10,
      totalPrice: 500,
      orderDate: new Date(),
    };

    const html = generateSalesNotificationHTML(mockSalesData);
    expect(html).toContain("Print Cartel");
    expect(html).toContain("automated notification");
  });
});
