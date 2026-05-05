import { getTransporter, SMTP_FROM_EMAIL } from "./mailer";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function sendOrderConfirmationEmail(
  orderId: number,
  customerName: string,
  customerEmail: string,
  deliveryMethod: "collection" | "delivery",
  totalPrice: number
) {
  // Credentials are managed centrally in mailer.ts
  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available - cannot fetch order details for email");
      return;
    }

    // Fetch full order details
    const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (orderData.length === 0) {
      console.warn(`Order ${orderId} not found in database`);
      return;
    }

    const order = orderData[0];

    // Calculate estimated delivery date
    const today = new Date();
    let estimatedDeliveryDate = new Date(today);
    
    if (deliveryMethod === "collection") {
      estimatedDeliveryDate.setDate(today.getDate() + 1);
    } else {
      estimatedDeliveryDate.setDate(today.getDate() + 3);
    }

    const deliveryDateStr = estimatedDeliveryDate.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const collectionAddress = "308 Cape Road, Newton Park, Gqeberha, 6045";

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FFD400; border-bottom: 3px solid #FFD400; padding-bottom: 10px;">Order Confirmation</h2>
            
            <p>Hi ${customerName},</p>
            
            <p style="font-size: 16px; margin: 20px 0;">
              Thank you for your order! We have received your custom DTF printing request and are excited to bring your design to life.
            </p>

            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <strong style="font-size: 18px; color: #000;">Order #${orderId}</strong><br/>
              <strong>Order Date:</strong> ${today.toLocaleDateString('en-ZA')}<br/>
              <strong>Estimated ${deliveryMethod === 'collection' ? 'Collection' : 'Delivery'} Date:</strong> ${deliveryDateStr}<br/>
              <strong>Total Amount:</strong> <span style="color: #FFD400; font-size: 18px;">R${totalPrice.toFixed(2)}</span>
            </div>

            <h3 style="color: #000; margin-top: 20px;">Delivery Information</h3>
            ${deliveryMethod === 'collection' ? `
              <p><strong>Collection Address:</strong><br/>
              ${collectionAddress}</p>
              <p>Your order will be ready for collection on the estimated date above. Please bring a valid ID for collection.</p>
            ` : `
              <p><strong>Delivery Address:</strong><br/>
              ${order.deliveryAddress || 'To be confirmed'}</p>
              <p>Your order will be delivered within 2-4 business days. You will receive a tracking update once your order ships.</p>
            `}

            <h3 style="color: #000; margin-top: 20px;">Payment Instructions</h3>
            <div style="background-color: #fff9e6; padding: 15px; border-left: 4px solid #FFD400; border-radius: 4px;">
              <strong>Bank Details for Payment:</strong><br/>
              Bank: Standard Bank<br/>
              Account Name: Print Cartel<br/>
              Account Number: 123456789<br/>
              Branch Code: 051001<br/>
              Reference: Order #${orderId}
            </div>

            <p style="margin-top: 15px;">
              <strong>Please use your Order ID as the payment reference.</strong> This helps us match your payment to your order quickly.
            </p>

            <h3 style="color: #000; margin-top: 20px;">What Happens Next?</h3>
            <ol>
              <li>We will review your artwork and verify the quality</li>
              <li>Our team will prepare a detailed quote if needed</li>
              <li>You will receive an update via email once your order is approved</li>
              <li>Your order will enter production</li>
              <li>You will be notified when your order is ready</li>
            </ol>

            <h3 style="color: #000; margin-top: 20px;">Track Your Order</h3>
            <p>You can track your order status anytime using the link below:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://printcartel.co.za/track?email=${encodeURIComponent(customerEmail)}&orderId=${orderId}" style="background-color: #FFD400; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Track Order #${orderId}</a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #666;">Or visit: https://printcartel.co.za/track</p>

            <p style="margin-top: 30px; color: #666;">
              If you have any questions about your order, please do not hesitate to contact us at <strong>sales@printcartel.co.za</strong> or call us during business hours.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;"/>
            <p style="color: #999; font-size: 11px; text-align: center;">
              This is an automated confirmation email from Print Cartel. Please keep this email for your records.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
ORDER CONFIRMATION

Hi ${customerName},

Thank you for your order! We have received your custom DTF printing request.

ORDER DETAILS:
Order ID: #${orderId}
Order Date: ${today.toLocaleDateString('en-ZA')}
Estimated ${deliveryMethod === 'collection' ? 'Collection' : 'Delivery'} Date: ${deliveryDateStr}
Total Amount: R${totalPrice.toFixed(2)}

${deliveryMethod === 'collection' ? `COLLECTION ADDRESS:
${collectionAddress}

Your order will be ready for collection on the estimated date above.` : `DELIVERY ADDRESS:
${order.deliveryAddress || 'To be confirmed'}

Your order will be delivered within 2-4 business days.`}

PAYMENT INSTRUCTIONS:
Please transfer the total amount to:
Bank: Standard Bank
Account Name: Print Cartel
Account Number: 123456789
Branch Code: 051001
Reference: Order #${orderId}

WHAT HAPPENS NEXT:
1. We will review your artwork and verify the quality
2. Our team will prepare a detailed quote if needed
3. You will receive an update via email once your order is approved
4. Your order will enter production
5. You will be notified when your order is ready

Track your order anytime at:
https://printcartel.co.za/track?email=${customerEmail}&orderId=${orderId}

If you have any questions, contact us at sales@printcartel.co.za

---
This is an automated confirmation email from Print Cartel.
    `;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: customerEmail,
      subject: `Order Confirmation #${orderId} - Print Cartel`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Order confirmation email sent to ${customerEmail} for order #${orderId}`);
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    throw error;
  }
}
