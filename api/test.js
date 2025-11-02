// Simple test script for the license API
const testEndpoint = async (url, licenseKey) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey })
    });

    const data = await response.json();
    console.log(`Testing key: ${licenseKey}`);
    console.log(`Result:`, data);
    console.log('---');
    return data;
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing License API\n');
  console.log(`Endpoint: ${baseUrl}/verify\n`);

  // Test valid key
  await testEndpoint(`${baseUrl}/verify`, 'PRO-2024-XXXX-XXXX-XXXX');

  // Test invalid key
  await testEndpoint(`${baseUrl}/verify`, 'INVALID-KEY');

  // Test empty key
  await testEndpoint(`${baseUrl}/verify`, '');

  // Test case insensitive
  await testEndpoint(`${baseUrl}/verify`, 'pro-2024-xxxx-xxxx-xxxx');

  console.log('✅ Tests complete');
};

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testEndpoint, runTests };
