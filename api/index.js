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
      'PRO-2024-XXXX-XXXX-XXXX',
      'PRO-2024-YYYY-YYYY-YYYY',
      'PRO-2024-ZZZZ-ZZZZ-ZZZZ',
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
app.post('/verify', (req, res) => {
  try {
    const { licenseKey, key } = req.body;
    const keyToVerify = licenseKey || key;

    // Validate input
    if (!keyToVerify || typeof keyToVerify !== 'string') {
      return res.status(400).json({
        valid: false,
        error: 'License key is required'
      });
    }

    // Trim and normalize the key
    const normalizedKey = keyToVerify.trim().toUpperCase();

    // Check if key exists in valid keys
    const isValid = VALID_KEYS.some(
      validKey => validKey.toUpperCase() === normalizedKey
    );

    // Log verification attempt (in production, use proper logging)
    console.log(`License verification: ${normalizedKey} - ${isValid ? 'VALID' : 'INVALID'}`);

    // Return result
    res.json({
      valid: isValid,
      success: isValid, // Alternative format for compatibility
      ...(isValid && { message: 'License key is valid' }),
      ...(!isValid && { message: 'Invalid or expired license key' })
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
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
