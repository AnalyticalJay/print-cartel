import https from 'https';
import { URL } from 'url';

// Test URL from previous generation
const paymentUrl = 'https://www.payfast.co.za/eng/process?merchant_id=19428362&merchant_key=x9mjrsxlwirog&return_url=https%3A%2F%2Fprintcartel.co.za%2Fpayment%2Fsuccess&cancel_url=https%3A%2F%2Fprintcartel.co.za%2Fpayment%2Fcancel&notify_url=https%3A%2F%2Fprintcartel.co.za%2Fapi%2Fpayfast%2Fnotify&name_first=Test&name_last=Customer&email_address=test%40printcartel.co.za&m_payment_id=order-99999&amount=500.00&item_name=Invoice%20for%20Order%20%2399999&item_description=Payment%20for%20DTF%20printing%20order&custom_int1=99999&custom_str1=test%40printcartel.co.za&signature=e199c68370741a53c30d502484de2860';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🌐 TESTING PAYFAST REDIRECT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Testing URL accessibility...\n');

const url = new URL(paymentUrl);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'HEAD',
  timeout: 10000,
};

https.request(options, (res) => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PAYFAST RESPONSE:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  console.log('');
  
  if (res.statusCode === 200) {
    console.log('✅ SUCCESS! PayFast accepted the request.');
    console.log('   No 400 Bad Request error - signature is valid!');
  } else if (res.statusCode === 301 || res.statusCode === 302) {
    console.log('✅ REDIRECT! PayFast is redirecting (expected behavior).');
    console.log(`   Location: ${res.headers.location}`);
  } else if (res.statusCode === 400) {
    console.log('❌ ERROR! PayFast returned 400 Bad Request.');
    console.log('   This means the signature verification failed.');
  } else {
    console.log(`ℹ️  PayFast returned status ${res.statusCode}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📋 RESPONSE HEADERS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  Object.entries(res.headers).forEach(([key, value]) => {
    if (key !== 'set-cookie') {
      console.log(`${key}: ${value}`);
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Next Steps:');
  console.log('1. If you got a 200 or 3xx response, the signature is VALID');
  console.log('2. Open the payment URL in a browser to complete the test');
  console.log('3. You should see the PayFast payment form');
  console.log('4. If you see a 400 error in the browser, check the signature');
  console.log('');
  
}).on('error', (error) => {
  console.log('❌ ERROR:', error.message);
  console.log('\nThis might be a network issue. Try opening the URL in a browser.');
});
