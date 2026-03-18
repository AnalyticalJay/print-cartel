import nodemailer from "nodemailer";
import { getDb } from "./db";
import { orders, products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";

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

type OrderStatus = "pending" | "quoted" | "approved" | "in-production" | "ready" | "completed" | "shipped" | "cancelled";

interface StatusChangeEmailData {
  orderId: number;
  customerEmail: string;
  customerName: string;
  newStatus: OrderStatus;
  previousStatus?: OrderStatus;
  quoteAmount?: number;
  productionNotes?: string;
}

// Status-specific messages and colors
const statusConfig: Record<OrderStatus, {
  message: string;
  color: string;
  textColor: string;
  icon: string;
  nextSteps: string[];
}> = {
  pending: {
    message: "Your order has been received and is being reviewed by our team. We will prepare a quote for you shortly.",
    color: "#fff3cd",
    textColor: "#856404",
    icon: "📋",
    nextSteps: [
      "Our team is reviewing your artwork and specifications",
      "We will verify file quality and print requirements",
      "A detailed quote will be prepared and sent to you",
    ],
  },
  quoted: {
    message: "A detailed quote has been prepared for your order. Please review the quote amount and confirm to proceed with production.",
    color: "#cfe2ff",
    textColor: "#084298",
    icon: "💰",
    nextSteps: [
      "Review the quote amount provided",
      "Confirm your approval to proceed",
      "Make payment to secure your order",
      "Your order will move to production once payment is received",
    ],
  },
  approved: {
    message: "Your order has been approved! We are now preparing your custom apparel for production.",
    color: "#d1e7dd",
    textColor: "#0f5132",
    icon: "✅",
    nextSteps: [
      "Your order is being prepared for production",
      "Our team will set up the printing equipment",
      "Production will begin shortly",
      "You will receive a notification when printing starts",
    ],
  },
  "in-production": {
    message: "Your order is now in production! Our team is carefully printing your custom design onto your apparel.",
    color: "#fff3cd",
    textColor: "#856404",
    icon: "🖨️",
    nextSteps: [
      "Your design is being printed with precision",
      "Quality checks are performed during production",
      "Once complete, your order will move to quality inspection",
      "You will be notified when production is complete",
    ],
  },
  ready: {
    message: "Great news! Your order is complete and ready for collection or delivery.",
    color: "#d1e7dd",
    textColor: "#0f5132",
    icon: "📦",
    nextSteps: [
      "Your order has passed quality inspection",
      "It is now ready for collection or delivery",
      "Please arrange collection or provide delivery instructions",
      "Contact us if you need to reschedule",
    ],
  },
  completed: {
    message: "Your order has been completed! Thank you for choosing Print Cartel.",
    color: "#d1e7dd",
    textColor: "#0f5132",
    icon: "🎉",
    nextSteps: [
      "Your order is complete and has been delivered",
      "We hope you are satisfied with the quality",
      "Please share your feedback with us",
      "Feel free to place another order anytime",
    ],
  },
  shipped: {
    message: "Your order is on its way! It has been shipped and will arrive soon.",
    color: "#cfe2ff",
    textColor: "#084298",
    icon: "🚚",
    nextSteps: [
      "Your order has been shipped",
      "Tracking information will be provided separately",
      "Expected delivery is within 2-4 business days",
      "Please ensure someone is available to receive the delivery",
    ],
  },
  cancelled: {
    message: "Your order has been cancelled. If you have any questions, please contact us.",
    color: "#f8d7da",
    textColor: "#842029",
    icon: "❌",
    nextSteps: [
      "Your order has been cancelled",
      "Any payments will be refunded to your original payment method",
      "Refunds may take 3-5 business days to appear",
      "Please contact us if you have any questions",
    ],
  },
};

export async function sendOrderStatusChangeEmail(data: StatusChangeEmailData) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("Email service not configured - skipping status change email send");
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available - cannot fetch order details for email");
      return;
    }

    // Fetch full order details
    const orderData = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
    if (orderData.length === 0) {
      console.warn(`Order ${data.orderId} not found in database`);
      return;
    }

    const order = orderData[0];

    // Fetch product information
    const productData = await db.select().from(products).where(eq(products.id, order.productId)).limit(1);
    const product = productData[0];

    const config = statusConfig[data.newStatus];

    // Build HTML content
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000; border-bottom: 3px solid #000; padding-bottom: 10px;">
              ${config.icon} Order Status Update
            </h2>
            
            <p>Hi ${data.customerName},</p>
            
            <p style="font-size: 16px; margin: 20px 0;">
              ${config.message}
            </p>

            <div style="background-color: ${config.color}; color: ${config.textColor}; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid ${config.textColor};">
              <strong style="font-size: 18px;">Order #${data.orderId}</strong><br/>
              <strong>Current Status:</strong> ${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1).replace(/-/g, " ")}<br/>
              <strong>Product:</strong> ${product?.name || "N/A"}<br/>
              <strong>Quantity:</strong> ${order.quantity}<br/>
              ${data.quoteAmount ? `<strong>Quote Amount:</strong> R${data.quoteAmount.toFixed(2)}<br/>` : ""}
              <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-ZA')}
            </div>

            ${data.productionNotes ? `
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #666; margin: 20px 0; border-radius: 4px;">
                <strong>Production Notes:</strong><br/>
                ${data.productionNotes}
              </div>
            ` : ""}

            <h3 style="color: #000; margin-top: 20px;">What Happens Next?</h3>
            <ol style="line-height: 1.8;">
              ${config.nextSteps.map(step => `<li>${step}</li>`).join("")}
            </ol>

            <h3 style="color: #000; margin-top: 20px;">Delivery Information</h3>
            <p>
              <strong>Delivery Method:</strong> ${order.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'}<br/>
              ${order.deliveryMethod === 'collection' 
                ? '<strong>Collection Address:</strong> 308 Cape Road, Newton Park, Gqeberha, 6045' 
                : `<strong>Delivery Address:</strong> ${order.deliveryAddress || 'To be confirmed'}`}
            </p>

            <h3 style="color: #000; margin-top: 20px;">Track Your Order</h3>
            <p>You can track your order status anytime using the link below:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://printcartel.co.za/track?email=${encodeURIComponent(data.customerEmail)}&orderId=${data.orderId}" style="background-color: #FFD400; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Track Order #${data.orderId}</a>
            </div>

            <p style="margin-top: 30px; color: #666;">
              If you have any questions about your order or need assistance, please contact us at <strong>sales@printcartel.co.za</strong> or reply to this email.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #999; font-size: 11px; text-align: center;">
              This is an automated status update email from Print Cartel. Please do not reply directly to this email. Contact us at sales@printcartel.co.za for support.
            </p>
          </div>
        </body>
      </html>
    `;

    // Build text content
    const textContent = `
ORDER STATUS UPDATE

Hi ${data.customerName},

${config.message}

ORDER DETAILS:
Order ID: #${data.orderId}
Current Status: ${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1).replace(/-/g, " ")}
Product: ${product?.name || "N/A"}
Quantity: ${order.quantity}
${data.quoteAmount ? `Quote Amount: R${data.quoteAmount.toFixed(2)}` : ""}
Order Date: ${new Date(order.createdAt).toLocaleDateString('en-ZA')}

${data.productionNotes ? `PRODUCTION NOTES:\n${data.productionNotes}\n` : ""}

WHAT HAPPENS NEXT:
${config.nextSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

DELIVERY INFORMATION:
Delivery Method: ${order.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'}
${order.deliveryMethod === 'collection' 
  ? 'Collection Address: 308 Cape Road, Newton Park, Gqeberha, 6045' 
  : `Delivery Address: ${order.deliveryAddress || 'To be confirmed'}`}

Track your order anytime at:
https://printcartel.co.za/track?email=${data.customerEmail}&orderId=${data.orderId}

If you have any questions, contact us at sales@printcartel.co.za

---
This is an automated status update email from Print Cartel.
    `;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order #${data.orderId} Status Update - ${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1).replace(/-/g, " ")}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Status change email sent for order #${data.orderId} to ${data.customerEmail} - New status: ${data.newStatus}`);
  } catch (error) {
    console.error("Failed to send status change email:", error);
    throw error;
  }
}
