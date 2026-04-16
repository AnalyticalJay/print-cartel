# PayFast Integration Testing Checklist

Complete this checklist to ensure PayFast integration is working correctly before going live.

## Pre-Testing Setup

- [ ] PayFast sandbox account created at https://sandbox.payfast.co.za
- [ ] Sandbox merchant credentials obtained:
  - [ ] Merchant ID: _______________
  - [ ] Merchant Key: _______________
  - [ ] Passphrase: _______________
- [ ] Environment variables configured:
  - [ ] PAYFAST_MERCHANT_ID set
  - [ ] PAYFAST_MERCHANT_KEY set
  - [ ] PAYFAST_PASSPHRASE set
  - [ ] NODE_ENV=development
- [ ] Callback URL registered in PayFast sandbox settings
- [ ] ngrok installed (for local testing) or app deployed
- [ ] Print Cartel server running

## Endpoint Verification

- [ ] Callback endpoint is accessible at `/api/payfast/callback`
- [ ] Test script runs without errors:
  ```bash
  ./test-payfast-callback.sh
  ```
- [ ] Server logs show callback processing messages
- [ ] No firewall blocking PayFast servers

## Payment Flow Testing

### Create Test Order

- [ ] Log in to Print Cartel as customer
- [ ] Create new order:
  - [ ] Design selected
  - [ ] Quantity chosen
  - [ ] Options configured
  - [ ] Order total calculated correctly
- [ ] Note order ID: _______________
- [ ] Order status shows "pending"

### Test PayFast Payment

- [ ] Navigate to payment page
- [ ] PayFast option visible and selectable
- [ ] Click "Pay with PayFast"
- [ ] Redirected to PayFast sandbox
- [ ] Order details displayed correctly on PayFast page
- [ ] Amount matches order total

### Complete Sandbox Payment

- [ ] Use test card: 4111 1111 1111 1111
- [ ] Enter any future expiry date
- [ ] Enter any 3-digit CVC
- [ ] Enter any cardholder name
- [ ] Click "Pay Now"
- [ ] Payment processed successfully
- [ ] Redirected back to Print Cartel

### Verify Payment Success

- [ ] Success page displays:
  - [ ] "Payment Successful" message
  - [ ] Order ID
  - [ ] Amount paid
  - [ ] Payment method (PayFast)
  - [ ] Next steps/instructions
- [ ] No error messages shown

## Callback Verification

### Check Server Logs

- [ ] Callback received message in logs
- [ ] Signature verification successful
- [ ] Order status update message
- [ ] No error messages

### Verify Order Status Updated

- [ ] Go to account dashboard
- [ ] Find test order
- [ ] Order status changed to "approved" or "paid"
- [ ] Payment details visible:
  - [ ] PayFast transaction ID
  - [ ] Payment date/time
  - [ ] Amount
  - [ ] Status: COMPLETE

### Check Database

- [ ] Order record updated:
  ```sql
  SELECT id, status, totalPrice FROM orders WHERE id = ?;
  ```
  - [ ] Status = "approved"
  - [ ] totalPrice set correctly

- [ ] Payment record created:
  ```sql
  SELECT * FROM paymentRecords WHERE orderId = ?;
  ```
  - [ ] paymentMethod = "payfast"
  - [ ] amount = correct amount
  - [ ] status = "COMPLETE"
  - [ ] transactionId populated

## Error Handling Testing

### Test Failed Payment

- [ ] Create another test order
- [ ] Go to payment page
- [ ] Select PayFast
- [ ] Use declined test card: 4000 0000 0000 0002
- [ ] Payment declined with error message
- [ ] Returned to payment page
- [ ] Order status remains "pending"
- [ ] No payment record created

### Test Payment Cancellation

- [ ] Create another test order
- [ ] Go to payment page
- [ ] Select PayFast
- [ ] On PayFast page, click "Cancel"
- [ ] Returned to payment page
- [ ] Order status remains "pending"
- [ ] Can retry payment

### Test Invalid Signature

- [ ] Run test script with wrong passphrase:
  ```bash
  ./test-payfast-callback.sh http://localhost:3000/api/payfast/callback 10000100 46f1db3175jeuue8 wrong_passphrase
  ```
- [ ] Callback rejected with error
- [ ] Order status NOT updated
- [ ] Error logged

## Email Notifications

- [ ] Payment confirmation email received:
  - [ ] Contains order details
  - [ ] Shows payment method
  - [ ] Shows amount paid
  - [ ] Includes receipt
  - [ ] Contains next steps

- [ ] Admin notification received (if configured):
  - [ ] Payment notification sent to admin
  - [ ] Contains order and payment details

## Admin Dashboard

- [ ] Admin can see test order:
  - [ ] In Orders section
  - [ ] Status shows "approved"
  - [ ] Total price correct

- [ ] Admin can see payment:
  - [ ] In Payments section
  - [ ] Status shows "COMPLETE"
  - [ ] PayFast transaction ID visible
  - [ ] Amount correct

- [ ] Admin can verify payment:
  - [ ] Can view payment details
  - [ ] Can see proof/receipt
  - [ ] Can add notes if needed

## Security Checks

- [ ] Signature verification working:
  - [ ] Valid signatures accepted
  - [ ] Invalid signatures rejected
  - [ ] Modified data rejected

- [ ] Credentials secure:
  - [ ] Passphrase not logged
  - [ ] Merchant key not exposed
  - [ ] No credentials in client code

- [ ] Payment data secure:
  - [ ] Amount verified before processing
  - [ ] Order ID validated
  - [ ] Duplicate payments prevented

## Performance Testing

- [ ] Payment processing completes in < 5 seconds
- [ ] Callback processed within 30 seconds
- [ ] No database locks or timeouts
- [ ] Server handles multiple concurrent payments

## Production Readiness

Before switching to production:

- [ ] All tests above passed
- [ ] Production PayFast credentials obtained
- [ ] Production callback URL registered in PayFast
- [ ] Environment variables updated for production
- [ ] Backup and recovery plan in place
- [ ] Support contact information available
- [ ] Monitoring/alerting configured
- [ ] Test payment processed in production

## Sign-Off

- [ ] Tested by: _______________
- [ ] Date: _______________
- [ ] Issues found: _______________
- [ ] Ready for production: [ ] Yes [ ] No

## Troubleshooting Reference

If any test fails, refer to:

1. **PAYFAST_SETUP.md** - Setup and configuration guide
2. **PAYFAST_SANDBOX_TESTING.md** - Detailed testing guide
3. **Server logs** - Check `.manus-logs/devserver.log`
4. **PayFast documentation** - https://www.payfast.co.za/documentation

## Quick Reference

### Test Credentials (Sandbox)
- Merchant ID: 10000100
- Merchant Key: 46f1db3175jeuue8
- Passphrase: (set by you)

### Test Cards (Sandbox)
- Success: 4111 1111 1111 1111
- Declined: 4000 0000 0000 0002

### Useful Commands

```bash
# Check if callback endpoint is accessible
curl -X POST http://localhost:3000/api/payfast/callback

# Run callback tests
./test-payfast-callback.sh

# Check server logs
tail -f .manus-logs/devserver.log | grep -i payfast

# View recent orders
# (via admin dashboard or database query)
```

## Support Contacts

- **PayFast Support:** support@payfast.co.za
- **PayFast Documentation:** https://www.payfast.co.za/documentation
- **Print Cartel Issues:** Check server logs and documentation
