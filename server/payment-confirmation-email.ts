import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(options: { to: string; subject: string; html: string }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Send email when payment is verified for customer
 */
export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  invoiceNumber: string,
  amountPaid: number,
  totalAmount: number,
  remainingBalance: number,
  paymentDate: string,
  paymentMethod?: string
) {
  const subject = `Payment Confirmed - Order #${orderId} - Print Cartel`;
  const isFullPayment = remainingBalance === 0;
  const isDepositPayment = !isFullPayment;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">✓ Payment Confirmed</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>Thank you! We've successfully received and verified your payment. Your order is now confirmed and will move into production.</p>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #155724;">✓ Payment Received</h4>
          <p style="margin: 10px 0; color: #155724;">
            Your payment has been successfully verified. Production will begin immediately.
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #333;">Payment Receipt</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Invoice Number:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Payment Date:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${paymentDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Amount Paid:</strong></td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #28a745;">R${amountPaid.toFixed(2)}</td>
            </tr>
            ${paymentMethod ? `
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Payment Method:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod === 'eft' ? 'EFT' : 'PayFast'}</td>
            </tr>
            ` : ''}
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Total Order Amount:</strong></td>
              <td style="padding: 10px 0; text-align: right;">R${totalAmount.toFixed(2)}</td>
            </tr>
            ${isDepositPayment ? `
            <tr style="background: #fff3cd;">
              <td style="padding: 10px 0; color: #856404;"><strong>Remaining Balance:</strong></td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #856404;">R${remainingBalance.toFixed(2)}</td>
            </tr>
            ` : ""}
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0099cc;">
          <h3 style="margin-top: 0; color: #333;">What Happens Next</h3>
          <ol style="color: #666;">
            <li><strong>Production Starts:</strong> Your order is now in our production queue and will begin immediately</li>
            <li><strong>Quality Check:</strong> We'll perform quality checks throughout production</li>
            <li><strong>Status Updates:</strong> You'll receive updates as your order progresses through each stage</li>
            <li><strong>Ready for Delivery:</strong> We'll notify you when your order is ready for collection or shipping</li>
            ${isDepositPayment ? `<li><strong>Final Payment:</strong> The remaining balance of R${remainingBalance.toFixed(2)} will be due before delivery</li>` : ""}
          </ol>
        </div>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0099cc; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #004085;">Track Your Order</h4>
          <p style="margin: 10px 0; color: #004085;">
            You can track the progress of your order anytime by logging into your account. We'll also send you email updates at each stage of production.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://printcartel.co.za/dashboard" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Your Order
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Thank you for your business! If you have any questions about your order, please don't hesitate to contact us.<br>
          <strong>Print Cartel</strong> - Custom DTF Printing<br>
          Email: sales@printcartel.co.za
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: customerEmail,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
    return false;
  }
}
