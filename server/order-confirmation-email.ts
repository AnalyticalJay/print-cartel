import nodemailer from "nodemailer";
import { getDb } from "./db";
import { orders, orderPrints, products, printOptions, printPlacements } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";
const APP_URL = process.env.VITE_APP_URL || "https://printcartel.co.za";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporter;
}

interface OrderConfirmationData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  estimatedDelivery?: string;
}

/**
 * Send order confirmation email to customer with:
 * - Order details and summary
 * - Tracking link to order status page
 * - Payment instructions
 * - Next steps
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("Email service not configured - skipping order confirmation email");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available - cannot send order confirmation email");
      return;
    }

    // Fetch full order details
    const orderData = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);

    if (orderData.length === 0) {
      console.warn(`Order ${data.orderId} not found for confirmation email`);
      return;
    }

    const order = orderData[0];

    // Fetch product information
    const productData = await db.select().from(products).where(eq(products.id, order.productId)).limit(1);
    const product = productData[0];

    // Fetch order prints
    const prints = await db.select().from(orderPrints).where(eq(orderPrints.orderId, data.orderId));

    // Build print details table
    let printDetailsHtml = "";
    for (const print of prints) {
      const placementData = await db
        .select()
        .from(printPlacements)
        .where(eq(printPlacements.id, print.placementId))
        .limit(1);
      const placement = placementData[0];

      printDetailsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${placement?.placementName || "N/A"}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${print.uploadedFileName || "Design file"}</td>
        </tr>
      `;
    }

    const trackingUrl = `${APP_URL}/my-account/orders/${data.orderId}`;
    const paymentUrl = `${APP_URL}/my-account/orders/${data.orderId}/payment`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #00bcd4 0%, #0288d1 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 15px; border-bottom: 2px solid #00bcd4; padding-bottom: 10px; }
            .order-summary { background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-label { font-weight: 600; color: #666; }
            .summary-value { color: #000; }
            .order-id { font-size: 24px; font-weight: bold; color: #00bcd4; }
            .total-price { font-size: 20px; font-weight: bold; color: #0288d1; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background-color: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00bcd4 0%, #0288d1 100%); color: white; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 10px 5px 10px 0; }
            .button:hover { opacity: 0.9; }
            .button-secondary { background: #f5f5f5; color: #0288d1; border: 2px solid #0288d1; }
            .payment-instructions { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .payment-instructions h3 { margin-top: 0; color: #856404; }
            .next-steps { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .next-steps h3 { margin-top: 0; color: #2e7d32; }
            .next-steps ol { margin: 10px 0; padding-left: 20px; }
            .next-steps li { margin: 8px 0; }
            .footer { background-color: #f9f9f9; padding: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #999; }
            .contact-info { margin: 15px 0; }
            .contact-info p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>✓ Order Confirmed!</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for your order</p>
            </div>

            <!-- Main Content -->
            <div class="content">
              <p>Hi <strong>${data.customerName}</strong>,</p>
              
              <p>We've received your order and it's being processed. Your order details are below.</p>

              <!-- Order Summary -->
              <div class="section">
                <div class="section-title">Order Summary</div>
                <div class="order-summary">
                  <div class="summary-row">
                    <span class="summary-label">Order ID:</span>
                    <span class="summary-value order-id">#${data.orderId}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Product:</span>
                    <span class="summary-value">${product?.name || "Custom DTF Print"}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Quantity:</span>
                    <span class="summary-value">${order.quantity} unit(s)</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Order Date:</span>
                    <span class="summary-value">${new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  ${data.estimatedDelivery ? `
                    <div class="summary-row">
                      <span class="summary-label">Estimated Delivery:</span>
                      <span class="summary-value">${data.estimatedDelivery}</span>
                    </div>
                  ` : ""}
                  <div class="summary-row" style="border-top: 1px solid #ddd; padding-top: 12px; margin-top: 12px;">
                    <span class="summary-label" style="font-size: 16px;">Total Amount:</span>
                    <span class="summary-value total-price">R${data.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Print Details -->
              <div class="section">
                <div class="section-title">Print Details</div>
                <table>
                  <thead>
                    <tr>
                      <th>Placement</th>
                      <th>Design File</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${printDetailsHtml}
                  </tbody>
                </table>
              </div>

              <!-- Payment Instructions -->
              <div class="payment-instructions">
                <h3 style="margin-top: 0;">💳 Payment Required</h3>
                <p>To proceed with production, payment is required. You can pay online securely through our payment portal.</p>
                <a href="${paymentUrl}" class="button">Make Payment Now</a>
              </div>

              <!-- Next Steps -->
              <div class="next-steps">
                <h3 style="margin-top: 0;">📋 What Happens Next</h3>
                <ol>
                  <li><strong>Payment Processing:</strong> Complete payment to proceed with production</li>
                  <li><strong>Design Review:</strong> Our team will review your design files for quality</li>
                  <li><strong>Production:</strong> Once approved, your order enters production</li>
                  <li><strong>Quality Check:</strong> Final quality inspection before dispatch</li>
                  <li><strong>Delivery:</strong> Your order will be shipped or ready for collection</li>
                </ol>
              </div>

              <!-- Track Order -->
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>Track Your Order Anytime:</strong></p>
                <a href="${trackingUrl}" class="button">View Order Status</a>
              </div>

              <!-- Contact Info -->
              <div class="contact-info" style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Need Help?</h3>
                <p>If you have any questions about your order, please don't hesitate to contact us:</p>
                <p>
                  📧 Email: <a href="mailto:sales@printcartel.co.za">sales@printcartel.co.za</a><br/>
                  📞 Phone: <a href="tel:+27021300455">+27 (021) 300 4455</a>
                </p>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Thank you for choosing Print Cartel for your custom DTF printing needs. We're committed to delivering high-quality products on time.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0;">© 2024 Print Cartel. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply directly. Use the contact information above.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
ORDER CONFIRMATION - Order #${data.orderId}

Thank you for your order!

ORDER SUMMARY:
Order ID: #${data.orderId}
Product: ${product?.name || "Custom DTF Print"}
Quantity: ${order.quantity} unit(s)
Order Date: ${new Date(order.createdAt).toLocaleDateString()}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ""}
Total Amount: R${data.totalPrice.toFixed(2)}

PRINT DETAILS:
${prints.map((print) => `- ${print.uploadedFileName || "Design file"}`).join("\n")}

PAYMENT REQUIRED:
To proceed with production, please make payment at:
${paymentUrl}

WHAT HAPPENS NEXT:
1. Payment Processing: Complete payment to proceed with production
2. Design Review: Our team will review your design files for quality
3. Production: Once approved, your order enters production
4. Quality Check: Final quality inspection before dispatch
5. Delivery: Your order will be shipped or ready for collection

TRACK YOUR ORDER:
View your order status anytime at: ${trackingUrl}

NEED HELP?
Email: sales@printcartel.co.za
Phone: +27 (021) 300 4455

Thank you for choosing Print Cartel!

---
This is an automated email. Please do not reply directly.
    `;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmation #${data.orderId} - Print Cartel`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Order confirmation email sent to ${data.customerEmail} for order #${data.orderId}`);
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    throw error;
  }
}
