import crypto from "crypto";

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
}

interface PayFastPaymentData {
  orderId: number;
  amount: number;
  customerEmail: string;
  customerName: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

/**
 * Generate PayFast payment signature
 */
export function generatePayFastSignature(
  data: Record<string, string | number>,
  passphrase: string
): string {
  // Convert data to query string format
  let queryString = "";
  Object.keys(data)
    .sort()
    .forEach((key) => {
      if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
        queryString += `${key}=${encodeURIComponent(String(data[key]))}&`;
      }
    });

  // Remove trailing ampersand
  queryString = queryString.slice(0, -1);

  // Add passphrase
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  // Generate MD5 hash
  return crypto.createHash("md5").update(queryString).digest("hex");
}

/**
 * Build PayFast payment redirect URL
 */
export function buildPayFastPaymentUrl(
  config: PayFastConfig,
  paymentData: PayFastPaymentData
): string {
  const baseUrl = config.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

  // Build payment data object
  const data: Record<string, string | number> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: paymentData.returnUrl,
    cancel_url: paymentData.cancelUrl,
    notify_url: paymentData.notifyUrl,
    name_first: paymentData.customerName.split(" ")[0],
    name_last: paymentData.customerName.split(" ").slice(1).join(" ") || "",
    email_address: paymentData.customerEmail,
    m_payment_id: `order_${paymentData.orderId}`,
    amount: paymentData.amount.toFixed(2),
    item_name: paymentData.description,
    item_description: `Order #${paymentData.orderId}`,
  };

  // Generate signature
  const signature = generatePayFastSignature(data, config.passphrase);
  data.signature = signature;

  // Build query string
  const queryString = Object.keys(data)
    .map((key) => `${key}=${encodeURIComponent(String(data[key]))}`)
    .join("&");

  return `${baseUrl}?${queryString}`;
}

/**
 * Verify PayFast callback signature
 */
export function verifyPayFastSignature(
  data: Record<string, string>,
  signature: string,
  passphrase: string
): boolean {
  const calculatedSignature = generatePayFastSignature(data, passphrase);
  return calculatedSignature === signature;
}

/**
 * Parse PayFast callback data
 */
export interface PayFastCallbackData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1: string;
  custom_str2: string;
  custom_str3: string;
  custom_str4: string;
  custom_str5: string;
  custom_int1: string;
  custom_int2: string;
  custom_int3: string;
  custom_int4: string;
  custom_int5: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
}

/**
 * Extract order ID from PayFast callback data
 */
export function extractOrderIdFromPayment(paymentId: string): number | null {
  const match = paymentId.match(/order_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if payment is successful
 */
export function isPaymentSuccessful(status: string): boolean {
  return status === "COMPLETE";
}
