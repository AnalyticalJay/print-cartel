/**
 * Payment Receipt Email Sender
 * Handles sending payment receipt emails to customers via SMTP
 */

import { getTransporter, SMTP_FROM_EMAIL } from "./mailer";
import { generatePaymentReceiptHTML, generatePaymentReceiptText, PaymentReceiptData } from "./payment-receipt-email";

/**
 * Send payment receipt email to customer
 */
export async function sendPaymentReceiptEmail(
  customerEmail: string,
  receiptData: PaymentReceiptData
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const transporter = getTransporter();
    

    const htmlContent = generatePaymentReceiptHTML(receiptData);
    const textContent = generatePaymentReceiptText(receiptData);

    const mailOptions = {
      from: `Print Cartel <${SMTP_FROM_EMAIL}>`,
      to: customerEmail,
      subject: `Payment Receipt - Invoice #${receiptData.invoiceNumber} | Print Cartel`,
      html: htmlContent,
      text: textContent,
      replyTo: "support@printcartel.co.za",
      headers: {
        "X-Order-ID": receiptData.orderId.toString(),
        "X-Invoice-Number": receiptData.invoiceNumber,
        "X-Payment-Date": receiptData.paymentDate,
      },
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✓ Payment receipt email sent to ${customerEmail} (Message ID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`✗ Failed to send payment receipt email to ${customerEmail}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send payment receipt email with retry logic
 */
export async function sendPaymentReceiptEmailWithRetry(
  customerEmail: string,
  receiptData: PaymentReceiptData,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<{
  success: boolean;
  messageId?: string;
  attempts: number;
  error?: string;
}> {
  let lastError: string | undefined;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendPaymentReceiptEmail(customerEmail, receiptData);

      if (result.success) {
        console.log(`✓ Payment receipt email sent successfully on attempt ${attempt}`);
        return {
          success: true,
          messageId: result.messageId,
          attempts: attempt,
        };
      }

      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
    }

    // Don't retry after last attempt
    if (attempt < maxRetries) {
      console.log(`⚠ Retry attempt ${attempt + 1} in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, 30000); // Exponential backoff, max 30s
    }
  }

  console.error(`✗ Failed to send payment receipt email after ${maxRetries} attempts: ${lastError}`);

  return {
    success: false,
    attempts: maxRetries,
    error: lastError,
  };
}

/**
 * Send payment receipt to both customer and admin
 */
export async function sendPaymentReceiptEmails(
  customerEmail: string,
  receiptData: PaymentReceiptData,
  adminEmail?: string
): Promise<{
  customer: { success: boolean; messageId?: string; error?: string };
  admin?: { success: boolean; messageId?: string; error?: string };
}> {
  // Send to customer
  const customerResult = await sendPaymentReceiptEmailWithRetry(customerEmail, receiptData);

  // Send to admin if provided
  let adminResult;
  if (adminEmail) {
    try {
      const adminReceiptData: PaymentReceiptData = {
        ...receiptData,
        customerEmail: adminEmail,
      };

      adminResult = await sendPaymentReceiptEmailWithRetry(adminEmail, adminReceiptData);
    } catch (error) {
      console.error("Failed to send admin receipt:", error);
      adminResult = {
        success: false,
        attempts: 1,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return {
    customer: {
      success: customerResult.success,
      messageId: customerResult.messageId,
      error: customerResult.error,
    },
    admin: adminResult
      ? {
          success: adminResult.success,
          messageId: adminResult.messageId,
          error: adminResult.error,
        }
      : undefined,
  };
}

/**
 * Verify SMTP configuration
 */
export async function verifyEmailConfiguration(): Promise<{
  configured: boolean;
  error?: string;
}> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("✓ Email configuration verified successfully");
    return { configured: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("✗ Email configuration verification failed:", errorMessage);
    return {
      configured: false,
      error: errorMessage,
    };
  }
}
