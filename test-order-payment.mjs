import crypto from 'crypto';

// Test PayFast signature generation
function generateSignature(data, passphrase) {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((acc, key) => {
      if (data[key]) {
        acc[key] = data[key];
      }
      return acc;
    }, {});

  let queryString = Object.entries(sortedData)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  if (passphrase) {
    queryString += `&passphrase=${passphrase}`;
  }

  console.log('Query string:', queryString);
  const signature = crypto.createHash('md5').update(queryString).digest('hex');
  return signature;
}

// Test data
const testData = {
  merchant_id: '19428362',
  merchant_key: 'x9mjrsxlwirog',
  return_url: 'https://printcartel.co.za/order/success',
  cancel_url: 'https://printcartel.co.za/order/cancel',
  notify_url: 'https://printcartel.co.za/api/payfast/notify',
  name_first: 'Test',
  name_last: 'Customer',
  email_address: 'test@example.com',
  m_payment_id: 'order-12345',
  amount: '500.00',
  item_name: 'Order #12345',
  item_description: 'Test payment',
  custom_int1: '12345',
  custom_str1: 'test@example.com',
};

const passphrase = '-.Redemption_2026';

console.log('🧪 Testing PayFast Signature Generation\n');
console.log('Merchant ID:', testData.merchant_id);
console.log('Amount:', testData.amount);
console.log('Passphrase:', passphrase);
console.log('');

const signature = generateSignature(testData, passphrase);
console.log('Generated Signature:', signature);

// Build payment URL
const queryParts = Object.entries(testData)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join("&");

const paymentUrl = `https://www.payfast.co.za/eng/process?${queryParts}&signature=${signature}`;
console.log('\n✅ Payment URL (first 150 chars):', paymentUrl.substring(0, 150) + '...');
console.log('\n✅ Full payment URL can be tested in browser');
