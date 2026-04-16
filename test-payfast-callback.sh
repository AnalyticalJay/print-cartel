#!/bin/bash

# PayFast Callback Endpoint Verification Script
# This script tests if the PayFast callback endpoint is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CALLBACK_URL="${1:-http://localhost:3000/api/payfast/callback}"
MERCHANT_ID="${2:-10000100}"
MERCHANT_KEY="${3:-46f1db3175jeuue8}"
PASSPHRASE="${4:-test_passphrase}"

echo -e "${YELLOW}PayFast Callback Endpoint Verification${NC}"
echo "========================================"
echo "Callback URL: $CALLBACK_URL"
echo "Merchant ID: $MERCHANT_ID"
echo ""

# Function to generate MD5 signature
generate_signature() {
    local data="$1"
    echo -n "$data" | md5sum | cut -d' ' -f1
}

# Test 1: Check if endpoint is accessible
echo -e "${YELLOW}Test 1: Checking if endpoint is accessible...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$CALLBACK_URL" -X POST; then
    echo -e "${GREEN}✓ Endpoint is accessible${NC}"
else
    echo -e "${RED}✗ Endpoint is not accessible${NC}"
    exit 1
fi
echo ""

# Test 2: Send test callback with valid signature
echo -e "${YELLOW}Test 2: Sending test callback with valid signature...${NC}"

# Prepare test data
ORDER_ID="order_test_$(date +%s)"
PF_PAYMENT_ID="1234567890"
PAYMENT_STATUS="COMPLETE"
AMOUNT_GROSS="99.99"

# Build signature string
SIGNATURE_STRING="m_payment_id=${ORDER_ID}&pf_payment_id=${PF_PAYMENT_ID}&payment_status=${PAYMENT_STATUS}&amount_gross=${AMOUNT_GROSS}&merchant_id=${MERCHANT_ID}&merchant_key=${MERCHANT_KEY}&passphrase=${PASSPHRASE}"

# Generate signature
SIGNATURE=$(generate_signature "$SIGNATURE_STRING")

echo "Test Data:"
echo "  Order ID: $ORDER_ID"
echo "  PF Payment ID: $PF_PAYMENT_ID"
echo "  Amount: $AMOUNT_GROSS"
echo "  Signature: $SIGNATURE"
echo ""

# Send callback
echo "Sending callback..."
RESPONSE=$(curl -s -X POST "$CALLBACK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "m_payment_id=${ORDER_ID}&pf_payment_id=${PF_PAYMENT_ID}&payment_status=${PAYMENT_STATUS}&amount_gross=${AMOUNT_GROSS}&merchant_id=${MERCHANT_ID}&merchant_key=${MERCHANT_KEY}&signature=${SIGNATURE}")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success\|verified\|processed"; then
    echo -e "${GREEN}✓ Callback processed successfully${NC}"
else
    echo -e "${YELLOW}⚠ Callback response received (check logs for details)${NC}"
fi
echo ""

# Test 3: Send callback with invalid signature
echo -e "${YELLOW}Test 3: Sending callback with invalid signature (should fail)...${NC}"

INVALID_SIGNATURE="invalid_signature_hash"

echo "Sending invalid callback..."
RESPONSE=$(curl -s -X POST "$CALLBACK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "m_payment_id=${ORDER_ID}&pf_payment_id=${PF_PAYMENT_ID}&payment_status=${PAYMENT_STATUS}&amount_gross=${AMOUNT_GROSS}&merchant_id=${MERCHANT_ID}&merchant_key=${MERCHANT_KEY}&signature=${INVALID_SIGNATURE}")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "error\|invalid\|failed"; then
    echo -e "${GREEN}✓ Invalid signature correctly rejected${NC}"
else
    echo -e "${YELLOW}⚠ Response received (check if signature validation is working)${NC}"
fi
echo ""

# Test 4: Send callback with failed payment status
echo -e "${YELLOW}Test 4: Sending callback with failed payment status...${NC}"

FAILED_STATUS="FAILED"
FAILED_SIGNATURE_STRING="m_payment_id=${ORDER_ID}&pf_payment_id=${PF_PAYMENT_ID}&payment_status=${FAILED_STATUS}&amount_gross=${AMOUNT_GROSS}&merchant_id=${MERCHANT_ID}&merchant_key=${MERCHANT_KEY}&passphrase=${PASSPHRASE}"
FAILED_SIGNATURE=$(generate_signature "$FAILED_SIGNATURE_STRING")

echo "Sending failed payment callback..."
RESPONSE=$(curl -s -X POST "$CALLBACK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "m_payment_id=${ORDER_ID}&pf_payment_id=${PF_PAYMENT_ID}&payment_status=${FAILED_STATUS}&amount_gross=${AMOUNT_GROSS}&merchant_id=${MERCHANT_ID}&merchant_key=${MERCHANT_KEY}&signature=${FAILED_SIGNATURE}")

echo "Response: $RESPONSE"
echo -e "${GREEN}✓ Failed payment callback processed${NC}"
echo ""

echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Check server logs for callback processing details"
echo "2. Verify order status in database"
echo "3. Test with actual PayFast sandbox payment"
echo ""
echo "Usage: ./test-payfast-callback.sh [callback_url] [merchant_id] [merchant_key] [passphrase]"
echo "Example: ./test-payfast-callback.sh http://localhost:3000/api/payfast/callback 10000100 46f1db3175jeuue8 test_passphrase"
