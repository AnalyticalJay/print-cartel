# PayFast Sandbox Testing Guide

This guide walks you through testing the PayFast integration in sandbox mode before going live.

## Prerequisites

- Print Cartel application running locally or deployed
- PayFast sandbox account (free to create at https://sandbox.payfast.co.za)
- Test merchant credentials from PayFast sandbox
- Access to order management dashboard

## Step 1: Set Up PayFast Sandbox Credentials

### Get Sandbox Credentials

1. **Visit PayFast Sandbox**
   - Go to https://sandbox.payfast.co.za
   - Create a free account or log in

2. **Get Merchant Details**
   - Navigate to "Settings" → "Integration"
   - Copy your:
     - Merchant ID (e.g., 10000100)
     - Merchant Key (e.g., 46f1db3175jeuue8)
     - Passphrase (set by you)

3. **Update Environment Variables**
   ```bash
   # In your .env file or Manus secrets:
   PAYFAST_MERCHANT_ID=10000100
   PAYFAST_MERCHANT_KEY=46f1db3175jeuue8
   PAYFAST_PASSPHRASE=your_test_passphrase
   NODE_ENV=development
   ```

### Register Sandbox Callback URL

1. **In PayFast Sandbox Portal**
   - Go to Settings → Integration
   - Find "Instant Transaction Notification (ITN)" section
   - Enter callback URL:
     ```
     https://your-domain/api/payfast/callback
     ```
     For local testing with ngrok:
     ```
     https://your-ngrok-url.ngrok.io/api/payfast/callback
     ```

2. **Enable ITN**
   - Check "Enable ITN"
   - Save settings

## Step 2: Set Up Local Testing Environment

### Option A: Local Testing with ngrok (Recommended)

PayFast needs to send callbacks to a publicly accessible URL. Use ngrok to expose your local server:

1. **Install ngrok**
   ```bash
   # macOS
   brew install ngrok
   
   # Linux
   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip
   unzip ngrok-v3-stable-linux-amd64.zip
   ```

2. **Start ngrok**
   ```bash
   ngrok http 3000
   ```
   This will output something like:
   ```
   Forwarding: https://abc123def456.ngrok.io -> http://localhost:3000
   ```

3. **Update PayFast Callback URL**
   - In PayFast sandbox settings, use:
     ```
     https://abc123def456.ngrok.io/api/payfast/callback
     ```

4. **Start Print Cartel Server**
   ```bash
   cd /home/ubuntu/print-cartel
   pnpm dev
   ```

### Option B: Deployed Testing

If your app is already deployed:

1. **Use Your Production Domain**
   - Callback URL: `https://printcartel.co.za/api/payfast/callback`
   - Or: `https://printcartel-kdhkmkqx.manus.space/api/payfast/callback`

2. **Register in PayFast Sandbox**
   - Use the same callback URL in sandbox settings

## Step 3: Create a Test Order

1. **Log in to Print Cartel**
   - Visit https://your-domain (or localhost:3000)
   - Create a customer account

2. **Create an Order**
   - Click "Order Now"
   - Design a test print (any design)
   - Select quantity and options
   - Proceed to checkout
   - Complete order creation

3. **Note the Order ID**
   - You'll need this for verification later
   - Format: `order_123` (shown in order details)

## Step 4: Test Payment Flow

### Step 4a: Navigate to Payment Page

1. **Go to Payment**
   - From your account dashboard, find the order
   - Click "Pay Now" or "Complete Payment"
   - You should see payment options

2. **Select PayFast**
   - Choose "PayFast" payment method
   - Review the amount
   - Click "Pay with PayFast"

### Step 4b: Complete Sandbox Payment

1. **You'll be redirected to PayFast**
   - PayFast sandbox payment page loads
   - Shows your order details and amount

2. **Enter Test Card Details**
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Any name

3. **Complete Payment**
   - Click "Pay Now"
   - You should see a success message
   - You'll be redirected back to your site

### Step 4c: Verify Payment Success Page

1. **Check Confirmation Page**
   - You should see "Payment Successful" message
   - Order details should be displayed
   - Amount should match

2. **Check Order Status**
   - Go back to your account dashboard
   - Find the order
   - Status should show "approved" or "paid"

## Step 5: Verify Callback Processing

### Check Server Logs

1. **Monitor Dev Server Output**
   ```bash
   # In your terminal running the dev server, look for:
   # [PayFast] Callback received for order_123
   # [PayFast] Payment verified successfully
   # [PayFast] Order status updated to approved
   ```

2. **Check Application Logs**
   - Look in `.manus-logs/devserver.log`
   - Search for "PayFast" or "callback"

### Check Database

1. **Verify Order Status Changed**
   - Log in to admin dashboard
   - Go to Orders section
   - Find your test order
   - Confirm status is "approved"

2. **Check Payment Records**
   - Admin dashboard → Payments section
   - Should see payment record with:
     - PayFast transaction ID
     - Amount
     - Status: "COMPLETE"
     - Timestamp

## Step 6: Test Error Scenarios

### Test Failed Payment

1. **Use Invalid Card**
   - Go through payment flow again
   - Use card: `4000 0000 0000 0002` (fails in sandbox)
   - Payment should be declined
   - Order status should remain "pending"

2. **Verify Error Handling**
   - You should see error message
   - Option to retry payment
   - Order should NOT be marked as approved

### Test Payment Cancellation

1. **Cancel During Payment**
   - Start payment flow
   - On PayFast page, click "Cancel"
   - Should return to payment page
   - Order status should remain "pending"

## Step 7: Troubleshooting

### Callback Not Being Received

**Problem:** PayFast payment succeeds but order status doesn't update

**Solutions:**
1. **Check Callback URL Registration**
   - Verify URL is correctly registered in PayFast sandbox
   - Use ngrok URL if testing locally
   - Test URL is publicly accessible

2. **Check Server Logs**
   - Look for callback processing errors
   - Verify no firewall blocking PayFast servers

3. **Test Callback Manually**
   ```bash
   # Send test callback to your endpoint
   curl -X POST http://localhost:3000/api/payfast/callback \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "m_payment_id=order_123&pf_payment_id=1234567890&payment_status=COMPLETE&amount_gross=99.99&signature=..."
   ```

### Signature Verification Failed

**Problem:** Callback received but signature doesn't match

**Solutions:**
1. **Verify Passphrase**
   - Check passphrase matches exactly in PayFast settings
   - No extra spaces or characters
   - Case-sensitive

2. **Check Merchant Credentials**
   - Verify merchant ID and key are correct
   - Use sandbox credentials for sandbox testing

### Order Status Not Updating

**Problem:** Callback processed but order status unchanged

**Solutions:**
1. **Check Order Exists**
   - Verify order ID format: `order_123`
   - Confirm order exists in database

2. **Check Database Connection**
   - Verify database is accessible
   - Check for connection errors in logs

3. **Check Order Status Field**
   - Verify order has `status` field
   - Confirm status can be updated

## Step 8: Production Readiness Checklist

Before going live with PayFast:

- [ ] Tested payment flow in sandbox successfully
- [ ] Callback URL registered in PayFast sandbox
- [ ] Order status updates automatically on successful payment
- [ ] Error handling works for failed payments
- [ ] Payment records are stored correctly
- [ ] Confirmation emails sent to customers
- [ ] Admin can see payment details
- [ ] Passphrase is secure and not shared
- [ ] Merchant ID and key are correct
- [ ] Production callback URL registered in PayFast

## Switching to Production

Once sandbox testing is complete:

1. **Get Production Credentials**
   - Log in to https://www.payfast.co.za (production)
   - Get merchant ID, key, and set passphrase

2. **Update Environment Variables**
   ```bash
   PAYFAST_MERCHANT_ID=your_production_merchant_id
   PAYFAST_MERCHANT_KEY=your_production_merchant_key
   PAYFAST_PASSPHRASE=your_production_passphrase
   NODE_ENV=production
   ```

3. **Register Production Callback**
   - In PayFast production settings
   - Register: `https://printcartel.co.za/api/payfast/callback`

4. **Deploy to Production**
   - Push changes to production
   - Verify deployment successful
   - Test with small payment

## Support

For PayFast support:
- Email: support@payfast.co.za
- Sandbox: https://sandbox.payfast.co.za
- Production: https://www.payfast.co.za

For Print Cartel support:
- Check logs in `.manus-logs/`
- Review PayFast service in `server/payfast-service.ts`
- Check callback handler in `server/_core/payfast-callback.ts`
