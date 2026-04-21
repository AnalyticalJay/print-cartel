# Payment Receipt Email System

## Overview

The Payment Receipt Email System automatically sends customers detailed payment confirmations and invoices after successful PayFast transactions. The system includes professional HTML and plain text email templates, automatic retry logic for failed deliveries, and comprehensive error handling.

## Components

### 1. Email Template (`server/payment-receipt-email.ts`)

Generates professional payment receipt emails with:

- **Payment Confirmation**: Clear indication of successful payment
- **Invoice Details**: Order total, amount paid, remaining balance
- **Order Summary**: Garment type, quantity, color, size, delivery method
- **Print Specifications**: Placement, size, number of colors (if applicable)
- **Production Timeline**: 4-step timeline showing what happens next
- **Delivery Information**: Address or collection details with estimated delivery date
- **Support Contact**: Email and phone number for customer support
- **Responsive Design**: Works on all devices and email clients

#### Key Features:
- HTML and plain text versions
- Supports partial and full payments
- Handles optional fields gracefully
- Professional styling with CSS
- Clickable "View Order Status" button
- Support for order notes

### 2. Email Sending Service (`server/send-payment-receipt.ts`)

Handles email delivery with:

- **SMTP Integration**: Configurable SMTP server settings
- **Automatic Retry**: Built-in retry logic with exponential backoff
- **Error Handling**: Comprehensive error reporting and logging
- **Configuration Verification**: Validates SMTP settings before sending

#### Key Functions:
```typescript
// Send single email
sendPaymentReceiptEmail(customerEmail, receiptData)

// Send with automatic retries (3 attempts by default)
sendPaymentReceiptEmailWithRetry(customerEmail, receiptData, maxRetries, initialDelayMs)

// Send to both customer and admin
sendPaymentReceiptEmails(customerEmail, receiptData, adminEmail)

// Verify SMTP configuration
verifyEmailConfiguration()
```

### 3. Email Retry Queue (`server/email-retry-queue.ts`)

Manages failed email delivery attempts:

- **In-Memory Queue**: Stores pending emails for retry
- **Exponential Backoff**: Retry delays increase exponentially (1m, 2m, 4m, 8m, max 24h)
- **Status Tracking**: Tracks sent, failed, and pending emails
- **Cleanup**: Removes old completed emails from queue
- **Statistics**: Provides queue health metrics

#### Key Functions:
```typescript
// Add email to retry queue
addToEmailQueue(emailItem)

// Get pending emails ready for retry
getPendingEmails()

// Update email status
updateEmailQueueStatus(id, status, error, nextRetryTime)

// Process all pending emails
processEmailRetryQueue()

// Get queue statistics
getEmailQueueStats()

// Clean up old emails
cleanupEmailQueue(daysOld)
```

### 4. Integration (`server/routers/payment.ts`)

Automatically sends payment receipts when PayFast payment is verified:

```typescript
// After payment verification
await sendPaymentReceiptEmailWithRetry(
  order.customerEmail,
  {
    orderId,
    invoiceNumber: `INV-${orderId}`,
    customerName: `${order.customerFirstName} ${order.customerLastName}`,
    customerEmail: order.customerEmail,
    paymentDate: new Date().toLocaleDateString("en-ZA", {...}),
    paymentMethod: "payfast",
    amountPaid: paidAmount,
    totalOrderAmount: totalAmount,
    remainingBalance: Math.max(0, totalAmount - paidAmount),
    garmentType: "Custom Apparel",
    quantity: order.quantity || 1,
    deliveryMethod: order.deliveryMethod || "delivery",
    deliveryAddress: order.deliveryAddress,
    estimatedDeliveryDate: estimatedDeliveryDate.toLocaleDateString("en-ZA", {...}),
  }
);
```

## Configuration

### Required Environment Variables

```bash
SMTP_HOST=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com    # SMTP username
SMTP_PASS=your-app-password       # SMTP password (use app-specific password for Gmail)
SMTP_FROM_EMAIL=noreply@printcartel.co.za  # From email address
```

### Gmail Configuration Example

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password as `SMTP_PASS`

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # 16-character app password
SMTP_FROM_EMAIL=your-email@gmail.com
```

## Email Template Data Structure

```typescript
interface PaymentReceiptData {
  orderId: number;                    // Order ID
  invoiceNumber: string;              // Invoice number (e.g., "INV-12345")
  customerName: string;               // Customer full name
  customerEmail: string;              // Customer email address
  paymentDate: string;                // Payment date (formatted)
  paymentMethod: "payfast" | "bank_transfer" | "eft";  // Payment method
  amountPaid: number;                 // Amount paid in ZAR
  totalOrderAmount: number;           // Total order amount in ZAR
  remainingBalance: number;           // Remaining balance in ZAR
  garmentType: string;                // Type of garment (e.g., "T-Shirt")
  quantity: number;                   // Quantity ordered
  color?: string;                     // Garment color (optional)
  size?: string;                      // Garment size (optional)
  deliveryMethod: "delivery" | "collection";  // Delivery or collection
  deliveryAddress?: string;           // Delivery address (optional)
  estimatedDeliveryDate: string;      // Estimated delivery date (formatted)
  printSpecifications?: {             // Print specifications (optional)
    placement: string;                // Print placement
    size: string;                     // Print size
    colors: number;                   // Number of colors
  };
  orderNotes?: string;                // Additional order notes (optional)
}
```

## Retry Logic

The system implements exponential backoff retry logic:

| Attempt | Delay | Total Wait |
|---------|-------|-----------|
| 1 | Immediate | 0 min |
| 2 | 1 minute | 1 min |
| 3 | 2 minutes | 3 min |
| 4 | 4 minutes | 7 min |
| 5 | 8 minutes | 15 min |
| 6 | 16 minutes | 31 min |
| 7 | 32 minutes | 63 min |
| 8+ | 24 hours (max) | 24+ hours |

## Testing

Run the comprehensive test suite:

```bash
pnpm test server/payment-receipt.test.ts
```

Test coverage includes:
- ✓ HTML email template generation
- ✓ Plain text email template generation
- ✓ Payment detail formatting
- ✓ Order summary rendering
- ✓ Invoice generation
- ✓ Delivery information display
- ✓ Print specifications handling
- ✓ Production timeline display
- ✓ Email queue management
- ✓ Retry logic
- ✓ Status tracking
- ✓ Multiple payment methods
- ✓ Different delivery methods
- ✓ Responsive email design

## Usage Examples

### Send Payment Receipt

```typescript
import { sendPaymentReceiptEmailWithRetry } from "./send-payment-receipt";

const result = await sendPaymentReceiptEmailWithRetry(
  "customer@example.com",
  {
    orderId: 12345,
    invoiceNumber: "INV-12345",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    paymentDate: "21 April 2026, 10:30",
    paymentMethod: "payfast",
    amountPaid: 500.0,
    totalOrderAmount: 1000.0,
    remainingBalance: 500.0,
    garmentType: "T-Shirt",
    quantity: 50,
    color: "Black",
    size: "Medium",
    deliveryMethod: "delivery",
    deliveryAddress: "123 Main Street, Johannesburg",
    estimatedDeliveryDate: "28 April 2026",
  }
);

if (result.success) {
  console.log(`Email sent successfully (Attempts: ${result.attempts})`);
} else {
  console.error(`Failed to send email: ${result.error}`);
}
```

### Process Email Retry Queue

```typescript
import { processEmailRetryQueue, getEmailQueueStats } from "./email-retry-queue";

// Process all pending emails
const result = await processEmailRetryQueue();
console.log(`Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`);

// Get queue statistics
const stats = getEmailQueueStats();
console.log(`Queue stats:`, stats);
// Output: { total: 5, pending: 2, sent: 3, failed: 0, avgRetries: 1.2 }
```

### Verify Email Configuration

```typescript
import { verifyEmailConfiguration } from "./send-payment-receipt";

const verification = await verifyEmailConfiguration();
if (verification.configured) {
  console.log("✓ Email configuration is valid");
} else {
  console.error(`✗ Email configuration error: ${verification.error}`);
}
```

## Monitoring

### Check Email Queue Health

```typescript
import { getEmailQueueStats } from "./email-retry-queue";

const stats = getEmailQueueStats();

if (stats.pending > 10) {
  console.warn("⚠ High number of pending emails in queue");
}

if (stats.failed > 5) {
  console.error("✗ Multiple email delivery failures detected");
}

console.log(`Email Queue Status:
  Total: ${stats.total}
  Pending: ${stats.pending}
  Sent: ${stats.sent}
  Failed: ${stats.failed}
  Avg Retries: ${stats.avgRetries}
`);
```

### Cleanup Old Emails

```typescript
import { cleanupEmailQueue } from "./email-retry-queue";

// Clean up emails older than 30 days
const cleaned = cleanupEmailQueue(30);
console.log(`Cleaned up ${cleaned} old emails`);

// Clean up all completed emails
const allCleaned = cleanupEmailQueue(-1);
console.log(`Cleaned up ${allCleaned} completed emails`);
```

## Email Template Features

### Professional Design
- Gradient header with Print Cartel branding
- Responsive layout that works on all devices
- Clear visual hierarchy with sections
- Color-coded status indicators (green for complete, amber for partial)

### Content Sections
1. **Payment Status** - Clear indication of payment completion
2. **Payment Details** - Method, amount, date
3. **Order Summary** - Garment type, quantity, delivery method
4. **Invoice** - Itemized breakdown with totals
5. **Delivery Information** - Address or collection details
6. **Print Specifications** - Technical details if applicable
7. **Production Timeline** - 4-step process with estimated times
8. **Next Steps** - What to expect
9. **Support Information** - Contact details

### Accessibility
- Semantic HTML structure
- Proper color contrast
- Alt text for images
- Readable font sizes
- Mobile-responsive design

## Troubleshooting

### Email Not Sending

1. **Check SMTP Configuration**
   ```typescript
   import { verifyEmailConfiguration } from "./send-payment-receipt";
   const result = await verifyEmailConfiguration();
   ```

2. **Check Environment Variables**
   - Ensure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL` are set
   - For Gmail, use app-specific password, not account password

3. **Check Email Queue**
   ```typescript
   import { getPendingEmails, getEmailQueueStats } from "./email-retry-queue";
   const pending = getPendingEmails();
   const stats = getEmailQueueStats();
   ```

### High Failure Rate

1. **Check SMTP Server Status**
   - Verify SMTP server is accessible
   - Check firewall/network rules

2. **Check Email Addresses**
   - Ensure email addresses are valid
   - Check for typos in recipient addresses

3. **Check Rate Limits**
   - Some SMTP providers have rate limits
   - Consider implementing throttling

### Queue Growing Too Large

1. **Process Pending Emails**
   ```typescript
   import { processEmailRetryQueue } from "./email-retry-queue";
   await processEmailRetryQueue();
   ```

2. **Cleanup Old Emails**
   ```typescript
   import { cleanupEmailQueue } from "./email-retry-queue";
   cleanupEmailQueue(30); // Clean up emails older than 30 days
   ```

## Future Enhancements

- [ ] Database persistence for email queue (for production)
- [ ] Email template customization via admin panel
- [ ] Webhook integration for email delivery tracking
- [ ] A/B testing for email subject lines
- [ ] Scheduled email processing (e.g., batch processing at off-peak hours)
- [ ] Email analytics (open rates, click tracking)
- [ ] Multi-language email templates
- [ ] SMS notification option as fallback
- [ ] Email preview in customer dashboard
- [ ] Resend receipt email from customer dashboard

## Security Considerations

- **SMTP Credentials**: Store in environment variables, never commit to version control
- **Email Content**: Sanitize any user-provided data before including in emails
- **Rate Limiting**: Implement rate limiting to prevent email flooding
- **Authentication**: Verify payment before sending receipt
- **Encryption**: Use TLS for SMTP connections (port 587 or 465)
- **Privacy**: Follow GDPR/POPIA requirements for customer data

## Performance Notes

- Email sending is non-blocking (async)
- Retry queue is in-memory (suitable for single-server deployments)
- For high-volume deployments, consider:
  - Database persistence for queue
  - Message queue (e.g., RabbitMQ, Redis)
  - Email service provider (e.g., SendGrid, Mailgun)
  - Batch processing for efficiency
