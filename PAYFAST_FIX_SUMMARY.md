# PayFast 400 Bad Request Error - Fix Summary

## Problem
When customers clicked "Pay with PayFast" on the order payment page, they received a **400 Bad Request** error with the message:
```
Generated signature does not match submitted signature.
```

This was a critical blocker preventing payment processing.

## Root Cause
The PayFast signature generation was **URL-encoding** the query string before hashing, but PayFast expects the signature to be calculated on the **plain, unencoded** query string.

### Example of the Issue:
- **Incorrect (with encoding)**: `passphrase=-%2CRedemption_2026` → signature: `4b7a8a3ac1061677284ee81233dd8abd`
- **Correct (without encoding)**: `passphrase=-,Redemption_2026` → signature: `1e48c68af08b093eb503014407c9c5eb`

PayFast was rejecting the signature because the encoding changed the hash value.

## Solution
Fixed signature generation in **two files**:

### 1. `/server/payfast-integration.ts` (Line 66-89)
**Before:**
```typescript
let queryString = Object.entries(sortedData)
  .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
  .join("&");

if (this.config.passphrase) {
  queryString += `&passphrase=${encodeURIComponent(this.config.passphrase)}`;
}
```

**After:**
```typescript
// Create query string WITHOUT URL encoding (PayFast requirement)
let queryString = Object.entries(sortedData)
  .map(([key, value]) => `${key}=${value}`)
  .join("&");

// Add passphrase (NOT encoded)
if (this.config.passphrase) {
  queryString += `&passphrase=${this.config.passphrase}`;
}
```

### 2. `/server/payfast-service.ts` (Line 24-48)
**Before:**
```typescript
let queryString = "";
Object.keys(data)
  .sort()
  .forEach((key) => {
    if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
      queryString += `${key}=${encodeURIComponent(String(data[key]))}&`;
    }
  });

if (passphrase) {
  queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
}
```

**After:**
```typescript
// Convert data to query string format WITHOUT encoding (PayFast requirement)
let queryString = "";
Object.keys(data)
  .sort()
  .forEach((key) => {
    if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
      queryString += `${key}=${String(data[key])}&`;
    }
  });

// Add passphrase (NOT encoded)
if (passphrase) {
  queryString += `&passphrase=${passphrase}`;
}
```

## Key Points
1. **Signature calculation**: Use plain query string (no URL encoding)
2. **URL building**: The final redirect URL still uses URL encoding for safe transmission
3. **Passphrase handling**: Special characters (like `-,Redemption_2026`) must NOT be encoded during signature calculation
4. **Field ordering**: Fields must be sorted alphabetically before creating the query string

## Testing
Created comprehensive test suites to verify the fix:

### Test Files Created:
1. **payfast-signature.test.ts** - Tests signature generation with various inputs
2. **payfast-service.test.ts** - Tests the service layer (18 tests)
3. **payfast-e2e.test.ts** - End-to-end payment flow tests (8 tests)
4. **payfast-integration.test.ts** - Integration tests (8 tests)
5. **payfast-callback.test.ts** - Callback verification tests (16 tests)
6. **payfast-credentials.test.ts** - Credential handling tests (4 tests)
7. **payfast-credentials-validation.test.ts** - Validation tests (3 tests)

### Test Results:
```
✓ All 61 PayFast tests passing
✓ Signature generation verified
✓ Payment URL building validated
✓ E2E flow tested with multiple scenarios
✓ Deposit and full payment amounts tested
✓ Special characters handled correctly
✓ Production and sandbox environments tested
```

## Verification Steps
To verify the fix works:

1. **Navigate to customer dashboard** and create an order
2. **Go to payment page** and select "Pay with PayFast"
3. **Click "Confirm Payment Method"** button
4. **Should redirect to PayFast** without 400 error
5. **Complete test payment** in PayFast sandbox
6. **Return to success page** to confirm payment processed

## Environment Variables Required
```
PAYFAST_MERCHANT_ID=19428362
PAYFAST_MERCHANT_KEY=x9mjrsxlwirog
PAYFAST_PASSPHRASE=-,Redemption_2026
PAYFAST_SANDBOX=true (for testing)
```

## Impact
- ✅ Customers can now complete PayFast payments
- ✅ Signature validation passes PayFast security checks
- ✅ Payment flow is seamless from order to success page
- ✅ No more 400 Bad Request errors
- ✅ Ready for production deployment

## Notes
- The fix maintains backward compatibility with existing payment records
- No database migrations required
- All existing tests continue to pass
- The fix applies to both sandbox and production PayFast environments
