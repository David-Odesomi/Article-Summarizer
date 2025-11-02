# Testing the License Verification System

## 🧪 Complete Testing Guide

### Step 1: Deploy Backend to Vercel

```bash
cd api
vercel --prod
```

Make sure environment variables are set:
- `PADDLE_VENDOR_ID`
- `PADDLE_AUTH_CODE`
- `PADDLE_PRODUCT_ID`

### Step 2: Test Backend Directly

#### Option A: Using Node.js Test Script

```bash
cd api
node test-paddle.js
```

#### Option B: Using curl

```bash
# Test with invalid key
curl -X POST https://article-summarizer-tan-two.vercel.app/verify \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"INVALID-KEY-12345"}'

# Test with your real Paddle license key
curl -X POST https://article-summarizer-tan-two.vercel.app/verify \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"YOUR-PADDLE-LICENSE-KEY"}'
```

Expected responses:
- **Valid:** `{"valid":true,"success":true,"message":"License key is valid"}`
- **Invalid:** `{"valid":false,"success":false,"message":"Invalid or expired license key"}`

### Step 3: Test from Extension Console

1. **Open your extension** in Chrome
2. **Open Developer Tools** (F12 or Ctrl+Shift+I)
3. **Go to Console tab**
4. **Paste and run this test:**

```javascript
// Test License Verification from Extension Console
async function testExtensionLicenseVerification() {
  console.clear();
  console.log('🧪 Starting License Verification Test...\n');
  
  const BACKEND_URL = 'https://article-summarizer-tan-two.vercel.app/verify';
  
  // Test 1: Invalid Key
  console.log('Test 1: Invalid License Key');
  try {
    const response1 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: 'INVALID-KEY-12345' })
    });
    const data1 = await response1.json();
    console.log('Response:', data1);
    console.log(data1.valid ? '✅ VALID' : '❌ INVALID');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n---\n');
  
  // Test 2: Your Real Paddle License Key
  console.log('Test 2: Real Paddle License Key');
  const YOUR_LICENSE_KEY = 'YOUR-REAL-PADDLE-LICENSE-KEY-HERE'; // Replace this
  
  try {
    const response2 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: YOUR_LICENSE_KEY })
    });
    const data2 = await response2.json();
    console.log('Response:', data2);
    console.log(data2.valid ? '✅ VALID' : '❌ INVALID');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n✓ Tests Complete');
}

// Run the test
testExtensionLicenseVerification();
```

### Step 4: Test Complete Upgrade Flow

1. **Open Extension** → Click Settings
2. **Check Console** - You should see:
   ```
   [PADDLE] Paddle initialized
   ```

3. **Click "💎 Upgrade to Pro"** - Console should show:
   ```
   [PADDLE] 🚀 Opening Paddle checkout modal...
   [PADDLE] Product ID: YOUR_PRODUCT_ID_HERE
   ```

4. **Complete Payment** (use Paddle test mode) - Console should show:
   ```
   [PADDLE] ✅ Payment successful! {data...}
   [BANNER] 🎉 Showing success banner
   ```

5. **Success Banner** should appear at top and fade out after 5 seconds

6. **Enter License Key** received via email

7. **Click "Verify & Save License"** - Console should show:
   ```
   [VERIFY] 🔍 Starting license verification...
   [VERIFY] Backend URL: https://...
   [VERIFY] Response status: 200
   [VERIFY] Response data: {"valid":true,...}
   [VERIFY] ✅ License key is VALID
   ```

### Step 5: Verify Pro Status

After successful license activation:

1. **Go back to main popup**
2. **Usage counter** should show: "✨ Pro: Unlimited summaries"
3. **Try summarizing** multiple times - no limits
4. **Check console** - no limit warnings

## 📋 Expected Console Logs

### Successful Payment Flow:
```
[PADDLE] 🚀 Opening Paddle checkout modal...
[PADDLE] Product ID: pri_01xxxxx
[PADDLE] ✅ Payment successful!
[BANNER] 🎉 Showing success banner
[BANNER] 👋 Fading out banner... (after 4.5s)
[BANNER] ✓ Banner hidden (after 5s)
```

### Successful License Verification:
```
[VERIFY] 🔍 Starting license verification...
[VERIFY] Backend URL: https://article-summarizer-tan-two.vercel.app/verify
[VERIFY] Response status: 200
[VERIFY] Response data: {
  "valid": true,
  "success": true,
  "message": "License key is valid"
}
[VERIFY] ✅ License key is VALID
```

### Backend Logs (on Vercel):
```
[VERIFY] Received verification request for license key
[VERIFY] Verifying license key with Paddle API...
[VERIFY] Paddle API response: {
  "success": true,
  "response": { ... }
}
[VERIFY] ✅ License key is VALID
```

## 🐛 Troubleshooting

### Issue: "paddle_configured: false"
**Solution:** Check Vercel environment variables are set correctly

### Issue: Network error calling Paddle API
**Solution:** 
- Verify `PADDLE_VENDOR_ID` and `PADDLE_AUTH_CODE` are correct
- Check Paddle Dashboard for API status

### Issue: Banner doesn't show
**Solution:** 
- Check console for `[BANNER]` logs
- Verify `successBanner` element exists in HTML

### Issue: License always returns invalid
**Solution:**
- Test with a real Paddle license key from your dashboard
- Check console logs for exact error message from Paddle
- Verify `PADDLE_PRODUCT_ID` matches your product

## 🎯 Success Criteria

All these should work:
- ✅ Health check returns `paddle_configured: true`
- ✅ Invalid keys return `valid: false`
- ✅ Valid Paddle keys return `valid: true`
- ✅ Paddle checkout opens successfully
- ✅ Success banner appears and fades after 5 seconds
- ✅ License verification saves to storage
- ✅ Pro status shows in popup
- ✅ No usage limits for Pro users
- ✅ All console logs appear correctly

## 📝 Notes

- Use Paddle Sandbox/Test mode for testing
- Get test license keys from Paddle Dashboard → Sandbox
- Monitor Vercel logs for backend debugging
- Check Network tab for API request/response details
