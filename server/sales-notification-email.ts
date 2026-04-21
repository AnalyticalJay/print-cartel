import { getDb, getOrderById } from "./db";

/**
 * Sales Notification Email Template
 * Sends order details to sales team with mockup preview and design file links
 */

export interface SalesNotificationData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  garmentType: string;
  color: string;
  size: string;
  quantity: number;
  totalPrice: number;
  designFileName?: string;
  designFileUrl?: string;
  mockupUrl?: string;
  orderDate: Date;
}

/**
 * Generate HTML email template for sales notification
 */
export function generateSalesNotificationHTML(data: SalesNotificationData): string {
  const orderDate = new Date(data.orderDate).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mockupSection = data.mockupUrl
    ? `
    <div style="margin: 20px 0; text-align: center;">
      <h3 style="color: #0891b2; margin-bottom: 10px;">Garment Mockup Preview</h3>
      <img src="${data.mockupUrl}" alt="Garment Mockup" style="max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
    </div>
    `
    : "";

  const designLinkSection = data.designFileUrl
    ? `
    <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Design File:</p>
      <p style="margin: 0; color: #0891b2;">
        <a href="${data.designFileUrl}" style="color: #0891b2; text-decoration: none; font-weight: bold;">
          📥 Download Design File: ${data.designFileName || "design.png"}
        </a>
      </p>
    </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
        .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .order-details { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #0891b2; }
        .detail-value { color: #333; }
        .price-highlight { font-size: 18px; font-weight: bold; color: #0891b2; }
        .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🎨 New Order Received</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Order #${data.orderId} - ${orderDate}</p>
        </div>

        <div class="content">
          <h2 style="color: #0891b2; margin-top: 0;">Customer Information</h2>
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${data.customerName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${data.customerEmail}</span>
            </div>
          </div>

          <h2 style="color: #0891b2;">Order Details</h2>
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Garment:</span>
              <span class="detail-value">${data.garmentType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Color:</span>
              <span class="detail-value">${data.color}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Size:</span>
              <span class="detail-value">${data.size}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">${data.quantity} units</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Price:</span>
              <span class="price-highlight">R${data.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          ${mockupSection}

          ${designLinkSection}

          <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Action Required:</p>
            <p style="margin: 5px 0 0 0; color: #92400e;">
              Please review this order in the admin dashboard and update the design approval status.
              <a href="https://printcartel.co.za/admin" style="color: #f59e0b; font-weight: bold; text-decoration: none;">Go to Admin Dashboard →</a>
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://printcartel.co.za/admin/orders/${data.orderId}" class="button">View Order in Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <p>Print Cartel - Custom DTF Printing Platform</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send sales notification email to sales team
 */
export async function sendSalesNotificationEmail(
  data: SalesNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailContent = generateSalesNotificationHTML(data);

    // Send email via SMTP (implementation depends on your email service)
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY || ""}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "sales@printcartel.co.za" }],
            subject: `New Order #${data.orderId} - ${data.customerName}`,
          },
        ],
        from: { email: process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za" },
        content: [
          {
            type: "text/html",
            value: emailContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send sales notification email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch order data and prepare sales notification
 */
export async function prepareSalesNotification(orderId: number): Promise<SalesNotificationData | null> {
  try {
    const orderData = await getOrderById(orderId);

    if (!orderData) {
      return null;
    }

    const customerName = `${orderData.customerFirstName || ""} ${orderData.customerLastName || ""}`.trim() || "Customer";

    return {
      orderId: orderData.id,
      customerName,
      customerEmail: orderData.customerEmail || "",
      garmentType: "Custom Garment",
      color: "N/A",
      size: "N/A",
      quantity: orderData.quantity || 1,
      totalPrice: parseFloat(orderData.totalPriceEstimate?.toString() || "0"),
      designFileName: undefined,
      designFileUrl: undefined,
      mockupUrl: undefined,
      orderDate: orderData.createdAt || new Date(),
    };
  } catch (error) {
    console.error("Error preparing sales notification:", error);
    return null;
  }
}
