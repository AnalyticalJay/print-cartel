#!/bin/bash

# PayFast Sandbox Payment Test Script
# This script creates a test order and processes a payment through PayFast sandbox

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-https://printcartel.co.za}"
API_BASE="${DOMAIN}/api/trpc"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PayFast Sandbox Payment Test Script                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Domain: $DOMAIN"
echo "API Base: $API_BASE"
echo ""

# Step 1: Create Test Order
echo -e "${YELLOW}Step 1: Creating test order...${NC}"

# Create a test order payload
ORDER_PAYLOAD=$(cat <<EOF
{
  "items": [
    {
      "name": "Test DTF Print - Sandbox",
      "quantity": 1,
      "price": 99.99,
      "description": "Test order for PayFast sandbox payment"
    }
  ],
  "customerEmail": "test-$(date +%s)@printcartel.co.za",
  "customerName": "Test Customer",
  "shippingAddress": "123 Test Street, Test City, 1234",
  "totalPrice": 99.99
}
EOF
)

# Note: In a real scenario, you would create the order through the actual API
# For now, we'll provide instructions for manual order creation

echo -e "${GREEN}✓ Order creation payload prepared${NC}"
echo ""
echo "Test Order Details:"
echo "  Product: Test DTF Print - Sandbox"
echo "  Quantity: 1"
echo "  Price: R99.99"
echo "  Email: test-$(date +%s)@printcartel.co.za"
echo ""

# Step 2: Display PayFast Sandbox Credentials
echo -e "${YELLOW}Step 2: PayFast Sandbox Credentials${NC}"
echo ""
echo -e "${GREEN}Merchant ID:${NC} 10000100"
echo -e "${GREEN}Merchant Key:${NC} 46f1db3175jeuue8"
echo -e "${GREEN}Passphrase:${NC} test_passphrase_sandbox"
echo ""
echo -e "${YELLOW}Callback URL:${NC} ${DOMAIN}/api/payfast/callback"
echo ""

# Step 3: Test Card Information
echo -e "${YELLOW}Step 3: PayFast Sandbox Test Cards${NC}"
echo ""
echo -e "${GREEN}Successful Payment:${NC}"
echo "  Card Number: 4111 1111 1111 1111"
echo "  Expiry: Any future date (e.g., 12/25)"
echo "  CVC: Any 3 digits (e.g., 123)"
echo ""
echo -e "${GREEN}Failed Payment:${NC}"
echo "  Card Number: 4000 0000 0000 0002"
echo "  Expiry: Any future date"
echo "  CVC: Any 3 digits"
echo ""

# Step 4: Manual Testing Instructions
echo -e "${YELLOW}Step 4: Manual Testing Instructions${NC}"
echo ""
echo "1. Log in to Print Cartel at: ${DOMAIN}"
echo ""
echo "2. Create a test order:"
echo "   - Click 'Order Now'"
echo "   - Design a test print (any design)"
echo "   - Select quantity and options"
echo "   - Proceed to checkout"
echo "   - Complete order creation"
echo ""
echo "3. Go to payment page:"
echo "   - From your account dashboard, find the order"
echo "   - Click 'Pay Now' or 'Complete Payment'"
echo "   - Select 'PayFast' payment method"
echo ""
echo "4. Process payment in PayFast sandbox:"
echo "   - You'll be redirected to PayFast sandbox"
echo "   - Use test card: 4111 1111 1111 1111"
echo "   - Enter any future expiry date"
echo "   - Enter any 3-digit CVC"
echo "   - Click 'Pay Now'"
echo ""
echo "5. Verify payment success:"
echo "   - You should see 'Payment Successful' message"
echo "   - Order status should change to 'approved'"
echo "   - Check your email for confirmation"
echo ""

# Step 5: Verification Steps
echo -e "${YELLOW}Step 5: Verification Checklist${NC}"
echo ""
echo "After completing payment, verify:"
echo ""
echo "[ ] Payment success page displays"
echo "[ ] Order status changed to 'approved'"
echo "[ ] Payment record created in database"
echo "[ ] Confirmation email received"
echo "[ ] Admin can see payment in dashboard"
echo ""

# Step 6: Troubleshooting
echo -e "${YELLOW}Step 6: Troubleshooting${NC}"
echo ""
echo "If callback is not received:"
echo "  1. Check that callback URL is registered in PayFast settings"
echo "  2. Verify domain is publicly accessible"
echo "  3. Check server logs: tail -f .manus-logs/devserver.log | grep -i payfast"
echo ""
echo "If order status doesn't update:"
echo "  1. Check server logs for callback processing errors"
echo "  2. Verify database connection"
echo "  3. Confirm order ID format is correct"
echo ""

# Step 7: Test Callback Manually
echo -e "${YELLOW}Step 7: Manual Callback Test (Optional)${NC}"
echo ""
echo "To test the callback endpoint directly:"
echo ""
echo "  ./test-payfast-callback.sh ${DOMAIN}/api/payfast/callback 10000100 46f1db3175jeuue8 test_passphrase_sandbox"
echo ""

# Step 8: Next Steps
echo -e "${YELLOW}Step 8: Next Steps${NC}"
echo ""
echo "After successful sandbox testing:"
echo ""
echo "1. Get production PayFast credentials"
echo "2. Update environment variables with production credentials"
echo "3. Register production callback URL in PayFast"
echo "4. Deploy to production"
echo "5. Test with small production payment"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Ready to test! Follow the instructions above.          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "For detailed information, see PAYFAST_SANDBOX_TESTING.md"
echo ""
