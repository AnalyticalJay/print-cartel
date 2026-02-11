import nodemailer from "nodemailer";
import { getDb } from "./db";
import { orders, orderPrints, products, printOptions, printPlacements } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";
const TO_EMAIL = "sales@printcartel.co.za";

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

interface OrderNotificationData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  totalPrice: number;
}

export async function sendOrderNotificationEmail(data: OrderNotificationData) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("Email service not configured - skipping email send");
    return;
  }

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
      from: FROM_EMAIL,
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
