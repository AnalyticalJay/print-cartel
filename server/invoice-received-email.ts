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
 * Send email when invoice is generated for customer
 */
export async function sendInvoiceReceivedEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  invoiceNumber: string,
  totalAmount: number,
  depositAmount: number,
  dueDate: string
) {
  const subject = `Invoice Ready - Order #${orderId} - Print Cartel`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Invoice Ready</h1>
        <p style="margin: 10px 0 0 0;">Invoice #${invoiceNumber}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>Your invoice has been generated and is ready for payment. Please review the details below and proceed with payment to secure your order.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d4ff;">
          <h3 style="margin-top: 0; color: #333;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Invoice Number:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Order Number:</strong></td>
              <td style="padding: 10px 0; text-align: right;">#${orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;"><strong>Total Amount:</strong></td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">R${totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #00d4ff; background: #f0f4ff;">
              <td style="padding: 10px 0; color: #333;"><strong>Amount Due Now (50% Deposit):</strong></td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #00d4ff;">R${depositAmount.toFixed(2)}</td>
            </tr>
            <tr style="background: #fff3cd;">
              <td style="padding: 10px 0; color: #856404;"><strong>Payment Due Date:</strong></td>
              <td style="padding: 10px 0; text-align: right; color: #856404; font-weight: bold;">${dueDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #333;">Payment Instructions</h3>
          <p style="color: #666; margin: 10px 0;">
            Please transfer the deposit amount to the following account:
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Bank:</strong> Capitec Business</p>
            <p style="margin: 5px 0; color: #333;"><strong>Account Number:</strong> 1051316758</p>
            <p style="margin: 5px 0; color: #333;"><strong>Reference:</strong> INV-${invoiceNumber}</p>
          </div>
          <p style="color: #666; margin: 10px 0; font-size: 14px;">
            Once payment is received and verified, we'll immediately begin production on your order.
          </p>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #155724;">What Happens Next?</h4>
          <ol style="color: #155724; margin: 10px 0;">
            <li>Make payment of R${depositAmount.toFixed(2)} to the account above</li>
            <li>Upload proof of payment to your dashboard</li>
            <li>We'll verify your payment and start production</li>
            <li>You'll receive updates as your order progresses</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://printcartel.co.za/dashboard" style="background: #00d4ff; color: black; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Invoice & Upload Payment Proof
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you have any questions about your invoice or need assistance with payment, please contact us.<br>
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
    console.error("Failed to send invoice received email:", error);
    return false;
  }
}
