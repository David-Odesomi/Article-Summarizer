const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for Chrome extension
app.use(express.json());

// Valid license keys (in production, use a database or environment variables)
const VALID_KEYS = [
  'PRO-2024-XXXX-XXXX-XXXX',
  'PRO-2024-YYYY-YYYY-YYYY',
  'PRO-2024-ZZZZ-ZZZZ-ZZZZ',
  // Add more keys as needed
];

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Article Summarizer License API',
    version: '1.0.0'
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
