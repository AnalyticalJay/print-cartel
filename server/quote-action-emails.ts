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
 * Send email when customer approves a quote
 */
export async function sendQuoteApprovedEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  totalAmount: number,
  depositAmount: number,
  paymentMethod: string
) {
  const subject = `Quote Approved - Order #${orderId} - Print Cartel`;
  
  const amountDue = paymentMethod === "deposit" ? depositAmount : totalAmount;
  const paymentDescription = paymentMethod === "deposit" 
    ? `50% deposit of R${depositAmount.toFixed(2)}`
    : `full payment of R${totalAmount.toFixed(2)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">✓ Quote Approved</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>Great news! Your quote has been approved. Your order is now ready to move into production once payment is received.</p>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #155724;">✓ Quote Approved</h4>
          <p style="margin: 10px 0; color: #155724;">
            Your quote has been successfully approved. Thank you for confirming the details of your order.
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d4ff;">
          <h3 style="margin-top: 0; color: #333;">Next Steps</h3>
          <ol style="color: #666;">
            <li><strong>Make Payment:</strong> Please proceed with ${paymentDescription} to secure your order</li>
            <li><strong>Production Starts:</strong> Once payment is confirmed, your order will move into production</li>
            <li><strong>Track Progress:</strong> You'll receive updates as your order progresses through production</li>
            <li><strong>Delivery:</strong> Your order will be ready for collection or delivery as scheduled</li>
          </ol>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #333;">Payment Due</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Total Order Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">R${totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #00d4ff; background: #f0f4ff;">
              <td style="padding: 10px 0; color: #333; font-weight: bold;">Amount Due Now:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #00d4ff;">R${amountDue.toFixed(2)}</td>
            </tr>
          </table>
          ${paymentMethod === "deposit" ? `
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
              <strong>Note:</strong> You've selected the 50% deposit option. The remaining balance of R${(totalAmount - depositAmount).toFixed(2)} will be due before production completes.
            </p>
          ` : ""}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://printcartel.co.za/dashboard" style="background: #00d4ff; color: black; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Order & Make Payment
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you have any questions about your order or payment, please don't hesitate to contact us.<br>
          <strong>Print Cartel</strong> - Custom DTF Printing<br>
          Email: support@printcartel.co.za
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
    console.error("Failed to send quote approved email:", error);
    return false;
  }
}

/**
 * Send email when customer rejects a quote
 */
export async function sendQuoteRejectedEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  rejectionReason: string
) {
  const subject = `Quote Rejected - Order #${orderId} - Print Cartel`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Quote Rejected</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>We've received your decision to reject the quote for Order #${orderId}. We appreciate your feedback and would like to help you find a solution that better meets your needs.</p>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #721c24;">Rejection Reason</h4>
          <p style="margin: 10px 0; color: #721c24; font-style: italic;">
            "${rejectionReason}"
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h3 style="margin-top: 0; color: #333;">What Happens Next?</h3>
          <p style="color: #666;">
            Our team has received your feedback about the rejected quote. We'll review your concerns and reach out to you shortly to discuss alternative options or adjustments that might work better for your needs.
          </p>
          <p style="color: #666;">
            You can expect to hear from us within 24 business hours with revised options or solutions.
          </p>
        </div>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0099cc; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #004085;">How Can We Help?</h4>
          <p style="margin: 10px 0; color: #004085;">
            If you'd like to discuss this further or have specific requirements, please reach out to our team directly:
          </p>
          <p style="margin: 10px 0; color: #004085;">
            <strong>Email:</strong> support@printcartel.co.za<br>
            <strong>Phone:</strong> +27 (0) XXX XXX XXXX
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://printcartel.co.za/dashboard" style="background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Order Details
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          We value your business and want to make sure we get this right for you.<br>
          <strong>Print Cartel</strong> - Custom DTF Printing<br>
          Email: support@printcartel.co.za
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
    console.error("Failed to send quote rejected email:", error);
    return false;
  }
}
