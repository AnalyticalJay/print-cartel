/**
 * Admin Notification Email Templates
 * Sends design file links and order details to admin for review
 */

export interface AdminNotificationData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  quantity: number;
  totalPrice: number;
  designFiles: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  orderDate: Date;
}

/**
 * Generate HTML email template for admin design review notification
 */
export function generateAdminNotificationHTML(data: AdminNotificationData): string {
  const orderDate = new Date(data.orderDate).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const designFilesHTML = data.designFiles
    .map(
      (file, index) => `
    <div style="margin: 10px 0; padding: 12px; background-color: #f0f9ff; border-left: 3px solid #0891b2; border-radius: 4px;">
      <p style="margin: 0 0 8px 0; color: #0891b2; font-weight: bold;">Design File ${index + 1}</p>
      <p style="margin: 0 0 8px 0; color: #333;">
        <strong>File:</strong> ${file.name}
      </p>
      <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
        <strong>Uploaded:</strong> ${new Date(file.uploadedAt).toLocaleString("en-ZA")}
      </p>
      <p style="margin: 0; color: #0891b2;">
        <a href="${file.url}" style="color: #0891b2; text-decoration: none; font-weight: bold;">
          📥 Download Design File
        </a>
      </p>
    </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
        .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section { margin: 20px 0; }
        .section-title { color: #0891b2; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: bold; color: #0891b2; }
        .info-value { color: #333; }
        .price-highlight { font-size: 18px; font-weight: bold; color: #0891b2; }
        .button { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
        .alert { padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 15px 0; }
        .alert-title { color: #92400e; font-weight: bold; margin: 0 0 5px 0; }
        .alert-text { color: #92400e; margin: 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📋 Order Design Review Required</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Order #${data.orderId} - ${orderDate}</p>
        </div>

        <div class="content">
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${data.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${data.customerEmail}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Details</div>
            <div class="info-row">
              <span class="info-label">Quantity:</span>
              <span class="info-value">${data.quantity} units</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Price:</span>
              <span class="price-highlight">R${data.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Design Files for Review</div>
            ${designFilesHTML}
          </div>

          <div class="alert">
            <p class="alert-title">⚠️ Action Required:</p>
            <p class="alert-text">
              Please review the design files above and update the order status in the admin dashboard.
              Approve the designs or request changes from the customer.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://printcartel.co.za/admin/orders/${data.orderId}" class="button">Review Order in Dashboard</a>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 6px;">
            <p style="margin: 0 0 10px 0; color: #0891b2; font-weight: bold;">Quick Actions:</p>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li>Review design files for quality and specifications</li>
              <li>Approve designs to proceed with production</li>
              <li>Request changes if designs don't meet requirements</li>
              <li>Update order status and send customer notification</li>
            </ul>
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
 * Send admin notification email with design file links
 */
export async function sendAdminNotificationEmail(
  data: AdminNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailContent = generateAdminNotificationHTML(data);

    // Send email via SMTP
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY || ""}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "admin@printcartel.co.za" }],
            subject: `Design Review Required - Order #${data.orderId} from ${data.customerName}`,
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
    console.error("Failed to send admin notification email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
