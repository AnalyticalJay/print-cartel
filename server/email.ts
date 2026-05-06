import { getTransporter, SMTP_FROM_EMAIL } from "./mailer";
import { getDb } from "./db";
import { orders, orderPrints, products, printOptions, printPlacements } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const TO_EMAIL = "sales@printcartel.co.za";

interface OrderNotificationData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  totalPrice: number;
}

export async function sendOrderNotificationEmail(data: OrderNotificationData) {
  // Credentials are managed centrally in mailer.ts

  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available - cannot fetch order details for email");
      return;
    }

    // Fetch full order details from database
    const orderData = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);

    if (orderData.length === 0) {
      console.warn(`Order ${data.orderId} not found in database`);
      return;
    }

    const order = orderData[0];

    // Fetch product information
    const productData = await db.select().from(products).where(eq(products.id, order.productId)).limit(1);
    const product = productData[0];

    // Fetch order prints
    const prints = await db.select().from(orderPrints).where(eq(orderPrints.orderId, data.orderId));

    // Build print details
    let printDetails = "";
    for (const print of prints) {
      const printOptionData = await db
        .select()
        .from(printOptions)
        .where(eq(printOptions.id, print.printSizeId))
        .limit(1);
      const printOption = printOptionData[0];

      const placementData = await db
        .select()
        .from(printPlacements)
        .where(eq(printPlacements.id, print.placementId))
        .limit(1);
      const placement = placementData[0];

      printDetails += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${placement?.placementName || "N/A"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${printOption?.printSize || "N/A"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${print.uploadedFileName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${print.fileSize ? `${(print.fileSize / 1024 / 1024).toFixed(2)} MB` : "N/A"}</td>
        </tr>
      `;
    }

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000; border-bottom: 3px solid #000; padding-bottom: 10px;">New Order Request #${data.orderId}</h2>
            
            <h3 style="color: #000; margin-top: 20px;">Customer Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 8px;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Email:</td>
                <td style="padding: 8px;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Phone:</td>
                <td style="padding: 8px;">${data.customerPhone}</td>
              </tr>
              ${data.customerCompany ? `<tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">${data.customerCompany}</td></tr>` : ""}
            </table>

            <h3 style="color: #000; margin-top: 20px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; width: 150px;">Order ID:</td>
                <td style="padding: 8px;">#${data.orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Product:</td>
                <td style="padding: 8px;">${product?.name || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Quantity:</td>
                <td style="padding: 8px;">${order.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Estimated Total:</td>
                <td style="padding: 8px; font-size: 16px; font-weight: bold; color: #000;">R${data.totalPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Status:</td>
                <td style="padding: 8px;"><span style="background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px;">Pending</span></td>
              </tr>
            </table>

            <h3 style="color: #000; margin-top: 20px;">Print Specifications</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Placement</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Print Size</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">File Name</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">File Size</th>
                </tr>
              </thead>
              <tbody>
                ${printDetails}
              </tbody>
            </table>

            ${order.additionalNotes ? `
              <h3 style="color: #000; margin-top: 20px;">Additional Notes</h3>
              <p style="background-color: #f9f9f9; padding: 12px; border-left: 4px solid #000;">${order.additionalNotes}</p>
            ` : ""}

            <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 4px;">
              <p style="margin: 0;">
                <strong>Next Steps:</strong><br/>
                1. Review the order details and uploaded artwork files<br/>
                2. Verify file quality and specifications<br/>
                3. Update the order status to "Quoted" with pricing<br/>
                4. Send quote to customer for approval
              </p>
            </div>

            <p style="margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
              <strong>Admin Dashboard:</strong> Log in to the admin dashboard to view full order details, download artwork files, manage order status, and adjust pricing if needed.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #999; font-size: 11px; text-align: center;">
              This is an automated email from Print Cartel. Please do not reply to this email. Contact the customer directly using the email address provided above.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
NEW ORDER REQUEST #${data.orderId}

CUSTOMER INFORMATION:
Name: ${data.customerName}
Email: ${data.customerEmail}
Phone: ${data.customerPhone}
${data.customerCompany ? `Company: ${data.customerCompany}` : ""}

ORDER DETAILS:
Order ID: #${data.orderId}
Product: ${product?.name || "N/A"}
Quantity: ${order.quantity}
Estimated Total: R${data.totalPrice.toFixed(2)}
Status: Pending

PRINT SPECIFICATIONS:
${prints
  .map((print, index) => {
    return `Print ${index + 1}: ${print.uploadedFileName}`;
  })
  .join("\n")}

${order.additionalNotes ? `ADDITIONAL NOTES:\n${order.additionalNotes}\n` : ""}

NEXT STEPS:
1. Review the order details and uploaded artwork files
2. Verify file quality and specifications
3. Update the order status to "Quoted" with pricing
4. Send quote to customer for approval

Log in to the admin dashboard to manage this order.

---
This is an automated email from Print Cartel. Please do not reply to this email.
    `;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: data.customerEmail,
      subject: `New Order Request #${data.orderId} from ${data.customerName}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Order notification email sent for order #${data.orderId}`);
  } catch (error) {
    console.error("Failed to send order notification email:", error);
    throw error;
  }
}

export async function sendStatusUpdateEmail(
  orderId: number,
  customerEmail: string,
  customerName: string,
  newStatus: "pending" | "quoted" | "approved" | "in-production" | "completed" | "shipped" | "cancelled",
  quoteAmount?: number
) {
  // Credentials are managed centrally in mailer.ts
  try {
    const statusMessages: Record<string, string> = {
      pending: "Your order is being reviewed by our team.",
      quoted: "A quote has been prepared for your order. Please review and confirm to proceed.",
      approved: "Your order has been approved and is now in production.",
      "in-production": "Your order is currently in production. We'll notify you when it's ready.",
      completed: "Your order is complete! It's ready for collection or delivery.",
    };

    const statusColors: Record<string, string> = {
      pending: "#fff3cd",
      quoted: "#cfe2ff",
      approved: "#d1e7dd",
    };

    const statusTextColors: Record<string, string> = {
      pending: "#856404",
      quoted: "#084298",
      approved: "#0f5132",
    };

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000; border-bottom: 3px solid #000; padding-bottom: 10px;">Order Status Update</h2>
            
            <p>Hi ${customerName},</p>
            
            <p style="font-size: 16px; margin: 20px 0;">
              ${statusMessages[newStatus]}
            </p>

            <div style="background-color: ${statusColors[newStatus]}; color: ${statusTextColors[newStatus]}; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <strong>Order #${orderId}</strong><br/>
              Status: <strong>${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</strong>
              ${quoteAmount ? `<br/>Quote Amount: <strong>R${quoteAmount.toFixed(2)}</strong>` : ""}
            </div>

            <p style="margin-top: 20px;">
              You can track your order status anytime by visiting our order tracking page.
            </p>
            <p style="margin-top: 16px;">
              <a href="https://printcartel.co.za/track?order=${orderId}&email=${encodeURIComponent(customerEmail)}" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:bold;">
                Track My Order
              </a>
            </p>

            <p style="margin-top: 30px; color: #666;">
              If you have any questions about your order, please do not hesitate to contact us.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #999; font-size: 11px; text-align: center;">
              This is an automated email from Print Cartel. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `ORDER STATUS UPDATE\n\nHi ${customerName},\n\n${statusMessages[newStatus]}\n\nOrder #${orderId}\nStatus: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}\n${quoteAmount ? `Quote Amount: R${quoteAmount.toFixed(2)}` : ""}\n\nTrack your order: https://printcartel.co.za/track?order=${orderId}&email=${encodeURIComponent(customerEmail)}\n\nIf you have any questions, please contact us.\n\n---\nThis is an automated email from Print Cartel. Please do not reply to this email.`;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: customerEmail,
      subject: `Order #${orderId} Status Update - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Status update email sent for order #${orderId} to ${customerEmail}`);
  } catch (error) {
    console.error("Failed to send status update email:", error);
    throw error;
  }
}

/**
 * Send a dedicated email to the customer when artwork is rejected / changes are requested.
 * Clearly identifies which placement's artwork needs to be re-uploaded and why.
 */
export async function sendArtworkChangesRequestedEmail(
  orderId: number,
  customerEmail: string,
  customerName: string,
  placementName: string,
  printSize: string,
  fileName: string,
  notes: string,
  trackingUrl: string = `https://printcartel.co.za/track?order=${orderId}&email=${encodeURIComponent(customerEmail)}`
) {
  try {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000; border-bottom: 3px solid #e63946; padding-bottom: 10px;">
              ⚠️ Artwork Changes Required — Order #${orderId}
            </h2>

            <p>Hi ${customerName},</p>

            <p>Thank you for your order. Our design team has reviewed your submitted artwork and requires changes before we can proceed to production.</p>

            <div style="background-color: #fff3cd; border-left: 4px solid #e63946; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Artwork File:</strong> ${fileName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Placement:</strong> ${placementName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Print Size:</strong> ${printSize}</p>
              <p style="margin: 0;"><strong>Reason / Changes Required:</strong><br/>${notes}</p>
            </div>

            <h3 style="color: #000; margin-top: 24px;">What to do next:</h3>
            <ol style="padding-left: 20px; line-height: 2;">
              <li>Review the feedback above and update your artwork accordingly.</li>
              <li>Ensure your file meets our requirements: 300 DPI, PNG/PDF, RGB colour mode, 0.5cm bleed margin.</li>
              <li>Place a new order with the corrected artwork file.</li>
            </ol>

            <p style="margin-top: 20px;">
              If you have any questions or need assistance, please reply to this email or contact us at
              <a href="mailto:sales@printcartel.co.za" style="color: #e63946;">sales@printcartel.co.za</a>.
            </p>

            <p style="margin-top: 16px;">
              <a href="${trackingUrl}" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:bold;">
                View My Orders
              </a>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #999; font-size: 11px; text-align: center;">
              This is an automated email from Print Cartel. Please do not reply to this email directly — contact us at sales@printcartel.co.za.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
ARTWORK CHANGES REQUIRED — Order #${orderId}

Hi ${customerName},

Our design team has reviewed your submitted artwork and requires changes before we can proceed to production.

Artwork File: ${fileName}
Placement: ${placementName}
Print Size: ${printSize}
Reason / Changes Required: ${notes}

WHAT TO DO NEXT:
1. Review the feedback above and update your artwork accordingly.
2. Ensure your file meets our requirements: 300 DPI, PNG/PDF, RGB colour mode, 0.5cm bleed margin.
3. Place a new order with the corrected artwork file.

If you have any questions, contact us at sales@printcartel.co.za.

View your orders: ${trackingUrl}

---
This is an automated email from Print Cartel.
    `.trim();

    const transporter = getTransporter();
    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: customerEmail,
      subject: `Action Required: Artwork Changes Needed — Order #${orderId}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Artwork changes requested email sent for order #${orderId} to ${customerEmail}`);
  } catch (error) {
    console.error("Failed to send artwork changes requested email:", error);
    throw error;
  }
}

export async function sendArtworkReUploadedEmail(
  orderId: number,
  customerEmail: string,
  customerName: string,
  fileName: string
) {
  try {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000; border-bottom: 3px solid #22c55e; padding-bottom: 10px;">
              ✅ Artwork Re-Submitted — Order #${orderId}
            </h2>
            <p>Hi ${customerName},</p>
            <p>Thank you for re-submitting your artwork. We have received your updated file and our design team will review it shortly.</p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Order:</strong> #${orderId}</p>
              <p style="margin: 0;"><strong>File Submitted:</strong> ${fileName}</p>
            </div>
            <p>We will notify you once the artwork has been reviewed. If any further changes are needed, we will contact you again.</p>
            <p style="margin-top: 16px;">
              <a href="https://printcartel.co.za/track?order=${orderId}&email=${encodeURIComponent(customerEmail)}" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:bold;">
                Track My Order
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #999; font-size: 11px; text-align: center;">
              This is an automated email from Print Cartel. Contact us at sales@printcartel.co.za for assistance.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `ARTWORK RE-SUBMITTED — Order #${orderId}\n\nHi ${customerName},\n\nThank you for re-submitting your artwork. We have received your updated file (${fileName}) and our design team will review it shortly.\n\nWe will notify you once the artwork has been reviewed.\n\nTrack your order: https://printcartel.co.za/track?order=${orderId}&email=${encodeURIComponent(customerEmail)}\n\nPrint Cartel Team`;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: customerEmail,
      subject: `Artwork Re-Submitted — Order #${orderId}`,
      html: htmlContent,
      text: textContent,
    });
    return true;
  } catch (error) {
    console.error("Failed to send artwork re-upload confirmation email:", error);
    return false;
  }
}
