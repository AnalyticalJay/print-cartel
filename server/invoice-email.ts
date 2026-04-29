import { getTransporter } from "./_core/email";
import { generateInvoiceEmailHTML } from "./invoice-generator";

export interface InvoiceEmailData {
  orderId: number;
  customerEmail: string;
  customerName: string;
  totalPrice: number;
  deliveryCharge?: number;
  paymentMethod?: string;
  invoicePdfUrl?: string;
}

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const html = generateInvoiceEmailHTML(
      data.orderId,
      data.customerName,
      data.totalPrice,
      data.deliveryCharge,
      data.paymentMethod
    );

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "sales@printcartel.co.za",
      to: data.customerEmail,
      subject: `Invoice Ready - Order #${data.orderId} | Print Cartel`,
      html,
      attachments: data.invoicePdfUrl
        ? [
            {
              filename: `invoice-${data.orderId}.pdf`,
              path: data.invoicePdfUrl,
            },
          ]
        : undefined,
    });

    console.log(`✓ Invoice email sent to ${data.customerEmail}`, result.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending invoice email:", error);
    return false;
  }
}

/**
 * Send invoice email to admin for notification
 */
export async function sendInvoiceNotificationToAdmin(data: InvoiceEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@printcartel.co.za";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #00d4ff; color: black; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .details p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Invoice Generated - Order #${data.orderId}</h2>
          </div>

          <p>An invoice has been generated and sent to the customer.</p>

          <div class="details">
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Order ID:</strong> #${data.orderId}</p>
            <p><strong>Invoice Total:</strong> R${data.totalPrice.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> Full Payment</p>
          </div>

          <p>The customer has been notified and can accept or decline the invoice from their dashboard.</p>
        </div>
      </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || "sales@printcartel.co.za",
      to: adminEmail,
      subject: `Invoice Generated - Order #${data.orderId}`,
      html,
    });

    console.log(`✓ Invoice notification sent to admin`, result.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending invoice notification to admin:", error);
    return false;
  }
}
