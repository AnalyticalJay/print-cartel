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
 * Send email when quote is generated for customer
 */
export async function sendQuoteReceivedEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  productName: string,
  quantity: number,
  totalAmount: number,
  depositAmount: number
) {
  const subject = `Your Quote is Ready - Order #${orderId} - Print Cartel`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">✓ Your Quote is Ready</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>Great news! We've prepared a quote for your order. Please review the details below and let us know if you'd like to proceed or if you have any questions.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Product:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${productName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Quantity:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${quantity} units</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Total Quote:</strong></td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #667eea;">R${totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="background: #f0f4ff;">
              <td style="padding: 10px 0; color: #333;"><strong>50% Deposit Due:</strong></td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #667eea;">R${depositAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0099cc; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #004085;">Next Steps</h4>
          <ol style="color: #004085; margin: 10px 0;">
            <li>Review the quote details in your account</li>
            <li>Accept or decline the quote</li>
            <li>If accepted, proceed with payment of the 50% deposit</li>
            <li>We'll begin production once payment is confirmed</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://printcartel.co.za/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View & Accept Quote
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">Important Information</h4>
          <p style="margin: 10px 0; color: #856404; font-size: 14px;">
            This quote is valid for <strong>7 days</strong> from the date of this email. If you don't accept the quote within this period, we may need to provide a revised quote based on current pricing.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you have any questions about your quote, please don't hesitate to contact us.<br>
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
    console.error("Failed to send quote received email:", error);
    return false;
  }
}
