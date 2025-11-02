const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Paddle Configuration from Environment Variables
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
const PADDLE_AUTH_CODE = process.env.PADDLE_AUTH_CODE || process.env.PADDLE_API_KEY;
const PADDLE_PRODUCT_ID = process.env.PADDLE_PRODUCT_ID;

// Valid license keys from environment or hardcoded fallback (DEPRECATED - now using Paddle API)
// Keeping for backward compatibility or local testing
const VALID_KEYS = process.env.VALID_KEYS 
  ? process.env.VALID_KEYS.split(',').map(key => key.trim())
  : [
      // 'PRO-2024-XXXX-XXXX-XXXX', // Commented out - now using Paddle API
    ];

// Middleware
app.use(cors()); // Enable CORS for Chrome extension
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Article Summarizer License API',
    version: '1.0.0',
    paddle_configured: !!(PADDLE_VENDOR_ID && PADDLE_AUTH_CODE && PADDLE_PRODUCT_ID)
  });
});

// License verification endpoint using Paddle API
app.post('/verify', async (req, res) => {
  try {
    const { licenseKey, key } = req.body;
    const keyToVerify = licenseKey || key;

    console.log('[VERIFY] Received verification request for license key');

    // Validate input
    if (!keyToVerify || typeof keyToVerify !== 'string') {
      console.log('[VERIFY] Error: No license key provided');
      return res.status(400).json({
        valid: false,
        error: 'License key is required'
      });
    }

    // Check if Paddle credentials are configured
    if (!PADDLE_VENDOR_ID || !PADDLE_AUTH_CODE) {
      console.error('[VERIFY] Error: Paddle credentials not configured');
      return res.status(500).json({
        valid: false,
        error: 'Server configuration error'
      });
    }

    const normalizedKey = keyToVerify.trim();
    console.log(`[VERIFY] Verifying license key with Paddle API...`);

    // Verify with Paddle License API
    try {
      const paddleResponse = await fetch('https://vendors.paddle.com/api/2.0/license/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          vendor_id: PADDLE_VENDOR_ID,
          vendor_auth_code: PADDLE_AUTH_CODE,
          product_id: PADDLE_PRODUCT_ID || '',
          license_code: normalizedKey
        })
      });

      const paddleData = await paddleResponse.json();
      console.log('[VERIFY] Paddle API response:', JSON.stringify(paddleData, null, 2));

      // Check if Paddle verification was successful
      if (paddleData.success === true) {
        console.log('[VERIFY] ✅ License key is VALID');
        return res.json({
          valid: true,
          success: true,
          message: 'License key is valid'
        });
      } else {
        console.log('[VERIFY] ❌ License key is INVALID:', paddleData.error?.message || 'Unknown error');
        return res.json({
          valid: false,
          success: false,
          message: paddleData.error?.message || 'Invalid or expired license key'
        });
      }

    } catch (paddleError) {
      console.error('[VERIFY] ⚠️ Network error calling Paddle API:', paddleError.message);
      
      // Fallback to static keys if Paddle API fails
      if (VALID_KEYS && VALID_KEYS.length > 0) {
        const normalizedStatic = normalizedKey.toUpperCase();
        const isValidStatic = VALID_KEYS.some(
          validKey => validKey.toUpperCase() === normalizedStatic
        );
        
        console.log(`[VERIFY] Fallback to static keys: ${isValidStatic ? 'VALID' : 'INVALID'}`);
        
        return res.json({
          valid: isValidStatic,
          success: isValidStatic,
          message: isValidStatic ? 'License key is valid (cached)' : 'Invalid or expired license key',
          fallback: true
        });
      }
      
      // If no fallback available
      return res.status(503).json({
        valid: false,
        error: 'Unable to verify license at this time. Please try again later.'
      });
    }

  } catch (error) {
    console.error('[VERIFY] ⚠️ Unexpected error:', error.message);
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Start server (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`License API running on port ${PORT}`);
    console.log(`Test it: POST http://localhost:${PORT}/verify`);
  });
}

// Export for serverless deployment (Vercel)
module.exports = app;
