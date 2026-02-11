import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@printcartel.co.za";
const TO_EMAIL = "sales@printcartel.co.za";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      } : undefined,
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

  const transporter = getTransporter();

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>New Order Request #${data.orderId}</h2>
        
        <h3>Customer Information</h3>
        <p>
          <strong>Name:</strong> ${data.customerName}<br/>
          <strong>Email:</strong> ${data.customerEmail}<br/>
          <strong>Phone:</strong> ${data.customerPhone}<br/>
          ${data.customerCompany ? `<strong>Company:</strong> ${data.customerCompany}<br/>` : ""}
        </p>

        <h3>Order Details</h3>
        <p>
          <strong>Order ID:</strong> ${data.orderId}<br/>
          <strong>Estimated Total:</strong> R${data.totalPrice.toFixed(2)}<br/>
          <strong>Status:</strong> Pending
        </p>

        <p>Please log in to the admin dashboard to view full order details, download artwork files, and manage the order status.</p>

        <hr/>
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Print Cartel. Please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const textContent = `
New Order Request #${data.orderId}

Customer Information:
Name: ${data.customerName}
Email: ${data.customerEmail}
Phone: ${data.customerPhone}
${data.customerCompany ? `Company: ${data.customerCompany}` : ""}

Order Details:
Order ID: ${data.orderId}
Estimated Total: R${data.totalPrice.toFixed(2)}
Status: Pending

Please log in to the admin dashboard to view full order details, download artwork files, and manage the order status.
  `;

  try {
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
