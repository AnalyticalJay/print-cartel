# PayFast Integration Setup Guide

This guide explains how to configure PayFast callback notifications (ITN) for Print Cartel.

## Overview

The PayFast integration is now complete with:
- ✅ Payment signature generation and verification
- ✅ PayFast redirect on payment page
- ✅ Callback endpoint at `/api/payfast/callback`
- ✅ Automatic order status updates on successful payment

## Step 1: Register Callback URL in PayFast Merchant Settings

1. **Log in to PayFast Merchant Portal**
   - Go to https://www.payfast.co.za (or sandbox for testing)
   - Log in with your merchant account

2. **Navigate to Settings**
   - Click on "Settings" in the left menu
   - Select "Integration" or "API" section

3. **Register Instant Transaction Notification (ITN) URL**
   - Find the "Instant Transaction Notification (ITN)" section
   - Enter your callback URL:
     ```
     https://printcartel.co.za/api/payfast/callback
     ```
     (or your custom domain if different)

4. **Enable ITN**
   - Make sure ITN is enabled (checkbox should be checked)
   - Save the settings

## Step 2: Test the Integration

### Testing in Sandbox Mode

For development/testing, use the PayFast sandbox:

1. **Update Environment Variables**
   ```
   NODE_ENV=development
   PAYFAST_MERCHANT_ID=10000100
   PAYFAST_MERCHANT_KEY=46f1db3175jeuue8
   PAYFAST_PASSPHRASE=your_passphrase
   ```

2. **Test Payment Flow**
   - Create an order in your application
   - Go to payment page
   - Select "PayFast" payment method
   - Click "Pay with PayFast"
   - You'll be redirected to PayFast sandbox
   - Use test card: 4111 1111 1111 1111 (any future date, any CVC)
   - Complete the payment
   - You'll be redirected back to your site

3. **Verify Callback**
   - Check server logs for callback processing
   - Order status should automatically update to "approved"
   - Check database to confirm order status changed

### Testing in Production

Once you're confident with sandbox testing:

1. **Update Environment Variables**
   ```
   NODE_ENV=production
   PAYFAST_MERCHANT_ID=your_actual_merchant_id
   PAYFAST_MERCHANT_KEY=your_actual_merchant_key
   PAYFAST_PASSPHRASE=your_actual_passphrase
   ```

2. **Register Production Callback URL**
   - Log in to PayFast production portal
   - Register callback URL: `https://printcartel.co.za/api/payfast/callback`

3. **Test with Small Amount**
   - Process a small test payment to verify everything works
   - Confirm order status updates automatically

## Step 3: Callback Verification Details

The callback endpoint (`/api/payfast/callback`) does the following:

1. **Receives Payment Notification**
   - PayFast sends POST request with payment details
   - Includes payment status, amount, order ID, and signature

2. **Verifies Signature**
   - Validates MD5 signature using your passphrase
   - Ensures the notification came from PayFast

3. **Processes Successful Payments**
   - If payment status is "COMPLETE":
     - Updates order status to "approved"
     - Sets order total price from PayFast amount
     - Logs success
   - If payment failed:
     - Logs failure but doesn't update order
     - Customer can retry payment

4. **Returns Verification**
   - Sends "VERIFIED" response to PayFast
   - Confirms notification was received

## Step 4: Monitor Payments

### Check Order Status
- Orders with successful PayFast payments will have status "approved"
- Admin can see payment details in admin dashboard

### Troubleshooting

**Callback not being received:**
- Verify callback URL is correctly registered in PayFast settings
- Check that your domain is publicly accessible
- Ensure firewall isn't blocking PayFast servers

**Signature verification failed:**
- Verify passphrase matches exactly in PayFast settings
- Check that merchant ID and key are correct
- Ensure no extra spaces in environment variables

**Order not updating:**
- Check server logs for errors
- Verify database connection is working
- Ensure order ID format is correct (should be "order_123")

## Step 5: Security Best Practices

1. **Keep Credentials Secure**
   - Never commit `.env` file to version control
   - Use environment variables for all sensitive data
   - Rotate passphrase periodically

2. **Verify Signatures**
   - Always verify PayFast signature before processing
   - Never trust unverified payment notifications

3. **Handle Failures Gracefully**
   - Log all payment attempts
   - Provide clear error messages to customers
   - Allow payment retry with different method

## API Endpoints

### Generate Payment URL
**Endpoint:** `POST /api/trpc/payfast.generatePaymentUrl`

**Request:**
```json
{
  "orderId": 123,
  "amount": 99.99,
  "returnUrl": "https://printcartel.co.za/payment-success?orderId=123",
  "cancelUrl": "https://printcartel.co.za/payment?orderId=123",
  "notifyUrl": "https://printcartel.co.za/api/payfast/callback"
}
```

**Response:**
```json
{
  "paymentUrl": "https://www.payfast.co.za/eng/process?merchant_id=..."
}
```

### Callback Handler
**Endpoint:** `POST /api/payfast/callback`

**Receives:** PayFast ITN notification with payment details

**Returns:** JSON response with success status

## Support

For PayFast support:
- Email: support@payfast.co.za
- Documentation: https://www.payfast.co.za/documentation

For Print Cartel support:
- Check server logs in `.manus-logs/devserver.log`
- Review callback handler in `server/_core/payfast-callback.ts`
