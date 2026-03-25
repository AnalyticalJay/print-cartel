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
 * Send quote/invoice email when order is quoted
 */
export async function sendQuoteEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  invoiceNumber: string,
  totalAmount: number,
  depositAmount: number,
  deliveryCharge: number,
  paymentLink: string,
  acceptanceToken?: string
) {
  const subject = `Quote for Your Order #${orderId} - Print Cartel`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Quote Ready</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>Your order quote is ready! We've prepared a detailed quote for your custom DTF printing order. Please review the details below and proceed with payment to secure your order.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Order Number:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">#${orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Invoice Number:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Subtotal:</td>
              <td style="padding: 10px 0; text-align: right;">R${(totalAmount - deliveryCharge).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Delivery Charge:</td>
              <td style="padding: 10px 0; text-align: right;">R${deliveryCharge.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #667eea; background: #f0f4ff;">
              <td style="padding: 10px 0; color: #333; font-weight: bold;">Total Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #667eea;">R${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">Payment Options</h4>
          <p style="margin: 10px 0; color: #856404;">
            <strong>Option 1: Pay 50% Deposit</strong><br>
            Secure your order with a 50% deposit of <strong>R${depositAmount.toFixed(2)}</strong><br>
            Pay the remaining balance before production starts.
          </p>
          <p style="margin: 10px 0; color: #856404;">
            <strong>Option 2: Pay in Full</strong><br>
            Pay the complete amount of <strong>R${totalAmount.toFixed(2)}</strong> now and get your order prioritized.
          </p>
        </div>
        
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0099cc;">
          <h4 style="margin-top: 0; color: #004085;">Accept or Decline This Quote</h4>
          <p style="color: #004085; margin: 10px 0;">
            Please review the quote details above and let us know if you'd like to proceed.
          </p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <a href="https://printcartel.co.za/quote/accept?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&token=${acceptanceToken || ''}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; flex: 1; text-align: center;">
              ✓ Accept Quote
            </a>
            <a href="https://printcartel.co.za/quote/reject?orderId=${orderId}&email=${encodeURIComponent(customerEmail)}&token=${acceptanceToken || ''}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; flex: 1; text-align: center;">
              ✗ Decline Quote
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Proceed to Payment
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Quote Valid For:</strong> 7 days from the date of this email.<br>
          <strong>Next Steps:</strong> Click "Accept Quote" above to proceed, or click "Proceed to Payment" to pay directly.
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you have any questions about your quote, please don't hesitate to contact us.<br>
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
    console.error("Failed to send quote email:", error);
    return false;
  }
}

/**
 * Send final invoice email when order is approved
 */
export async function sendFinalInvoiceEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  invoiceNumber: string,
  totalAmount: number,
  amountPaid: number,
  remainingBalance: number,
  paymentLink: string
) {
  const subject = `Invoice for Your Order #${orderId} - Print Cartel`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Invoice</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>Your order has been approved and is ready for production! Below is your final invoice. ${remainingBalance > 0 ? 'Please complete the remaining payment to proceed with production.' : 'Thank you for your payment!'}</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #333;">Invoice Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Invoice Number:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">${invoiceNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Order Number:</td>
              <td style="padding: 10px 0; text-align: right;">#${orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Invoice Date:</td>
              <td style="padding: 10px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #333;">Payment Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Total Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">R${totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 10px 0; color: #666;">Amount Paid:</td>
              <td style="padding: 10px 0; text-align: right; color: #28a745;">R${amountPaid.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid ${remainingBalance > 0 ? '#ffc107' : '#28a745'}; background: ${remainingBalance > 0 ? '#fff3cd' : '#d4edda'};">
              <td style="padding: 10px 0; color: #333; font-weight: bold;">Remaining Balance:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${remainingBalance > 0 ? '#856404' : '#155724'};">R${remainingBalance.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        ${remainingBalance > 0 ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Complete Payment
          </a>
        </div>
        ` : `
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">✓ Payment received! Your order is ready for production.</p>
        </div>
        `}
        
        <p style="color: #666; font-size: 14px;">
          <strong>Production Timeline:</strong> Your order will begin production immediately upon payment completion.<br>
          <strong>Next Steps:</strong> You will receive updates as your order progresses through each production stage.
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you have any questions about your invoice or order, please contact us.<br>
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
    console.error("Failed to send final invoice email:", error);
    return false;
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  remainingBalance: number,
  paymentLink: string
) {
  const subject = `Payment Reminder - Order #${orderId} - Print Cartel`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ffc107; padding: 20px; color: #333; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Payment Reminder</h1>
        <p style="margin: 10px 0 0 0;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
        <p>Hi ${customerName},</p>
        
        <p>We noticed that your order is pending payment. Please complete the remaining payment of <strong>R${remainingBalance.toFixed(2)}</strong> to proceed with production.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Complete Payment Now
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Important:</strong> Production will begin immediately upon payment completion.
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px;">
          If you have any questions, please contact us.<br>
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
    console.error("Failed to send payment reminder email:", error);
    return false;
  }
}
