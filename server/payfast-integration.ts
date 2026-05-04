import crypto from "crypto";

/**
 * PayFast Integration Helper
 *
 * Signature generation follows PayFast's official documentation:
 * https://developers.payfast.co.za/docs#step_1_form_fields
 *
 * Key rules:
 * 1. Parameters must be in the EXACT ORDER they are defined (NOT alphabetical)
 * 2. Signature is calculated on the URL-decoded values (raw values, not encoded)
 * 3. Passphrase is appended at the END of the query string before hashing
 * 4. Empty/null values must be excluded from the signature
 * 5. The final URL uses URL-encoded values
 */

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  isSandbox: boolean;
}

interface PaymentData {
  orderId: number;
  amount: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  itemName: string;
  itemDescription?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

interface PayFastResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_int1?: string;
  custom_str1?: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
  [key: string]: string | undefined;
}

class PayFastIntegration {
  private config: PayFastConfig;
  private baseUrl: string;

  constructor(config: PayFastConfig) {
    this.config = config;
    this.baseUrl = config.isSandbox
      ? "https://sandbox.payfast.co.za"
      : "https://www.payfast.co.za";
  }

  /**
   * Generate MD5 signature for PayFast.
   *
   * Per PayFast docs: build a query string of key=value pairs in the SAME ORDER
   * as the form fields, skip empty values, then append &passphrase=... and MD5 hash.
   *
   * IMPORTANT: Values must NOT be URL-encoded when building the signature string.
   */
  private generateSignature(data: Record<string, string>): string {
    // Build query string from data as-is (preserve insertion order, skip empty values)
    const queryParts: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParts.push(`${key}=${value}`);
      }
    }

    let queryString = queryParts.join("&");

    // Append passphrase if set
    if (this.config.passphrase) {
      queryString += `&passphrase=${this.config.passphrase}`;
    }

    console.log(`[PayFast] Signature input: ${queryString}`);

    const signature = crypto.createHash("md5").update(queryString).digest("hex");
    console.log(`[PayFast] Generated signature: ${signature}`);
    return signature;
  }

  /**
   * Build the ordered payment data object.
   * Order MUST match PayFast's expected field order exactly.
   */
  private buildPaymentData(payment: PaymentData): Record<string, string> {
    // PayFast required field order (per official docs)
    const data: Record<string, string> = {};

    // Merchant details
    data["merchant_id"] = this.config.merchantId;
    data["merchant_key"] = this.config.merchantKey;

    // Return URLs
    data["return_url"] = payment.returnUrl;
    data["cancel_url"] = payment.cancelUrl;
    data["notify_url"] = payment.notifyUrl;

    // Buyer details
    data["name_first"] = payment.customerFirstName;
    data["name_last"] = payment.customerLastName;
    data["email_address"] = payment.customerEmail;

    // Transaction details
    data["m_payment_id"] = `order-${payment.orderId}`;
    data["amount"] = payment.amount.toFixed(2);
    data["item_name"] = payment.itemName;
    if (payment.itemDescription) {
      data["item_description"] = payment.itemDescription;
    }

    // Custom fields
    data["custom_int1"] = payment.orderId.toString();
    data["custom_str1"] = payment.customerEmail;

    return data;
  }

  /**
   * Generate the full PayFast payment redirect URL.
   */
  getPaymentUrl(payment: PaymentData): string {
    const paymentData = this.buildPaymentData(payment);

    // Generate signature using raw (non-encoded) values
    const signature = this.generateSignature(paymentData);

    // Add signature to data
    paymentData["signature"] = signature;

    // Build URL with URL-encoded values
    const queryString = Object.entries(paymentData)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    const url = `${this.baseUrl}/eng/process?${queryString}`;
    console.log(`[PayFast] Payment URL: ${url}`);
    return url;
  }

  /**
   * Initiate a payment with PayFast (alias for getPaymentUrl)
   */
  async initiatePayment(payment: PaymentData): Promise<PayFastResponse> {
    try {
      const paymentUrl = this.getPaymentUrl(payment);
      return { success: true, paymentUrl };
    } catch (error) {
      console.error("PayFast initiation error:", error);
      return { success: false, error: "Failed to initiate payment" };
    }
  }

  /**
   * Verify PayFast ITN (Instant Transaction Notification) signature.
   * Excludes the 'signature' field itself when recalculating.
   */
  verifyNotificationSignature(notification: PayFastNotification): boolean {
    try {
      const receivedSignature = notification.signature;

      // Rebuild data without signature field, preserving original order
      const verificationData: Record<string, string> = {};
      for (const [key, value] of Object.entries(notification)) {
        if (key !== "signature" && value !== undefined && value !== null && value !== "") {
          verificationData[key] = value;
        }
      }

      const expectedSignature = this.generateSignature(verificationData);
      const isValid = receivedSignature === expectedSignature;

      if (!isValid) {
        console.error(`[PayFast] Signature mismatch. Expected: ${expectedSignature}, Got: ${receivedSignature}`);
      }

      return isValid;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }
}

export { PayFastIntegration, PaymentData, PayFastNotification, PayFastConfig };
