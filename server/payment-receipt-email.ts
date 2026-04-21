/**
 * Payment Receipt Email Template
 * Sends detailed invoice and receipt to customers after successful payment
 */

export interface PaymentReceiptData {
  orderId: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  paymentDate: string;
  paymentMethod: "payfast" | "bank_transfer" | "eft";
  amountPaid: number;
  totalOrderAmount: number;
  remainingBalance: number;
  garmentType: string;
  quantity: number;
  color?: string;
  size?: string;
  deliveryMethod: "delivery" | "collection";
  deliveryAddress?: string;
  estimatedDeliveryDate: string;
  printSpecifications?: {
    placement: string;
    size: string;
    colors: number;
  };
  orderNotes?: string;
}

export function generatePaymentReceiptHTML(data: PaymentReceiptData): string {
  const remainingBalanceDisplay = data.remainingBalance > 0 
    ? `<p style="color: #dc2626; font-weight: 600;">Amount Due: R${data.remainingBalance.toFixed(2)}</p>`
    : `<p style="color: #16a34a; font-weight: 600;">✓ Payment Complete</p>`;

  const deliveryInfo = data.deliveryMethod === "delivery"
    ? `<p><strong>Delivery Address:</strong><br/>${data.deliveryAddress || "To be confirmed"}</p>`
    : `<p><strong>Collection Method:</strong><br/>Ready for pickup at Print Cartel office</p>`;

  const printSpecsSection = data.printSpecifications
    ? `
    <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Print Specifications</h3>
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="padding: 5px 0;"><strong>Placement:</strong></td>
          <td style="padding: 5px 0;">${data.printSpecifications.placement}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Print Size:</strong></td>
          <td style="padding: 5px 0;">${data.printSpecifications.size}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Number of Colors:</strong></td>
          <td style="padding: 5px 0;">${data.printSpecifications.colors}</td>
        </tr>
      </table>
    </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - Print Cartel</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
    }
    .payment-status {
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      text-align: center;
    }
    .payment-status.complete {
      background-color: #dcfce7;
      border: 1px solid #86efac;
    }
    .payment-status.partial {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
    }
    .amount-box {
      background-color: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .amount-box .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-box .amount {
      font-size: 24px;
      font-weight: 700;
      color: #0ea5e9;
      margin: 5px 0 0 0;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .invoice-table th {
      background-color: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
    }
    .invoice-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .invoice-table tr:last-child td {
      border-bottom: none;
    }
    .total-row {
      background-color: #f9fafb;
      font-weight: 600;
    }
    .timeline {
      margin: 20px 0;
    }
    .timeline-item {
      display: flex;
      margin-bottom: 15px;
    }
    .timeline-marker {
      width: 30px;
      height: 30px;
      background-color: #0ea5e9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .timeline-content {
      flex: 1;
    }
    .timeline-content h4 {
      margin: 0 0 5px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
    .timeline-content p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #0ea5e9;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>✓ Payment Received</h1>
      <p>Invoice #${data.invoiceNumber}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <p>Hi ${data.customerName},</p>
      <p>Thank you for your payment! We've successfully received your transaction. Your order is now being processed for production.</p>

      <!-- Payment Status -->
      <div class="section">
        <div class="section-title">Payment Status</div>
        <div class="payment-status ${data.remainingBalance > 0 ? 'partial' : 'complete'}">
          ${remainingBalanceDisplay}
        </div>
      </div>

      <!-- Payment Details -->
      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value">${data.paymentMethod === 'payfast' ? 'PayFast' : data.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'EFT'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Paid:</span>
          <span class="info-value">R${data.amountPaid.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Date:</span>
          <span class="info-value">${data.paymentDate}</span>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="section">
        <div class="section-title">Order Summary</div>
        <div class="info-row">
          <span class="info-label">Order ID:</span>
          <span class="info-value">#${data.orderId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Garment:</span>
          <span class="info-value">${data.garmentType}${data.color ? ` (${data.color})` : ''}${data.size ? ` - ${data.size}` : ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Quantity:</span>
          <span class="info-value">${data.quantity} units</span>
        </div>
        <div class="info-row">
          <span class="info-label">Delivery:</span>
          <span class="info-value">${data.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}</span>
        </div>
      </div>

      <!-- Print Specifications (if available) -->
      ${printSpecsSection}

      <!-- Invoice -->
      <div class="section">
        <div class="section-title">Invoice</div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Order Total</td>
              <td style="text-align: right;">R${data.totalOrderAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Amount Paid Today</td>
              <td style="text-align: right;">R${data.amountPaid.toFixed(2)}</td>
            </tr>
            ${data.remainingBalance > 0 ? `
            <tr class="total-row">
              <td>Amount Due</td>
              <td style="text-align: right;">R${data.remainingBalance.toFixed(2)}</td>
            </tr>
            ` : `
            <tr class="total-row" style="background-color: #dcfce7;">
              <td>Status</td>
              <td style="text-align: right; color: #16a34a;">✓ Fully Paid</td>
            </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Delivery Information -->
      <div class="section">
        <div class="section-title">Delivery Information</div>
        ${deliveryInfo}
        <div class="info-row" style="border-bottom: none; margin-top: 10px;">
          <span class="info-label">Estimated Delivery:</span>
          <span class="info-value">${data.estimatedDeliveryDate}</span>
        </div>
      </div>

      <!-- Production Timeline -->
      <div class="section">
        <div class="section-title">Production Timeline</div>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-marker">✓</div>
            <div class="timeline-content">
              <h4>Payment Confirmed</h4>
              <p>Your payment has been processed successfully</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">2</div>
            <div class="timeline-content">
              <h4>Design Review (1-2 days)</h4>
              <p>Our team will review and approve your design</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">3</div>
            <div class="timeline-content">
              <h4>Production (3-5 days)</h4>
              <p>Your garments will be printed and quality checked</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">4</div>
            <div class="timeline-content">
              <h4>Delivery (${data.deliveryMethod === 'delivery' ? '1-2 days' : 'Ready for pickup'})</h4>
              <p>${data.deliveryMethod === 'delivery' ? 'Your order will be delivered to your address' : 'Available for collection at our office'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Next Steps -->
      <div class="section">
        <div class="section-title">What's Next?</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 8px;">Your design will be reviewed by our team within 24 hours</li>
          <li style="margin-bottom: 8px;">We'll send you a notification once production begins</li>
          <li style="margin-bottom: 8px;">You can track your order status in your account dashboard</li>
          <li style="margin-bottom: 8px;">We'll notify you when your order is ready for ${data.deliveryMethod}</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://printcartel.co.za/dashboard?orderId=${data.orderId}" class="button">View Order Status</a>
      </div>

      <!-- Support -->
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #1f2937;">
          <strong>Need help?</strong> If you have any questions about your order, please contact our support team at 
          <a href="mailto:support@printcartel.co.za" style="color: #0ea5e9; text-decoration: none;">support@printcartel.co.za</a> 
          or call <a href="tel:+27123456789" style="color: #0ea5e9; text-decoration: none;">+27 (0)12 345 6789</a>
        </p>
      </div>

      ${data.orderNotes ? `
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-size: 13px; color: #1f2937;">
          <strong>Order Notes:</strong><br/>${data.orderNotes}
        </p>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        © 2026 Print Cartel. All rights reserved.
      </p>
      <p style="margin: 0;">
        This is an automated notification. Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0;">
        <a href="https://printcartel.co.za">Visit our website</a> | 
        <a href="https://printcartel.co.za/dashboard">My Account</a> | 
        <a href="https://printcartel.co.za/contact">Contact Us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of receipt email
 */
export function generatePaymentReceiptText(data: PaymentReceiptData): string {
  return `
PRINT CARTEL - PAYMENT RECEIPT
================================

Invoice #${data.invoiceNumber}
Order #${data.orderId}

Dear ${data.customerName},

Thank you for your payment! We've successfully received your transaction.

PAYMENT DETAILS
===============
Payment Method: ${data.paymentMethod === 'payfast' ? 'PayFast' : data.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'EFT'}
Amount Paid: R${data.amountPaid.toFixed(2)}
Payment Date: ${data.paymentDate}
${data.remainingBalance > 0 ? `Amount Due: R${data.remainingBalance.toFixed(2)}` : 'Status: ✓ Fully Paid'}

ORDER SUMMARY
=============
Garment: ${data.garmentType}${data.color ? ` (${data.color})` : ''}${data.size ? ` - ${data.size}` : ''}
Quantity: ${data.quantity} units
Delivery: ${data.deliveryMethod === 'delivery' ? 'Delivery' : 'Collection'}
Estimated Delivery: ${data.estimatedDeliveryDate}

INVOICE
=======
Order Total: R${data.totalOrderAmount.toFixed(2)}
Amount Paid: R${data.amountPaid.toFixed(2)}
${data.remainingBalance > 0 ? `Amount Due: R${data.remainingBalance.toFixed(2)}` : 'Status: Fully Paid'}

PRODUCTION TIMELINE
===================
1. Payment Confirmed ✓
2. Design Review (1-2 days)
3. Production (3-5 days)
4. Delivery (${data.deliveryMethod === 'delivery' ? '1-2 days' : 'Ready for pickup'})

WHAT'S NEXT?
============
- Your design will be reviewed by our team within 24 hours
- We'll send you a notification once production begins
- You can track your order status in your account dashboard
- We'll notify you when your order is ready for ${data.deliveryMethod}

SUPPORT
=======
If you have any questions, please contact us:
Email: support@printcartel.co.za
Phone: +27 (0)12 345 6789

© 2026 Print Cartel. All rights reserved.
This is an automated notification. Please do not reply to this email.
  `;
}
