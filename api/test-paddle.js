// Test script for Paddle License API verification
// Run this to test your /verify endpoint

const BACKEND_URL = 'https://article-summarizer-tan-two.vercel.app/verify';
// or use 'http://localhost:3000/verify' for local testing

async function testLicenseVerification(licenseKey, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`License Key: ${licenseKey}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey })
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.valid) {
      console.log('✅ Result: VALID LICENSE');
    } else {
      console.log('❌ Result: INVALID LICENSE');
    }
    
    return data;
  } catch (error) {
    console.error('⚠️ Error:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Paddle License Verification Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Test 1: Invalid key
  await testLicenseVerification('INVALID-KEY-12345', 'Invalid License Key');

  // Test 2: Empty key
  await testLicenseVerification('', 'Empty License Key');

  // Test 3: Replace with your real Paddle test license key
  await testLicenseVerification('YOUR-TEST-LICENSE-KEY-HERE', 'Real Paddle Test Key');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Tests Complete                                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testLicenseVerification, runTests };
