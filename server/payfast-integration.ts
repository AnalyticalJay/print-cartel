import crypto from "crypto";

/**
 * PayFast Integration Helper
 * Handles all PayFast payment processing and verification
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
  customerName: string;
  itemName: string;
  itemDescription: string;
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
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_int1: string;
  custom_str1: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
  [key: string]: string;
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
   * Generate MD5 signature for PayFast request
   * IMPORTANT: PayFast requires the query string WITHOUT URL encoding for signature calculation
   */
  private generateSignature(data: Record<string, string>): string {
    // Sort data alphabetically
    const sortedData = Object.keys(data)
      .sort()
      .reduce((acc, key) => {
        if (data[key]) {
          acc[key] = data[key];
        }
        return acc;
      }, {} as Record<string, string>);

    // Create query string WITHOUT URL encoding (PayFast requirement)
    let queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    // Add passphrase (NOT encoded)
    if (this.config.passphrase) {
      queryString += `&passphrase=${this.config.passphrase}`;
    }

    // DEBUG: Log the passphrase being used
    console.log(`[PayFast] Passphrase: ${this.config.passphrase}`);
    console.log(`[PayFast] Query string for signature: ${queryString}`);

    // Generate MD5 hash
    const signature = crypto.createHash("md5").update(queryString).digest("hex");
    console.log(`[PayFast] Generated signature: ${signature}`);
    return signature;
  }

  /**
   * Initiate a payment with PayFast
   */
  async initiatePayment(payment: PaymentData): Promise<PayFastResponse> {
    try {
      const paymentData: Record<string, string> = {
        merchant_id: this.config.merchantId,
        merchant_key: this.config.merchantKey,
        return_url: payment.returnUrl,
        cancel_url: payment.cancelUrl,
        notify_url: payment.notifyUrl,
        name_first: payment.customerName.split(" ")[0],
        name_last: payment.customerName.split(" ").slice(1).join(" ") || "Customer",
        email_address: payment.customerEmail,
        m_payment_id: `order-${payment.orderId}`,
        amount: payment.amount.toFixed(2),
        item_name: payment.itemName,
        item_description: payment.itemDescription,
        custom_int1: payment.orderId.toString(),
        custom_str1: payment.customerEmail,
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);
      paymentData.signature = signature;

      // Build payment URL - IMPORTANT: URLSearchParams encodes the query string,
      // but we need to encode it manually to preserve the exact format PayFast expects
      const queryParts = Object.entries(paymentData)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
      const paymentUrl = `${this.baseUrl}/eng/process?${queryParts}`;

      return {
        success: true,
        paymentUrl,
      };
    } catch (error) {
      console.error("PayFast initiation error:", error);
      return {
        success: false,
        error: "Failed to initiate payment",
      };
    }
  }

  /**
   * Verify PayFast notification signature
   */
  verifyNotificationSignature(notification: PayFastNotification): boolean {
    try {
      // Extract signature from notification
      const receivedSignature = notification.signature;

      // Create copy without signature for verification
      const verificationData: Record<string, string> = {};
      for (const [key, value] of Object.entries(notification)) {
        if (key !== "signature" && value) {
          verificationData[key] = value;
        }
      }

      // Generate expected signature
      const expectedSignature = this.generateSignature(verificationData);

      // Compare signatures
      return receivedSignature === expectedSignature;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify payment status with PayFast
   */
  async verifyPaymentStatus(
    paymentId: string,
    amount: number
  ): Promise<{
    verified: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const verifyData: Record<string, string> = {
        merchant_id: this.config.merchantId,
        merchant_key: this.config.merchantKey,
        return_url: "",
        cancel_url: "",
        notify_url: "",
      };

      // Generate signature for verification
      const signature = this.generateSignature(verifyData);

      // Make verification request to PayFast
      const response = await fetch(
        `${this.baseUrl}/eng/query/paymentid/${paymentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            merchant_id: this.config.merchantId,
            merchant_key: this.config.merchantKey,
            signature: signature,
          },
        }
      );

      if (!response.ok) {
        return {
          verified: false,
          error: "Payment verification failed",
        };
      }

      const data = await response.json();

      return {
        verified: data.status === "COMPLETE",
        status: data.status,
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return {
        verified: false,
        error: "Payment verification error",
      };
    }
  }

  /**
   * Generate payment URL for redirect
   */
  getPaymentUrl(payment: PaymentData): string {
    const paymentData: Record<string, string> = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: payment.returnUrl,
      cancel_url: payment.cancelUrl,
      notify_url: payment.notifyUrl,
      name_first: payment.customerName.split(" ")[0],
      name_last: payment.customerName.split(" ").slice(1).join(" ") || "Customer",
      email_address: payment.customerEmail,
      m_payment_id: `order-${payment.orderId}`,
      amount: payment.amount.toFixed(2),
      item_name: payment.itemName,
      item_description: payment.itemDescription,
      custom_int1: payment.orderId.toString(),
      custom_str1: payment.customerEmail,
    };

    const signature = this.generateSignature(paymentData);
    paymentData.signature = signature;

    // IMPORTANT: Must use manual encoding to match signature calculation
    // URLSearchParams would double-encode and break the signature
    const queryParts = Object.entries(paymentData)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
    return `${this.baseUrl}/eng/process?${queryParts}`;
  }
}

export { PayFastIntegration, PaymentData, PayFastNotification, PayFastConfig };
