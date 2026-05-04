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
  customerFirstName: string;
  customerLastName: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

/**
 * PHP-style urlencode: spaces become +, other special chars become %XX.
 * PayFast's server-side recomputation uses PHP urlencode, so we must match it.
 */
function phpUrlencode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

/**
 * Generate PayFast payment signature.
 *
 * CRITICAL: Parameters must be in INSERTION ORDER (NOT alphabetical).
 * Values must be PHP-style URL-encoded (spaces as +) to match PayFast's recomputation.
 * Empty/null/undefined values are excluded. Passphrase is appended last.
 */
export function generatePayFastSignature(
  data: Record<string, string>,
  passphrase: string
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== "" && value !== null && value !== undefined) {
      parts.push(`${key}=${phpUrlencode(value)}`);
    }
  }

  let queryString = parts.join("&");

  if (passphrase) {
    queryString += `&passphrase=${phpUrlencode(passphrase)}`;
  }

  console.log(`[PayFast] Signature input: ${queryString}`);
  const signature = crypto.createHash("md5").update(queryString).digest("hex");
  console.log(`[PayFast] Signature: ${signature}`);
  return signature;
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

  // Build ordered data - ORDER MATTERS for PayFast signature
  const data: Record<string, string> = {};
  data["merchant_id"] = config.merchantId;
  data["merchant_key"] = config.merchantKey;
  data["return_url"] = paymentData.returnUrl;
  data["cancel_url"] = paymentData.cancelUrl;
  data["notify_url"] = paymentData.notifyUrl;
  data["name_first"] = paymentData.customerFirstName;
  data["name_last"] = paymentData.customerLastName;
  data["email_address"] = paymentData.customerEmail;
  data["m_payment_id"] = `order-${paymentData.orderId}`;
  data["amount"] = paymentData.amount.toFixed(2);
  data["item_name"] = `Invoice for Order #${paymentData.orderId}`;
  data["item_description"] = "Payment for DTF printing order";
  data["custom_int1"] = paymentData.orderId.toString();
  data["custom_str1"] = paymentData.customerEmail;

  // Generate signature BEFORE adding currency (currency is not signed per PayFast spec)
  const signature = generatePayFastSignature(data, config.passphrase);
  data["signature"] = signature;

  // Build URL with URL-encoded values
  const queryString = Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const url = `${baseUrl}?${queryString}`;
  console.log(`[PayFast] Payment URL generated for order ${paymentData.orderId}`);
  return url;
}

/**
 * Verify PayFast ITN signature.
 * data should be the notification fields WITHOUT the signature field, in original order.
 */
export function verifyPayFastSignature(
  data: Record<string, string>,
  signature: string,
  passphrase: string
): boolean {
  const calculatedSignature = generatePayFastSignature(data, passphrase);
  const isValid = calculatedSignature === signature;
  if (!isValid) {
    console.error(`[PayFast] Signature mismatch. Expected: ${calculatedSignature}, Got: ${signature}`);
  }
  return isValid;
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
 * Extract order ID from PayFast callback data.
 * Supports both "order-123" and "order_123" formats.
 */
export function extractOrderIdFromPayment(paymentId: string): number | null {
  const match = paymentId.match(/order[-_](\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if payment is successful
 */
export function isPaymentSuccessful(status: string): boolean {
  return status === "COMPLETE";
}
