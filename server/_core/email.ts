import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@printcartel.com';

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  orderDate: Date;
  estimatedDelivery?: Date;
  trackingUrl?: string;
}

export interface StatusUpdateEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  previousStatus: string;
  newStatus: string;
  updateMessage?: string;
  trackingUrl?: string;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF6B35; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .footer { background-color: #f0f0f0; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF6B35; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; }
            .button { background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
              <p>Thank you for your order!</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>We've received your order and are excited to get started on your custom DTF printing project!</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <div class="detail-row">
                  <span class="label">Order ID:</span>
                  <span>#${data.orderId}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Product:</span>
                  <span>${data.productName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Quantity:</span>
                  <span>${data.quantity}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Price:</span>
                  <span>R${data.totalPrice.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Order Date:</span>
                  <span>${new Date(data.orderDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span>${data.status}</span>
                </div>
                ${data.estimatedDelivery ? `
                <div class="detail-row">
                  <span class="label">Estimated Delivery:</span>
                  <span>${new Date(data.estimatedDelivery).toLocaleDateString()}</span>
                </div>
                ` : ''}
              </div>

              <p>You can track your order status anytime by visiting our website.</p>
              ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="button">Track Your Order</a>` : ''}

              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions, please don't hesitate to contact us.
              </p>
            </div>
            <div class="footer">
              <p>Print Cartel - Custom DTF Printing</p>
              <p>© 2026 All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmation - Order #${data.orderId}`,
      html,
      text: `Order Confirmation\n\nThank you for your order!\n\nOrder ID: #${data.orderId}\nProduct: ${data.productName}\nQuantity: ${data.quantity}\nTotal: R${data.totalPrice.toFixed(2)}\n\nYou can track your order at: ${data.trackingUrl || 'https://printcartel.co.za/track-order'}`,
    });

    console.log(`✓ Order confirmation email sent to ${data.customerEmail}`, result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    return false;
  }
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusUpdateEmail(data: StatusUpdateEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const statusMessages: Record<string, string> = {
      pending: 'Your order has been received and is pending review.',
      quoted: 'We\'ve prepared a quote for your order. Please review and approve to proceed.',
      approved: 'Your order has been approved and is ready for production!',
      'in-production': 'Your order is now in production. We\'re working on your custom design!',
      completed: 'Your order is complete and ready for shipping.',
      shipped: 'Your order has been shipped! Track your package using the link below.',
      cancelled: 'Your order has been cancelled.',
    };

    const statusColors: Record<string, string> = {
      pending: '#FFA500',
      quoted: '#4169E1',
      approved: '#32CD32',
      'in-production': '#FF6B35',
      completed: '#9370DB',
      shipped: '#20B2AA',
      cancelled: '#DC143C',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColors[data.newStatus] || '#FF6B35'}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .footer { background-color: #f0f0f0; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; }
            .status-box { background-color: ${statusColors[data.newStatus] || '#FF6B35'}; color: white; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .status-box h2 { margin: 0; font-size: 24px; }
            .button { background-color: ${statusColors[data.newStatus] || '#FF6B35'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Status Update</h1>
              <p>Order #${data.orderId}</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              
              <div class="status-box">
                <h2>${data.newStatus.toUpperCase()}</h2>
              </div>

              <p>${statusMessages[data.newStatus] || 'Your order status has been updated.'}</p>
              
              ${data.updateMessage ? `<p><strong>Update:</strong> ${data.updateMessage}</p>` : ''}

              <p style="margin-top: 20px;">
                <strong>Order Details:</strong><br>
                Order ID: #${data.orderId}<br>
                Previous Status: ${data.previousStatus}<br>
                New Status: ${data.newStatus}
              </p>

              ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="button">View Order Details</a>` : ''}

              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions, please contact us at support@printcartel.co.za
              </p>
            </div>
            <div class="footer">
              <p>Print Cartel - Custom DTF Printing</p>
              <p>© 2026 All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order #${data.orderId} - Status Update: ${data.newStatus.toUpperCase()}`,
      html,
      text: `Order Status Update\n\nOrder #${data.orderId}\n\nStatus: ${data.newStatus}\n\n${statusMessages[data.newStatus] || 'Your order status has been updated.'}\n\n${data.updateMessage ? `Update: ${data.updateMessage}\n` : ''}`,
    });

    console.log(`✓ Status update email sent to ${data.customerEmail}`, result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    return false;
  }
}

/**
 * Send new order notification email to admin
 */
export async function sendNewOrderNotificationEmail(data: OrderEmailData, adminEmail: string = SMTP_FROM_EMAIL): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF6B35; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .footer { background-color: #f0f0f0; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF6B35; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; }
            .button { background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order Received</h1>
              <p>Order #${data.orderId}</p>
            </div>
            <div class="content">
              <p>A new order has been received and requires attention.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <div class="detail-row">
                  <span class="label">Order ID:</span>
                  <span>#${data.orderId}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Customer Name:</span>
                  <span>${data.customerName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Customer Email:</span>
                  <span>${data.customerEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Customer Phone:</span>
                  <span>${data.customerPhone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Product:</span>
                  <span>${data.productName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Quantity:</span>
                  <span>${data.quantity}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Price:</span>
                  <span>R${data.totalPrice.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Order Date:</span>
                  <span>${new Date(data.orderDate).toLocaleDateString()} ${new Date(data.orderDate).toLocaleTimeString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span>${data.status}</span>
                </div>
              </div>

              <p>Please log in to the admin panel to review and process this order.</p>
              <a href="https://printcartel.co.za/admin" class="button">View in Admin Panel</a>

              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
            <div class="footer">
              <p>Print Cartel - Custom DTF Printing</p>
              <p>© 2026 All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: adminEmail,
      subject: `New Order #${data.orderId} - ${data.customerName}`,
      html,
      text: `New Order Received\n\nOrder ID: #${data.orderId}\nCustomer: ${data.customerName}\nEmail: ${data.customerEmail}\nPhone: ${data.customerPhone || 'N/A'}\nProduct: ${data.productName}\nQuantity: ${data.quantity}\nTotal: R${data.totalPrice.toFixed(2)}\n\nPlease log in to the admin panel to process this order.`,
    });

    console.log(`✓ New order notification email sent to admin`, result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending new order notification email:', error);
    return false;
  }
}

/**
 * Send admin notification email
 */
export async function sendAdminNotificationEmail(
  subject: string,
  html: string,
  adminEmail: string = SMTP_FROM_EMAIL
): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const result = await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: adminEmail,
      subject,
      html,
    });

    console.log(`✓ Admin notification email sent`, result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    return false;
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✓ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    return false;
  }
}
