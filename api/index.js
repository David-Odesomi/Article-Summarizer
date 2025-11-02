const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Paddle Configuration from Environment Variables
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
const PADDLE_AUTH_CODE = process.env.PADDLE_AUTH_CODE || process.env.PADDLE_API_KEY;
const PADDLE_PRODUCT_ID = process.env.PADDLE_PRODUCT_ID;

// Valid license keys from environment or hardcoded fallback
const VALID_KEYS = process.env.VALID_KEYS 
  ? process.env.VALID_KEYS.split(',').map(key => key.trim())
  : [
      'TEST-LICENSE-KEY',
      'PRO-2024-DEMO-KEY',
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

// License verification endpoint
app.post('/verify', async (req, res) => {
  try {
    const { licenseKey, key } = req.body;
    const keyToVerify = licenseKey || key;

    console.log('[VERIFY] Received verification request');

    // Validate input
    if (!keyToVerify || typeof keyToVerify !== 'string') {
      console.log('[VERIFY] Error: No license key provided');
      return res.status(400).json({
        valid: false,
        error: 'License key is required'
      });
    }

    const normalizedKey = keyToVerify.trim().toUpperCase();
    console.log(`[VERIFY] Verifying license key...`);

    // Check against valid keys (case-insensitive)
    const isValid = VALID_KEYS.some(
      validKey => validKey.toUpperCase() === normalizedKey
    );

    console.log(`[VERIFY] License key is ${isValid ? 'VALID' : 'INVALID'}`);

    return res.json({
      valid: isValid,
      success: isValid,
      message: isValid ? 'License key is valid' : 'Invalid or expired license key'
    });

  } catch (error) {
    console.error('[VERIFY] Unexpected error:', error.message);
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
