import { sendMail } from "./mailer";

async function sendEmail(options: { to: string; subject: string; html: string }) {
  return sendMail({ to: options.to, subject: options.subject, html: options.html });
}

interface PaymentProofEmailData {
  customerEmail: string;
  customerName: string;
  orderId: number;
  orderAmount: number;
  paymentMethods: ("eft" | "creditcard")[];
  templateDownloadUrl?: string;
}

/**
 * Send payment proof template instructions to customer
 * Includes links to download templates and instructions for both EFT and Credit Card payments
 */
export async function sendPaymentProofTemplateEmail(data: PaymentProofEmailData) {
  const {
    customerEmail,
    customerName,
    orderId,
    orderAmount,
    paymentMethods,
    templateDownloadUrl,
  } = data;

  const eftIncluded = paymentMethods.includes("eft");
  const creditCardIncluded = paymentMethods.includes("creditcard");

  const paymentMethodsHtml = `
    <div style="margin: 20px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px;">
      <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px; font-size: 16px;">📄 Available Payment Proof Templates</h3>
      <p style="color: #475569; margin: 0 0 15px 0; font-size: 14px;">
        We've prepared interactive templates to help you document your payment. Choose the template that matches your payment method:
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
        ${
          eftIncluded
            ? `
        <div style="background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #cbd5e1;">
          <h4 style="color: #0c4a6e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">💳 EFT/Bank Transfer Template</h4>
          <p style="color: #64748b; margin: 0 0 10px 0; font-size: 13px;">
            Use this template if you're making a bank transfer (EFT) to our account.
          </p>
          <p style="color: #64748b; margin: 0; font-size: 12px;">
            <strong>Required Information:</strong>
            <br>• Payment date and time
            <br>• Your bank and account details
            <br>• Transaction reference number
            <br>• Receiver bank details
            <br>• Transaction status
          </p>
        </div>
        `
            : ""
        }
        
        ${
          creditCardIncluded
            ? `
        <div style="background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #cbd5e1;">
          <h4 style="color: #0c4a6e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">💳 Credit Card Template</h4>
          <p style="color: #64748b; margin: 0 0 10px 0; font-size: 13px;">
            Use this template if you're paying with a credit or debit card.
          </p>
          <p style="color: #64748b; margin: 0; font-size: 12px;">
            <strong>Required Information:</strong>
            <br>• Payment date and time
            <br>• Card type and last 4 digits
            <br>• Authorization code
            <br>• Transaction ID
            <br>• Receipt number
          </p>
        </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Proof Templates - Print Cartel</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">Payment Proof Templates</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Order #${orderId}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">
            Hi <strong>${customerName}</strong>,
          </p>

          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">
            Your order is ready for payment! To help you submit a valid payment proof, we've prepared interactive templates that guide you through the process step-by-step.
          </p>

          <!-- Order Summary -->
          <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 4px; border-left: 4px solid #0891b2;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Order ID</p>
                <p style="color: #0c4a6e; margin: 0; font-size: 16px; font-weight: bold;">ORD-${orderId}</p>
              </div>
              <div>
                <p style="color: #64748b; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Amount Due</p>
                <p style="color: #0c4a6e; margin: 0; font-size: 16px; font-weight: bold;">R${orderAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <!-- Payment Methods -->
          ${paymentMethodsHtml}

          <!-- How to Use Templates -->
          <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px; font-size: 16px;">📋 How to Use These Templates</h3>
            <ol style="color: #92400e; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
              <li style="margin-bottom: 8px;"><strong>Select Template:</strong> Choose the template that matches your payment method</li>
              <li style="margin-bottom: 8px;"><strong>Fill in Details:</strong> Complete all fields with information from your bank statement or receipt</li>
              <li style="margin-bottom: 8px;"><strong>Review:</strong> Double-check all information for accuracy</li>
              <li style="margin-bottom: 8px;"><strong>Download/Print:</strong> Save as HTML or print the template</li>
              <li><strong>Upload:</strong> Submit the completed proof with your order in your customer dashboard</li>
            </ol>
          </div>

          <!-- Tips -->
          <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
            <h3 style="color: #166534; margin-top: 0; margin-bottom: 15px; font-size: 16px;">✓ Tips for Valid Payment Proof</h3>
            <ul style="color: #166534; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
              <li style="margin-bottom: 6px;">Ensure all amounts match your order total</li>
              <li style="margin-bottom: 6px;">Include transaction/reference numbers for tracking</li>
              <li style="margin-bottom: 6px;">Verify payment status shows as "Completed" or "Approved"</li>
              <li style="margin-bottom: 6px;">Keep personal information (full card numbers, PIN) private</li>
              <li style="margin-bottom: 6px;">Only include last 4 digits of account/card numbers</li>
              <li>Save a copy for your records</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="${templateDownloadUrl || "https://printcartel.co.za/track"}" style="display: inline-block; padding: 12px 30px; background-color: #0891b2; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">
              Access Templates in Dashboard
            </a>
          </div>

          <!-- FAQ -->
          <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
            <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px; font-size: 14px; font-weight: 600;">❓ Frequently Asked Questions</h3>
            
            <div style="margin-bottom: 15px;">
              <p style="color: #0c4a6e; margin: 0 0 5px 0; font-size: 13px; font-weight: 600;">What if I don't have all the information?</p>
              <p style="color: #64748b; margin: 0; font-size: 12px;">Fill in as much information as you can. The template will help guide you on what's required for verification.</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="color: #0c4a6e; margin: 0 0 5px 0; font-size: 13px; font-weight: 600;">Can I edit the template after downloading?</p>
              <p style="color: #64748b; margin: 0; font-size: 12px;">Yes! The templates are interactive HTML files that you can edit, print, or save as PDF.</p>
            </div>

            <div>
              <p style="color: #0c4a6e; margin: 0 0 5px 0; font-size: 13px; font-weight: 600;">How long does verification take?</p>
              <p style="color: #64748b; margin: 0; font-size: 12px;">Our team typically verifies payment proofs within 24 hours during business days.</p>
            </div>
          </div>

          <!-- Contact -->
          <div style="margin: 20px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 13px;">
              <strong>Need Help?</strong> If you have any questions about the payment proof templates, please contact our support team or reply to this email.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0 0 10px 0; font-size: 12px;">
            Print Cartel - Custom DTF Printing
          </p>
          <p style="color: #94a3b8; margin: 0; font-size: 11px;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Payment Proof Templates Ready - Order #${orderId}`,
    html,
  });
}

/**
 * Send payment proof submission confirmation
 */
export async function sendPaymentProofSubmissionEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: number;
  paymentMethod: "eft" | "creditcard";
  submittedAt: Date;
}) {
  const { customerEmail, customerName, orderId, paymentMethod, submittedAt } = data;

  const methodLabel = paymentMethod === "eft" ? "EFT/Bank Transfer" : "Credit Card";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Proof Received - Print Cartel</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">✓ Payment Proof Received</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Order #${orderId}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">
            Hi <strong>${customerName}</strong>,
          </p>

          <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">
            Thank you! We've received your payment proof for order #${orderId}. Our team is now reviewing your submission.
          </p>

          <!-- Submission Details -->
          <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border-radius: 4px; border-left: 4px solid #22c55e;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="color: #65a30d; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Payment Method</p>
                <p style="color: #166534; margin: 0; font-size: 14px; font-weight: bold;">${methodLabel}</p>
              </div>
              <div>
                <p style="color: #65a30d; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600;">Submitted</p>
                <p style="color: #166534; margin: 0; font-size: 14px; font-weight: bold;">${submittedAt.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <!-- What Happens Next -->
          <div style="margin: 20px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px; font-size: 16px;">📋 What Happens Next</h3>
            <ol style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
              <li style="margin-bottom: 8px;"><strong>Verification:</strong> Our team will verify your payment proof within 24 hours</li>
              <li style="margin-bottom: 8px;"><strong>Confirmation:</strong> You'll receive an email confirming approval or requesting additional information</li>
              <li><strong>Production:</strong> Once approved, your order will enter our production queue</li>
            </ol>
          </div>

          <!-- Status Check -->
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://printcartel.co.za/track" style="display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">
              Check Order Status
            </a>
          </div>

          <!-- Note -->
          <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="color: #92400e; margin: 0; font-size: 13px;">
              <strong>Note:</strong> If your payment proof is rejected, we'll send you detailed feedback on what needs to be corrected. You can resubmit an updated proof immediately.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0 0 10px 0; font-size: 12px;">
            Print Cartel - Custom DTF Printing
          </p>
          <p style="color: #94a3b8; margin: 0; font-size: 11px;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Payment Proof Received - Order #${orderId}`,
    html,
  });
}
